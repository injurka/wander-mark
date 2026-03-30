import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { del, get, keys, set } from 'idb-keyval'

export const isTauri = '__TAURI_INTERNALS__' in window
export const isNative = isTauri || Capacitor.isNativePlatform()

export async function readTextFile(path: string, absolute = false): Promise<string | null> {
  if (isTauri) {
    const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    try {
      return await readTextFile(path, absolute ? {} : { baseDir: BaseDirectory.AppData })
    }
    catch { return null }
  }
  else if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 })
      return res.data as string
    }
    catch { return null }
  }
  else {
    return (await get(path)) || null
  }
}

export async function writeTextFile(path: string, data: string, absolute = false): Promise<void> {
  if (isTauri) {
    const { writeTextFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir)
      await mkdir(dir, { recursive: true, baseDir: absolute ? undefined : BaseDirectory.AppData }).catch(() => { })
    await writeTextFile(path, data, absolute ? {} : { baseDir: BaseDirectory.AppData })
  }
  else if (Capacitor.isNativePlatform()) {
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir)
      await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true }).catch(() => { })
    await Filesystem.writeFile({ path, data, directory: Directory.Data, encoding: Encoding.UTF8 })
  }
  else {
    await set(path, data)
  }
}

export async function writeBinaryFile(path: string, data: Blob, absolute = false): Promise<void> {
  if (isTauri) {
    const { writeFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir)
      await mkdir(dir, { recursive: true, baseDir: absolute ? undefined : BaseDirectory.AppData }).catch(() => { })
    const buffer = new Uint8Array(await data.arrayBuffer())
    await writeFile(path, buffer, absolute ? {} : { baseDir: BaseDirectory.AppData })
  }
  else if (Capacitor.isNativePlatform()) {
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir)
      await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true }).catch(() => { })
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.includes(',') ? result.split(',')[1] : result)
      }
      reader.readAsDataURL(data)
    })
    await Filesystem.writeFile({ path, data: base64Data, directory: Directory.Data })
  }
  else {
    await set(path, data)
  }
}

export async function deleteFilesByPrefix(prefix: string): Promise<void> {
  if (isTauri) {
    const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    await remove(prefix, { recursive: true, baseDir: BaseDirectory.AppData }).catch(() => console.error('Tauri remove failed'))
  }
  else if (Capacitor.isNativePlatform()) {
    await Filesystem.rmdir({ path: prefix, directory: Directory.Data, recursive: true }).catch(() => console.error('Capacitor remove failed'))
  }
  else {
    const allKeys = await keys()
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(prefix)) {
        await del(key)
      }
    }
  }
}

export async function getMediaUrl(path: string, _absolute = false): Promise<string> {
  if (isTauri) {
    const { convertFileSrc } = await import('@tauri-apps/api/core')
    return convertFileSrc(path)
  }
  else if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.getUri({ path, directory: Directory.Data })
    return Capacitor.convertFileSrc(res.uri)
  }
  else {
    return path
  }
}
