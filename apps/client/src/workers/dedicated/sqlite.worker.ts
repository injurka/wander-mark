/// <reference lib="webworker" />
import type { DbWorkerFunctions, MainThreadFunctions, SearchResultItem, TextFilePayload } from '~/shared/types/rpc'
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { createBirpc } from 'birpc'

declare const self: DedicatedWorkerGlobalScope

const functions: DbWorkerFunctions = {
  initDb,
  syncTextBatch,
  writeMedia,
  getFile,
  deleteFile,
  searchFTS,
  deleteVault,
}

const rpc = createBirpc<MainThreadFunctions, DbWorkerFunctions>(functions, {
  post: data => self.postMessage(data),
  on: fn => self.addEventListener('message', event => fn(event.data)),
})

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>

let db: InstanceType<Sqlite3['oo1']['OpfsDb']> | null = null

function createSchema(database: InstanceType<Sqlite3['oo1']['OpfsDb']>) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS files (
      vault_id TEXT NOT NULL,
      path TEXT NOT NULL,
      content TEXT,
      last_modified INTEGER,
      PRIMARY KEY (vault_id, path)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      vault_id UNINDEXED,
      path UNINDEXED,
      title,
      tags,
      content,
      tokenize="unicode61"
    );
  `)
}

async function initDb(): Promise<void> {
  if (db)
    return

  const sqlite3 = await (sqlite3InitModule as (config?: object) => ReturnType<typeof sqlite3InitModule>)({
    print: () => {},
    printErr: (e: unknown) => console.error('[sqlite]', e),
  })
  if (!('OpfsDb' in sqlite3.oo1))
    throw new Error('OPFS недоступен в этом окружении')

  db = new sqlite3.oo1.OpfsDb('/wander-mark.db', 'c')

  createSchema(db)
}

function requireDb() {
  if (!db)
    throw new Error('БД не инициализирована. Вызовите initDb()')

  return db
}

/** Извлекает title/tags из search.json батча и перестраивает FTS-индекс хранилища */
function rebuildFtsFromSearchJson(database: ReturnType<typeof requireDb>, vaultId: string, searchJson: string) {
  let items: Array<{ title?: string, url?: string, id?: string, tags?: string[] | string, content?: string }>

  try {
    items = JSON.parse(searchJson)
  }
  catch {
    return
  }
  if (!Array.isArray(items))
    return

  database.exec({ sql: 'DELETE FROM search_index WHERE vault_id = ?', bind: [vaultId] })
  const stmt = database.prepare('INSERT INTO search_index (vault_id, path, title, tags, content) VALUES (?, ?, ?, ?, ?)')

  try {
    for (const item of items) {
      const path = item.url || item.id
      if (!path)
        continue
      const tags = Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || '')
      stmt.bind([vaultId, path, item.title || '', tags, item.content || ''])
      stmt.step()
      stmt.reset()
    }
  }
  finally {
    stmt.finalize()
  }
}

async function syncTextBatch(vaultId: string, files: TextFilePayload[]): Promise<void> {
  const database = requireDb()

  database.exec('BEGIN TRANSACTION')

  try {
    const upsert = database.prepare(`
      INSERT INTO files (vault_id, path, content, last_modified) VALUES (?, ?, ?, ?)
      ON CONFLICT (vault_id, path) DO UPDATE SET content = excluded.content, last_modified = excluded.last_modified
    `)

    try {
      let processed = 0
      for (const file of files) {
        upsert.bind([vaultId, file.path, file.content, file.lastModified ?? Date.now()])
        upsert.step()
        upsert.reset()

        processed++
        if (processed % 25 === 0)
          rpc.onSyncProgress(vaultId, Math.round((processed / files.length) * 100))
      }
    }
    finally {
      upsert.finalize()
    }

    // Если в батче пришел search.json — перестраиваем FTS-индекс по нему (title/tags/content)
    const searchFile = files.find(f => f.path.endsWith('search.json'))
    if (searchFile)
      rebuildFtsFromSearchJson(database, vaultId, searchFile.content)

    database.exec('COMMIT')
  }
  catch (e) {
    database.exec('ROLLBACK')
    throw e
  }
}

/** OPFS-директория для бинарных медиа (раздаются через Service Worker /opfs-media/) */
async function getMediaDir(vaultId: string, dirs: string[], create: boolean): Promise<FileSystemDirectoryHandle> {
  let dir = await navigator.storage.getDirectory()
  dir = await dir.getDirectoryHandle('media', { create })
  dir = await dir.getDirectoryHandle(vaultId, { create })
  for (const part of dirs)
    dir = await dir.getDirectoryHandle(part, { create })
  return dir
}

async function writeMedia(vaultId: string, path: string, data: ArrayBuffer): Promise<void> {
  const parts = path.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName)
    return
  const dir = await getMediaDir(vaultId, parts, true)
  const handle = await dir.getFileHandle(fileName, { create: true })
  const accessHandle = await (handle as any).createSyncAccessHandle()
  try {
    accessHandle.truncate(0)
    accessHandle.write(data, { at: 0 })
    accessHandle.flush()
  }
  finally {
    accessHandle.close()
  }
}

async function getFile(vaultId: string, path: string): Promise<string | null> {
  const database = requireDb()
  const rows = database.exec({
    sql: 'SELECT content FROM files WHERE vault_id = ? AND path = ?',
    bind: [vaultId, path],
    returnValue: 'resultRows',
  })
  if (!rows.length)
    return null
  return rows[0][0] as string
}

async function deleteFile(vaultId: string, path: string): Promise<void> {
  const database = requireDb()
  database.exec({ sql: 'DELETE FROM files WHERE vault_id = ? AND path = ?', bind: [vaultId, path] })
  database.exec({ sql: 'DELETE FROM search_index WHERE vault_id = ? AND path = ?', bind: [vaultId, path] })
}

async function searchFTS(query: string, vaultId: string): Promise<SearchResultItem[]> {
  const database = requireDb()
  const tokens = query.trim().split(/\s+/).filter(t => t.length >= 2)
  if (!tokens.length)
    return []
  // Безопасная сборка FTS-запроса: каждый токен в кавычках, префиксный поиск
  const match = tokens.map(t => `"${t.replace(/"/g, '""')}"*`).join(' ')

  const rows = database.exec({
    sql: `
      SELECT path, title, tags, snippet(search_index, 4, '<mark>', '</mark>', '…', 48) AS snip, rank
      FROM search_index
      WHERE search_index MATCH ? AND vault_id = ?
      ORDER BY rank
      LIMIT 50
    `,
    bind: [match, vaultId],
    returnValue: 'resultRows',
  })
  return rows.map(r => ({
    path: r[0] as string,
    title: r[1] as string,
    tags: r[2] as string,
    snippet: r[3] as string,
    rank: r[4] as number,
  }))
}

async function deleteVault(vaultId: string): Promise<void> {
  const database = requireDb()
  database.exec({ sql: 'DELETE FROM files WHERE vault_id = ?', bind: [vaultId] })
  database.exec({ sql: 'DELETE FROM search_index WHERE vault_id = ?', bind: [vaultId] })

  try {
    const root = await navigator.storage.getDirectory()
    const mediaDir = await root.getDirectoryHandle('media')
    await mediaDir.removeEntry(vaultId, { recursive: true })
  }
  catch { }
}
