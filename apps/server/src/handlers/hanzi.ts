import { CORS_HEADERS } from '../config'
import { db } from '../db'
import { withCors } from '../utils/cors'

// GET /api/hanzi (Получить все)
export async function getAllHanzi(_req: Request): Promise<Response> {
  try {
    const results = Object.values(db.hanzi).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
  catch (e: any) {
    return withCors(new Response(JSON.stringify({ error: e.message }), { status: 500 }))
  }
}

// GET /api/hanzi/:char
export async function getHanzi(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const char = decodeURIComponent(url.pathname.split('/').pop() || '')

  if (!char) {
    return withCors(new Response(JSON.stringify({ error: 'Missing character' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
  }

  const result = db.hanzi[char]

  if (result) {
    return new Response(JSON.stringify({ found: true, data: result }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  return withCors(new Response(JSON.stringify({ found: false }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }))
}

// POST /api/hanzi
export async function saveHanzi(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const char = body.character || body.char

    const existing = db.hanzi[char] || { created_at: new Date().toISOString() }

    db.hanzi[char] = {
      ...existing,
      char,
      type: body.type || existing.type || 'word',
      pinyin: body.pinyin || existing.pinyin || '',
      translation: body.translation || existing.translation || '',
      components: body.components || existing.components || [],
      etymology: body.etymology || existing.etymology || '',
      hsk: body.hsk || existing.hsk || 'None',
      strokes: body.strokes || existing.strokes || 0,
      part_of_speech: body.part_of_speech || existing.part_of_speech || '',
      grammar_notes: body.grammar_notes || existing.grammar_notes || '',
      words_breakdown: body.words_breakdown || existing.words_breakdown || [],
    }

    await db.saveHanziDb()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
  catch (error: any) {
    console.error('[Hanzi Save Error]', error)
    return withCors(new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
}

// DELETE /api/hanzi/:char
export async function deleteHanzi(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const char = decodeURIComponent(url.pathname.split('/').pop() || '')

  if (!char) {
    return withCors(new Response(JSON.stringify({ error: 'Missing character' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
  }

  try {
    if (db.hanzi[char]) {
      delete db.hanzi[char]
      await db.saveHanziDb()

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return withCors(new Response(JSON.stringify({ error: 'Character not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
  catch (error: any) {
    console.error('[Hanzi Delete Error]', error)
    return withCors(new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
}
