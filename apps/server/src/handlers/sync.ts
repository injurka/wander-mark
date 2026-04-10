import { CORS_HEADERS } from '../config'
import { db } from '../db'
import { withCors } from '../utils/cors'

export interface ReadLog {
  path: string
  title: string
  readDates: number[]
}

export async function handleSync(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { vaultId, identifier, logs } = body

    if (!vaultId || !Array.isArray(logs)) {
      return withCors(new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    const safeIdentifier = identifier
      // eslint-disable-next-line e18e/prefer-static-regex
      ? String(identifier).replace(/[^\w-]/g, '')
      : 'default'

    // 1. Получаем все существующие записи для этого юзера и хранилища
    const existingRows = db.query(`
      SELECT path, title, read_dates
      FROM reading_logs
      WHERE vault_id = $vaultId AND identifier = $identifier
    `).all({ $vaultId: vaultId, $identifier: safeIdentifier }) as any[]

    // 2. Строим Map для быстрого доступа
    const mergedMap = new Map<string, ReadLog>()
    for (const row of existingRows) {
      mergedMap.set(row.path, {
        path: row.path,
        title: row.title,
        readDates: JSON.parse(row.read_dates || '[]'),
      })
    }

    // 3. Мержим новые логи с существующими
    for (const log of logs) {
      if (mergedMap.has(log.path)) {
        const existing = mergedMap.get(log.path)!
        // eslint-disable-next-line e18e/prefer-spread-syntax
        const combinedDates = Array.from(new Set([...existing.readDates, ...log.readDates]))
          .sort((a, b) => a - b)
        existing.readDates = combinedDates
        existing.title = log.title || existing.title
      }
      else {
        mergedMap.set(log.path, { ...log, readDates: [...log.readDates] })
      }
    }

    const mergedLogs = [...mergedMap.values()]

    // 4. Подготавливаем запрос на вставку/обновление (Upsert)
    const upsert = db.prepare(`
      INSERT INTO reading_logs (vault_id, identifier, path, title, read_dates, updated_at)
      VALUES ($vaultId, $identifier, $path, $title, $readDates, CURRENT_TIMESTAMP)
      ON CONFLICT(vault_id, identifier, path) DO UPDATE SET
        title = excluded.title,
        read_dates = excluded.read_dates,
        updated_at = CURRENT_TIMESTAMP
    `)

    // 5. Выполняем запись в рамках одной транзакции (очень быстро)
    const transaction = db.transaction((logsToSave: ReadLog[]) => {
      for (const log of logsToSave) {
        upsert.run({
          $vaultId: vaultId,
          $identifier: safeIdentifier,
          $path: log.path,
          $title: log.title,
          $readDates: JSON.stringify(log.readDates),
        })
      }
    })

    transaction(mergedLogs)

    // Возвращаем объединенные логи клиенту
    return new Response(JSON.stringify(mergedLogs), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
  catch (error) {
    console.error('[Sync Error]', error)
    return withCors(new Response(JSON.stringify({ error: 'Internal sync error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
}
