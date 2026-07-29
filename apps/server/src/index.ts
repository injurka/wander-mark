/* eslint-disable no-console */
import { CORS_HEADERS, PORT, S3_BASE_PATH, S3_BUCKET } from './config'
import { db } from './db'
import { handleFile } from './handlers/file'
import { deleteHanzi, getAllHanzi, getHanzi, saveHanzi } from './handlers/hanzi'
import { handleSync } from './handlers/sync'
import { withCors } from './utils/cors'

// eslint-disable-next-line antfu/no-top-level-await
await db.loadDb()

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
      DELETE: deleteHanzi,
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
console.log(`📁 S3 Bucket: ${S3_BUCKET}`)
console.log(`🔄 S3 Base path: ${S3_BASE_PATH || '(root)'}`)
