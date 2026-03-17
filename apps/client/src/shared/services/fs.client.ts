import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { get, set } from 'idb-keyval'

export const isTauri = '__TAURI_INTERNALS__' in window

export async function readTextFile(path: string, absolute = false): Promise<string | null> {
  if (isTauri) {
    const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    try {
      return await readTextFile(path, absolute ? {} : { baseDir: BaseDirectory.AppData })
    } catch { return null }
  } else if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 })
      return res.data as string
    } catch { return null }
  } else {
    return (await get(path)) || null
  }
}

export async function writeTextFile(path: string, data: string, absolute = false): Promise<void> {
  if (isTauri) {
    const { writeTextFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir) await mkdir(dir, { recursive: true, baseDir: absolute ? undefined : BaseDirectory.AppData }).catch(() => { })
    await writeTextFile(path, data, absolute ? {} : { baseDir: BaseDirectory.AppData })
  } else if (Capacitor.isNativePlatform()) {
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir) await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true }).catch(() => { })
    await Filesystem.writeFile({ path, data, directory: Directory.Data, encoding: Encoding.UTF8 })
  } else {
    await set(path, data)
  }
}

export async function getMediaUrl(path: string, absolute = false): Promise<string> {
  if (isTauri) {
    const { convertFileSrc } = await import('@tauri-apps/api/core')
    return convertFileSrc(path)
  } else if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.getUri({ path, directory: Directory.Data })
    return Capacitor.convertFileSrc(res.uri)
  } else {
    // Для Web возвращаем оригинальный URL или реализуем подгрузку Blob через IDB, если нужно
    return path
  }
}
