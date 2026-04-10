import { CORS_HEADERS } from '../config'
import { db } from '../db'
import { withCors } from '../utils/cors'

// GET /api/hanzi (Получить все)
export async function getAllHanzi(_req: Request): Promise<Response> {
  try {
    const results = db.query('SELECT * FROM hanzi ORDER BY created_at DESC').all() as any[]

    // Парсим компоненты обратно в массивы
    const data = results.map(row => ({
      ...row,
      components: JSON.parse(row.components || '[]'),
    }))

    return new Response(JSON.stringify(data), {
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
  // Извлекаем иероглиф из конца URL (например, /api/hanzi/字)
  const char = decodeURIComponent(url.pathname.split('/').pop() || '')

  if (!char) {
    return withCors(new Response(JSON.stringify({ error: 'Missing character' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
  }

  const query = db.query('SELECT * FROM hanzi WHERE char = $char')
  const result = query.get({ $char: char }) as any

  if (result) {
    // Парсим компоненты обратно в массив
    result.components = JSON.parse(result.components as string)
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

    const insert = db.prepare(`
      INSERT INTO hanzi (char, pinyin, translation, components, etymology)
      VALUES ($char, $pinyin, $translation, $components, $etymology)
      ON CONFLICT(char) DO UPDATE SET
        pinyin=excluded.pinyin,
        translation=excluded.translation,
        components=excluded.components,
        etymology=excluded.etymology
    `)

    insert.run({
      $char: body.character,
      $pinyin: body.pinyin,
      $translation: body.translation,
      $components: JSON.stringify(body.components || []), // Сохраняем как строку
      $etymology: body.etymology || '',
    })

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
