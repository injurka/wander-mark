import { stat } from 'node:fs/promises'
import path from 'node:path'
import { BASE_PATH, CORS_HEADERS } from '../config'
import { withCors } from '../utils/cors'
import { getMimeOverride } from '../utils/mime'

export async function handleFile(req: Request): Promise<Response> {
  if (!BASE_PATH) {
    return withCors(new Response('File system not configured', { status: 404 }))
  }

  const url = new URL(req.url)
  // eslint-disable-next-line e18e/prefer-static-regex
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
