import { CORS_HEADERS, S3_BASE_PATH } from '../config'
import { getS3File, statS3File } from '../s3'
import { withCors } from '../utils/cors'
import { getMimeOverride } from '../utils/mime'

function getKey(reqPath: string) {
  const p = S3_BASE_PATH ? `${S3_BASE_PATH}/${reqPath}` : reqPath
  // eslint-disable-next-line e18e/prefer-static-regex
  return p.replace(/^\/+/, '')
}

const SPACES_REGEX = /\s+/

function sanitizeS3Key(k: string): string {
  // eslint-disable-next-line e18e/prefer-static-regex
  return k.replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function handleFile(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // eslint-disable-next-line e18e/prefer-static-regex
  const reqPath = decodeURIComponent(url.pathname.replace(/^\//, ''))
  const key = getKey(reqPath)

  if (req.method === 'HEAD') {
    let stat = await statS3File(key)
    let resolvedKey = key
    if (!stat && SPACES_REGEX.test(key)) {
      const hyphenatedKey = sanitizeS3Key(key)
      stat = await statS3File(hyphenatedKey)
      if (stat) {
        resolvedKey = hyphenatedKey
      }
    }
    if (!stat) {
      return withCors(new Response('File not found', { status: 404 }))
    }
    const mimeOverride = getMimeOverride(resolvedKey)
    return new Response(null, {
      headers: {
        ...CORS_HEADERS,
        ...(mimeOverride ? { 'Content-Type': mimeOverride } : (stat.ContentType ? { 'Content-Type': stat.ContentType } : {})),
        'Content-Length': stat.ContentLength?.toString() || '0',
      },
    })
  }

  let fileBuf = await getS3File(key)
  let resolvedKey = key

  if (!fileBuf && SPACES_REGEX.test(key)) {
    const hyphenatedKey = sanitizeS3Key(key)
    fileBuf = await getS3File(hyphenatedKey)
    if (fileBuf) {
      resolvedKey = hyphenatedKey
    }
  }

  if (!fileBuf) {
    console.error(`[404] File not found: ${key}`)
    return withCors(new Response('File not found', { status: 404 }))
  }

  const mimeOverride = getMimeOverride(resolvedKey)
  return new Response(fileBuf as unknown as BodyInit, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': mimeOverride || 'application/octet-stream',
    },
  })
}
