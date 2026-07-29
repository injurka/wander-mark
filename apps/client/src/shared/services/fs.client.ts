import { del, get, keys, set } from 'idb-keyval'

export async function readTextFile(path: string, _absolute = false): Promise<string | null> {
  return (await get(path)) || null
}

export async function writeTextFile(path: string, data: string, _absolute = false): Promise<void> {
  await set(path, data)
}

export async function writeBinaryFile(path: string, data: Blob, _absolute = false): Promise<void> {
  await set(path, data)
}

export async function deleteFile(path: string, _absolute = false): Promise<void> {
  await del(path)
}

export async function deleteFilesByPrefix(prefix: string): Promise<void> {
  const allKeys = await keys()
  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith(prefix)) {
      await del(key)
    }
  }
}

export async function getMediaUrl(path: string, _absolute = false): Promise<string> {
  return path
}
