import { stat } from 'node:fs/promises'
import path from 'node:path'

const PORT = Number.parseInt(process.env.PORT || '8080')
const BASE_PATH = process.env.FS_BASE_PATH || ''

const MIME_OVERRIDES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
}

function getMimeOverride(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase()
  return MIME_OVERRIDES[ext] ?? null
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, { status: response.status, headers })
}

async function handleFile(req: Request): Promise<Response> {
  if (!BASE_PATH) {
    return withCors(new Response('File system not configured', { status: 404 }))
  }

  const url = new URL(req.url)
  const reqPath = decodeURIComponent(url.pathname.replace(/^\//, ''))

  const fullPath = path.resolve(BASE_PATH, reqPath)
  if (!fullPath.startsWith(path.resolve(BASE_PATH))) {
    return withCors(new Response('Forbidden', { status: 403 }))
  }

  const file = Bun.file(fullPath)

  if (!(await file.exists())) {
    console.error(`[404] File not found: ${fullPath}`)
    return withCors(new Response('File not found', { status: 404 }))
  }

  const fileStat = await stat(fullPath)
  if (!fileStat.isFile()) {
    return withCors(new Response('Not a file', { status: 404 }))
  }

  const mimeOverride = getMimeOverride(fullPath)
  return new Response(file, {
    headers: {
      ...CORS_HEADERS,
      ...(mimeOverride ? { 'Content-Type': mimeOverride } : {}),
    },
  })
}

Bun.serve({
  port: PORT,

  routes: {
    '/*': {
      // Preflight-запрос от браузера
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: handleFile,
      HEAD: handleFile,
    },
  },

  fetch(req) {
    return withCors(new Response('Not Found', { status: 404 }))
  },

  error(err) {
    console.error('[Server Error]', err)
    return withCors(new Response('Internal Server Error', { status: 500 }))
  },
})

console.log(`✅ File server running on port ${PORT}`)
console.log(`📁 Base path: ${BASE_PATH || '(not set)'}`)
