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

    // 1. Получаем все существующие записи
    const existingLogs: Record<string, any> = {}
    for (const key in db.logs) {
      const row = db.logs[key]
      if (row.vault_id === vaultId && row.identifier === safeIdentifier) {
        existingLogs[row.path] = row
      }
    }

    // 2. Строим Map для быстрого доступа
    const mergedMap = new Map<string, ReadLog>()
    for (const rowPath in existingLogs) {
      const row = existingLogs[rowPath]
      mergedMap.set(row.path, {
        path: row.path,
        title: row.title,
        readDates: Array.isArray(row.read_dates) ? row.read_dates : JSON.parse(row.read_dates || '[]'),
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

    // 4. Обновляем в памяти
    for (const log of mergedLogs) {
      const dbKey = `${vaultId}:${safeIdentifier}:${log.path}`
      db.logs[dbKey] = {
        vault_id: vaultId,
        identifier: safeIdentifier,
        path: log.path,
        title: log.title,
        read_dates: log.readDates,
        updated_at: new Date().toISOString(),
      }
    }

    await db.saveLogsDb()

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
