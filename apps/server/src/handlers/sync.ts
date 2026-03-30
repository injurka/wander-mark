import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { CORS_HEADERS, DATA_DIR } from '../config'
import { withCors } from '../utils/cors'

export interface ReadLog {
  path: string
  title: string
  readDates: number[]
}

export async function handleSync(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { vaultId, logs } = body

    if (!vaultId || !Array.isArray(logs)) {
      return withCors(new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    await mkdir(DATA_DIR, { recursive: true })
    const dbFile = Bun.file(path.resolve(DATA_DIR, `sync-${vaultId}.json`))

    let serverLogs: ReadLog[] = []
    if (await dbFile.exists()) {
      serverLogs = await dbFile.json()
    }

    const mergedMap = new Map<string, ReadLog>()

    for (const log of serverLogs) {
      mergedMap.set(log.path, { ...log, readDates: [...log.readDates] })
    }

    for (const log of logs) {
      if (mergedMap.has(log.path)) {
        const existing = mergedMap.get(log.path)!
        // eslint-disable-next-line e18e/prefer-spread-syntax
        const combinedDates = Array.from(new Set([...existing.readDates, ...log.readDates])).sort((a, b) => a - b)

        existing.readDates = combinedDates
        existing.title = log.title || existing.title
      }
      else {
        mergedMap.set(log.path, { ...log, readDates: [...log.readDates] })
      }
    }

    const mergedLogs = [...mergedMap.values()]
    await Bun.write(dbFile, JSON.stringify(mergedLogs, null, 2))

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
