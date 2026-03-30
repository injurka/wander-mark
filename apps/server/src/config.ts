import path from 'node:path'

export const PORT = Number.parseInt(process.env.PORT || '4444')
export const BASE_PATH = process.env.FS_BASE_PATH || ''
export const DATA_DIR = process.env.SYNC_DATA_PATH || path.resolve(process.cwd(), 'data')

export const MIME_OVERRIDES: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
}
