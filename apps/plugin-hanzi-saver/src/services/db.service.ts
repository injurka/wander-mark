import type { HanziData } from '../types'
import { state } from '../store/hanzi-saver.store'

export async function checkHanziInDb(char: string, signal?: AbortSignal): Promise<HanziData | null> {
  const res = await fetch(`${state.backendUrl}/api/hanzi/${encodeURIComponent(char)}`, { signal })
  if (res.status === 404)
    return null
  if (!res.ok)
    throw new Error('DB Error')
  const json = await res.json()
  return json.data as HanziData
}

export async function saveHanziToDb(data: HanziData, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(`${state.backendUrl}/api/hanzi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!res.ok)
    throw new Error('Failed to save to DB')
  return res.json()
}

export async function deleteHanziFromDb(char: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${state.backendUrl}/api/hanzi/${encodeURIComponent(char)}`, {
    method: 'DELETE',
    signal,
  })
  if (!res.ok)
    throw new Error('Failed to delete from DB')
}
