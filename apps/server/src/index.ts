/* eslint-disable no-console */
import { BASE_PATH, CORS_HEADERS, DATA_DIR, PORT } from './config'
import { handleFile } from './handlers/file'
import { getAllHanzi, getHanzi, saveHanzi } from './handlers/hanzi'
import { handleSync } from './handlers/sync'
import { withCors } from './utils/cors'
import './db'

Bun.serve({
  port: PORT,

  routes: {
    '/health': {
      GET: () => new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }),
    },
    '/api/sync/reading': {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: handleSync,
    },
    '/api/hanzi': {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: getAllHanzi,
      POST: saveHanzi,
    },
    '/api/hanzi/*': {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: getHanzi,
    },
    '/*': {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: handleFile,
      HEAD: handleFile,
    },
  },

  fetch() {
    return withCors(new Response('Not Found', { status: 404 }))
  },

  error(err: any) {
    console.error('[Server Error]', err)
    return withCors(new Response('Internal Server Error', { status: 500 }))
  },
})

console.log(`✅ Server running on port ${PORT}`)
console.log(`📁 Base path: ${BASE_PATH || '(not set)'}`)
console.log(`🔄 Sync data path: ${DATA_DIR}`)
