import { CORS_HEADERS, S3_BASE_PATH } from '../config'
import { getS3File, statS3File } from '../s3'
import { withCors } from '../utils/cors'
import { getMimeOverride } from '../utils/mime'

function getKey(reqPath: string) {
  const p = S3_BASE_PATH ? `${S3_BASE_PATH}/${reqPath}` : reqPath
  // eslint-disable-next-line e18e/prefer-static-regex
  return p.replace(/^\/+/, '')
}

export async function handleFile(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // eslint-disable-next-line e18e/prefer-static-regex
  const reqPath = decodeURIComponent(url.pathname.replace(/^\//, ''))
  const key = getKey(reqPath)

  if (req.method === 'HEAD') {
    const stat = await statS3File(key)
    if (!stat) {
      return withCors(new Response('File not found', { status: 404 }))
    }
    const mimeOverride = getMimeOverride(key)
    return new Response(null, {
      headers: {
        ...CORS_HEADERS,
        ...(mimeOverride ? { 'Content-Type': mimeOverride } : (stat.ContentType ? { 'Content-Type': stat.ContentType } : {})),
        'Content-Length': stat.ContentLength?.toString() || '0',
      },
    })
  }

  const fileBuf = await getS3File(key)

  if (!fileBuf) {
    console.error(`[404] File not found: ${key}`)
    return withCors(new Response('File not found', { status: 404 }))
  }

  const mimeOverride = getMimeOverride(key)
  return new Response(fileBuf as unknown as BodyInit, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': mimeOverride || 'application/octet-stream',
    },
  })
}
