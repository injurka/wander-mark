import { state } from '../store/hanzi-saver.store'

export async function checkHanziInDb(char: string) {
  const res = await fetch(`${state.backendUrl}/api/hanzi/${encodeURIComponent(char)}`)
  if (res.status === 404)
    return null
  if (!res.ok)
    throw new Error('DB Error')
  const json = await res.json()
  return json.data
}

export async function saveHanziToDb(data: any) {
  const res = await fetch(`${state.backendUrl}/api/hanzi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok)
    throw new Error('Failed to save to DB')
  return res.json()
}
