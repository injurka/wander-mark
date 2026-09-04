import { CORS_HEADERS, S3_BASE_PATH } from '../config'
import { getS3File } from '../s3'
import { withCors } from '../utils/cors'

/**
 * GET /config/server.json — server-side config endpoint.
 *
 * Reads `config/server.json` from the S3 bucket (with the configured base
 * path) and returns it as JSON, so the client never talks to S3 directly
 * for bootstrap configuration.
 */
export async function handleServerConfig(): Promise<Response> {
  const key = S3_BASE_PATH ? `${S3_BASE_PATH}/config/server.json` : 'config/server.json'

  const fileBuf = await getS3File(key)

  if (!fileBuf) {
    console.error(`[404] Server config not found: ${key}`)
    return withCors(new Response(JSON.stringify({ error: 'Config not found' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    }))
  }

  return new Response(fileBuf as unknown as BodyInit, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
