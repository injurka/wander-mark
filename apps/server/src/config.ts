export const PORT = Number.parseInt(process.env.PORT || '4444')
export const S3_BASE_PATH = process.env.S3_BASE_PATH || ''
export const S3_BUCKET = process.env.S3_BUCKET || ''
export const S3_ENDPOINT = process.env.S3_ENDPOINT || ''
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ''
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''
export const S3_REGION = process.env.S3_REGION || 'us-east-1'

export const MIME_OVERRIDES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
}
