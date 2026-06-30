import { useLocalStorage } from '@vueuse/core'
import { get } from 'idb-keyval'
import { defineStore } from 'pinia'
import { deleteFile, deleteFilesByPrefix, getMediaUrl, isNative, readTextFile, writeBinaryFile, writeTextFile } from '../services/fs.client'

export interface VaultConfig {
  id: string
  title: string
  description?: string
  type: 'remote' | 'local'
  url: string
  localPath?: string
  isDownloaded: boolean
  lastSync?: number
  syncStatus?: 'idle' | 'syncing' | 'error'
  name?: string
}

export const useVaultStore = defineStore('vault', () => {
  const vaults = useLocalStorage<VaultConfig[]>('app-vaults', [])
  const createdObjectUrls = new Set<string>()

  const initPredefinedVaults = async () => {
    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const res = await fetch(`${basePath}configs/server.json`)

      if (res.ok) {
        const config = await res.json()
        const serverUrl = config.url || config.serverUrl

        if (serverUrl && Array.isArray(config.vaults)) {
          let updated = false
          for (const vaultId of config.vaults) {
            if (!vaults.value.some(v => v.id === vaultId)) {
              vaults.value.push({
                id: vaultId,
                title: vaultId,
                type: 'remote',
                url: serverUrl.replace(/\/$/, ''),
                isDownloaded: false,
                syncStatus: 'idle',
              })
              updated = true
            }
          }
          if (updated) {
            config.vaults.forEach((vaultId: string) => {
              const vault = vaults.value.find(v => v.id === vaultId)
              if (vault && vault.title === vaultId) {
                fetch(`${vault.url}/meta/${vaultId}/settings.json`)
                  .then(r => r.json())
                  .then((settings) => {
                    if (settings.info?.title)
                      vault.title = settings.info.title
                    if (settings.info?.description)
                      vault.description = settings.info.description
                  })
                  .catch(e => console.warn(`Failed metadata fetch:`, e))
              }
            })
          }
        }
      }
    }
    catch { }
  }

  const addRemoteVault = async (id: string, rawUrl: string) => {
    const cleanUrl = rawUrl.replace(/\/$/, '')
    if (vaults.value.some(v => v.id === id))
      throw new Error('Хранилище с таким ID уже существует.')

    try {
      const res = await fetch(`${cleanUrl}/meta/${id}/settings.json`)
      if (!res.ok)
        throw new Error('Хранилище не найдено.')

      const settings = await res.json()
      vaults.value.push({
        id,
        title: settings.info?.title || id,
        description: settings.info?.description || '',
        type: 'remote',
        url: cleanUrl,
        isDownloaded: false,
        syncStatus: 'idle',
      })
    }
    catch (e: any) {
      throw new Error('Ошибка сети или хранилище недоступно.')
    }
  }

  // --- Инкрементальная синхронизация ---
  const syncVault = async (vaultId: string, onProgress?: (p: number) => void) => {
    const vIndex = vaults.value.findIndex(v => v.id === vaultId)
    if (vIndex === -1)
      throw new Error('Хранилище не найдено.')
    const vault = vaults.value[vIndex]

    vault.syncStatus = 'syncing'

    try {
      // 1. Получаем удаленный nav.json
      const navRes = await fetch(`${vault.url}/content/${vaultId}/nav.json`)
      if (!navRes.ok)
        throw new Error(`Не удалось загрузить nav.json: ${navRes.statusText}`)
      const remoteNavRaw = await navRes.json()
      const remoteItems = Array.isArray(remoteNavRaw) ? remoteNavRaw : (remoteNavRaw.children || [])

      // 2. Читаем локальный nav.json (если есть)
      let localItems: any[] = []
      if (vault.isDownloaded) {
        const localNavStr = await getFileContent(vaultId, `content/${vaultId}/nav.json`)
        if (localNavStr) {
          const parsed = JSON.parse(localNavStr)
          localItems = Array.isArray(parsed) ? parsed : (parsed.children || [])
        }
      }

      // Хелпер для сбора путей и дат изменений
      const buildFileMap = (items: any[], currentPath = '', map = new Map<string, string>()) => {
        for (const item of items) {
          const fullPath = currentPath ? `${currentPath}/${item.sysname}` : item.sysname
          if (item.type === 'file') {
            map.set(`content/${vaultId}/${fullPath}.md`, item.meta?.lastModified || '1970')
          }
          if (item.children)
            buildFileMap(item.children, fullPath, map)
        }
        return map
      }

      const remoteMap = buildFileMap(remoteItems)
      const localMap = buildFileMap(localItems)

      const filesToDownload = new Set<string>([
        `content/${vaultId}/nav.json`,
        `meta/${vaultId}/settings.json`,
        `meta/${vaultId}/backlinks.json`,
        `meta/${vaultId}/search.json`,
      ])
      const filesToDelete = new Set<string>()

      // 3. Сравниваем
      remoteMap.forEach((lastMod, path) => {
        if (!localMap.has(path) || localMap.get(path) !== lastMod) {
          filesToDownload.add(path) // Новый или измененный
        }
      })
      localMap.forEach((_, path) => {
        if (!remoteMap.has(path)) {
          filesToDelete.add(path) // Удален на сервере
        }
      })

      // 4. Метаданные (плагины, стили и скрипты скачиваем всегда, чтобы обновить кэш)
      try {
        const setRes = await fetch(`${vault.url}/meta/${vaultId}/settings.json`)
        if (setRes.ok) {
          const settings = await setRes.json()
          if (settings.scripts)
            settings.scripts.forEach((s: string) => filesToDownload.add(`meta/${vaultId}/${s}`))
          if (settings.styles)
            settings.styles.forEach((s: string) => filesToDownload.add(`meta/${vaultId}/${s}`))
          if (settings.plugins && Array.isArray(settings.plugins)) {
            settings.plugins.forEach((p: any) => {
              const pUrl = typeof p === 'string' ? p : p.url
              if (pUrl && !pUrl.startsWith('http') && !pUrl.startsWith('data:')) {
                filesToDownload.add(pUrl.replace(/^\//, ''))
              }
            })
          }
        }
      }
      catch { }

      // 5. Удаляем локальные файлы, которых больше нет
      for (const file of filesToDelete) {
        await deleteFile(`vaults/${vaultId}/${file}`)
      }

      // 6. Скачиваем измененные и новые
      let loaded = 0
      const mediaToSync = new Set<string>()
      const failedFiles: string[] = []
      const fileArray = Array.from(filesToDownload)

      for (const file of fileArray) {
        try {
          const res = await fetch(`${vault.url}/${file}`)
          if (res.ok) {
            const content = await res.text()
            await writeTextFile(`vaults/${vaultId}/${file}`, content)

            if (file.endsWith('.md')) {
              const imgRegex = /!\[.*?\]\((.*?)\)/g
              const wikiRegex = /!\[\[(.*?)\]\]/g
              let match
              const extractMedia = (imgPath: string) => {
                imgPath = decodeURIComponent(imgPath.trim())
                if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
                  mediaToSync.add(imgPath.startsWith('/images/') ? imgPath.replace(/^\//, '') : `content/${vaultId}/${imgPath}`)
                }
              }
              // eslint-disable-next-line no-cond-assign
              while ((match = imgRegex.exec(content)) !== null) extractMedia(match[1])
              // eslint-disable-next-line no-cond-assign
              while ((match = wikiRegex.exec(content)) !== null) extractMedia(match[1])
            }
          }
          else {
            failedFiles.push(file)
          }
        }
        catch { failedFiles.push(file) }
        loaded++
        if (onProgress)
          onProgress(Math.floor((loaded / (fileArray.length + mediaToSync.size)) * 100))
      }

      // 7. Скачиваем картинки (только для измененных файлов)
      const mediaArray = Array.from(mediaToSync)
      for (const media of mediaArray) {
        try {
          const res = await fetch(`${vault.url}/${media}`)
          if (res.ok) {
            const blob = await res.blob()
            const savePath = media.startsWith('images/') ? media : `vaults/${vaultId}/${media}`
            await writeBinaryFile(savePath, blob)
          }
          else { failedFiles.push(media) }
        }
        catch { failedFiles.push(media) }
        loaded++
        if (onProgress)
          onProgress(Math.floor((loaded / (fileArray.length + mediaArray.length)) * 100))
      }

      // Иконка хранилища
      try {
        const iconPath = `meta/${vaultId}/images/icon.png`
        const iconRes = await fetch(`${vault.url}/${iconPath}`)
        if (iconRes.ok) {
          const blob = await iconRes.blob()
          await writeBinaryFile(`vaults/${vaultId}/${iconPath}`, blob)
        }
      }
      catch { }

      vault.isDownloaded = true
      vault.lastSync = Date.now()
      vault.syncStatus = 'idle'
      if (onProgress)
        onProgress(100)

      if (failedFiles.length > 0) {
        console.warn('Ошибки при синхронизации файлов:', failedFiles)
      }
    }
    catch (e: any) {
      vault.syncStatus = 'error'
      throw e
    }
  }

  const deleteVault = async (vaultId: string) => {
    await deleteFilesByPrefix(`vaults/${vaultId}`)
    vaults.value = vaults.value.filter(v => v.id !== vaultId)
  }

  const getVault = (id: string) => vaults.value.find(v => v.id === id)

  const getFileContent = async (vaultId: string, filePath: string): Promise<string | null> => {
    const vault = getVault(vaultId)
    if (!vault)
      return null

    if (vault.type === 'local' && vault.localPath) {
      return await readTextFile(`${vault.localPath}/${filePath}`, true)
    }

    if (vault.isDownloaded) {
      const content = await readTextFile(`vaults/${vaultId}/${filePath}`)
      if (content !== null)
        return content
    }

    if (vault.type === 'remote') {
      try {
        const res = await fetch(`${vault.url}/${filePath}`)
        if (res.ok)
          return await res.text()
      }
      catch (e) {
        console.warn(`[Web Mode] Не удалось загрузить файл по сети: ${filePath}`, e)
      }
    }
    return null
  }

  const resolveMediaUrl = async (vaultId: string, mediaPath: string): Promise<string> => {
    const vault = getVault(vaultId)
    if (!vault)
      return mediaPath

    if (vault.type === 'local' && vault.localPath) {
      return await getMediaUrl(`${vault.localPath}/${mediaPath}`, true)
    }

    if (vault.isDownloaded) {
      if (isNative) {
        return await getMediaUrl(`vaults/${vaultId}/${mediaPath}`)
      }
      else {
        try {
          const blob = await get(`vaults/${vaultId}/${mediaPath}`)
          if (blob instanceof Blob) {
            const url = URL.createObjectURL(blob)
            createdObjectUrls.add(url)
            return url
          }
        }
        catch (e) { }
      }
    }

    if (vault.type === 'remote') {
      return `${vault.url}/${mediaPath}`
    }
    return mediaPath
  }

  const clearBlobUrls = () => {
    createdObjectUrls.forEach(url => URL.revokeObjectURL(url))
    createdObjectUrls.clear()
  }

  return {
    vaults,
    initPredefinedVaults,
    addRemoteVault,
    syncVault,
    deleteVault,
    getVault,
    getFileContent,
    resolveMediaUrl,
    getMediaUrl,
    clearBlobUrls,
  }
})
