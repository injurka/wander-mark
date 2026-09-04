import type { TextFilePayload } from '~/shared/types/rpc'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbRpc, setSyncProgressHandler } from '../services/db.client'

export interface VaultConfig {
  id: string
  title: string
  description?: string
  type: 'remote' | 'local'
  url: string
  localPath?: string
  isDownloaded: boolean
  lastSync?: number
  syncStatus?: 'idle' | 'syncing' | 'error' | 'partial'
  name?: string
}

export const useVaultStore = defineStore('vault', () => {
  const vaults = useLocalStorage<VaultConfig[]>('app-vaults', [])
  const syncProgress = ref<Record<string, number>>({})

  const setSyncProgress = (vaultId: string, progress: number) => {
    syncProgress.value[vaultId] = progress
  }

  // Прогресс фазы записи пушится из SQLite-воркера напрямую через birpc
  setSyncProgressHandler(setSyncProgress)

  const initPredefinedVaults = async () => {
    try {
      await dbRpc.initDb()
    }
    catch (e) {
      console.error('Не удалось инициализировать SQLite/OPFS:', e)
    }

    try {
      const configUrl = import.meta.env.VITE_CONFIG_URL || 'https://de-s3.storage.bunnycdn.com/wander-mark/config/server.json'
      const res = await fetch(configUrl)

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
    catch {
      throw new Error('Ошибка сети или хранилище недоступно.')
    }
  }

  const getVault = (id: string) => vaults.value.find(v => v.id === id)

  // Хелпер для параллельного выполнения промисов с лимитом
  const runInBatches = async <T, R>(items: T[], batchSize: number, task: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = []
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(task))
      results.push(...batchResults)
    }
    return results
  }

  const getFileContent = async (vaultId: string, filePath: string): Promise<string | null> => {
    const vault = getVault(vaultId)
    if (!vault)
      return null

    if (vault.isDownloaded) {
      const content = await dbRpc.getFile(vaultId, filePath)
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

  // --- Инкрементальная синхронизация ---
  const syncVault = async (vaultId: string) => {
    const vIndex = vaults.value.findIndex(v => v.id === vaultId)
    if (vIndex === -1)
      throw new Error('Хранилище не найдено.')
    const vault = vaults.value[vIndex]

    vault.syncStatus = 'syncing'
    setSyncProgress(vaultId, 0)

    try {
      // 1. Получаем удаленный nav.json
      const navRes = await fetch(`${vault.url}/content/${vaultId}/nav.json`)
      if (!navRes.ok)
        throw new Error(`Не удалось загрузить nav.json: ${navRes.statusText}`)
      const remoteNavRaw = await navRes.json()
      const remoteItems = Array.isArray(remoteNavRaw) ? remoteNavRaw : (remoteNavRaw.children || [])

      // 2. Читаем локальный sync_state.json (реестр успешно скачанных файлов)
      // Если его нет, используем пустой объект (все будет скачано заново, либо перезаписано)
      let syncState: Record<string, string> = {}
      if (vault.isDownloaded) {
        const stateStr = await getFileContent(vaultId, `meta/${vaultId}/sync_state.json`)
        if (stateStr) {
          try {
            syncState = JSON.parse(stateStr)
          }
          catch { }
        }
        else {
          // Обратная совместимость: если sync_state нет, попытаемся прочитать старый nav.json
          const localNavStr = await getFileContent(vaultId, `content/${vaultId}/nav.json`)
          if (localNavStr) {
            try {
              const parsed = JSON.parse(localNavStr)
              const localItems = Array.isArray(parsed) ? parsed : (parsed.children || [])
              const buildOldMap = (items: any[], currentPath = '', map: Record<string, string> = {}) => {
                for (const item of items) {
                  const fullPath = currentPath ? `${currentPath}/${item.sysname}` : item.sysname
                  if (item.type === 'file') {
                    map[`content/${vaultId}/${fullPath}.md`] = item.meta?.lastModified || '1970'
                  }
                  if (item.children)
                    buildOldMap(item.children, fullPath, map)
                }
                return map
              }
              syncState = buildOldMap(localItems)
            }
            catch { }
          }
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

      const filesToDownload = new Set<string>([
        `content/${vaultId}/nav.json`,
        `meta/${vaultId}/settings.json`,
        `meta/${vaultId}/backlinks.json`,
        `meta/${vaultId}/search.json`,
      ])
      const filesToDelete = new Set<string>()

      // 3. Сравниваем remoteMap и локальный syncState
      remoteMap.forEach((lastMod, path) => {
        if (!syncState[path] || syncState[path] !== lastMod) {
          filesToDownload.add(path) // Новый или измененный
        }
      })
      Object.keys(syncState).forEach((path) => {
        if (!remoteMap.has(path) && path.startsWith(`content/${vaultId}/`) && path.endsWith('.md')) {
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
        await dbRpc.deleteFile(vaultId, file)
        delete syncState[file]
      }

      // 6. Скачиваем измененные и новые (тексты копим в батч для одной транзакции в SQLite)
      let loaded = 0
      const textBatch: TextFilePayload[] = []
      const mediaToSync = new Map<string, Set<string>>() // mediaUrl -> Set of parent markdown files
      const failedFiles = new Set<string>()
      const fileArray = Array.from(filesToDownload)

      const totalItems = fileArray.length

      const downloadFile = async (file: string) => {
        try {
          const res = await fetch(`${vault.url}/${file}`)
          if (res.ok) {
            const content = await res.text()
            textBatch.push({ path: file, content, lastModified: Date.now() })

            if (file.endsWith('.md')) {
              const imgRegex = /!\[.*?\]\((.*?)\)/g
              const wikiRegex = /!\[\[(.*?)\]\]/g
              const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/g

              let match
              const extractMedia = (imgPath: string) => {
                imgPath = decodeURIComponent(imgPath.trim())
                if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
                  const mediaPath = imgPath.startsWith('/images/') ? imgPath.replace(/^\//, '') : `content/${vaultId}/${imgPath}`
                  if (!mediaToSync.has(mediaPath))
                    mediaToSync.set(mediaPath, new Set())
                  mediaToSync.get(mediaPath)!.add(file)
                }
              }
              // eslint-disable-next-line no-cond-assign
              while ((match = imgRegex.exec(content)) !== null) extractMedia(match[1])
              // eslint-disable-next-line no-cond-assign
              while ((match = wikiRegex.exec(content)) !== null) extractMedia(match[1])
              // eslint-disable-next-line no-cond-assign
              while ((match = htmlImgRegex.exec(content)) !== null) extractMedia(match[1])
            }
          }
          else {
            failedFiles.add(file)
          }
        }
        catch { failedFiles.add(file) }
        loaded++
        setSyncProgress(vaultId, Math.floor((loaded / (totalItems + mediaToSync.size)) * 100))
      }

      // Параллельная загрузка текстовых файлов батчами по 15
      await runInBatches(fileArray, 15, downloadFile)

      // Транзакционная запись всех текстов в SQLite одним RPC-вызовом
      if (textBatch.length > 0)
        await dbRpc.syncTextBatch(vaultId, textBatch)

      // 7. Скачиваем картинки (только для измененных файлов)
      const mediaArray = Array.from(mediaToSync.keys())

      const downloadMedia = async (media: string) => {
        try {
          const res = await fetch(`${vault.url}/${media}`)
          if (res.ok) {
            const buffer = await res.arrayBuffer()
            await dbRpc.writeMedia(vaultId, media, buffer)
          }
          else { failedFiles.add(media) }
        }
        catch { failedFiles.add(media) }
        loaded++
        setSyncProgress(vaultId, Math.floor((loaded / (totalItems + mediaArray.length)) * 100))
      }

      // Параллельная загрузка медиа батчами по 10
      await runInBatches(mediaArray, 10, downloadMedia)

      // Иконка хранилища
      try {
        const iconPath = `meta/${vaultId}/images/icon.png`
        const iconRes = await fetch(`${vault.url}/${iconPath}`)
        if (iconRes.ok) {
          const buffer = await iconRes.arrayBuffer()
          await dbRpc.writeMedia(vaultId, iconPath, buffer)
        }
      }
      catch { }

      // 8. Обновляем sync_state только для успешно скачанных markdown файлов
      remoteMap.forEach((lastMod, path) => {
        if (filesToDownload.has(path)) {
          // Проверяем, не было ли ошибки при скачивании самого md файла
          if (failedFiles.has(path))
            return

          // Проверяем, не было ли ошибки при скачивании связанных медиа
          let mediaFailed = false
          for (const [mediaPath, parents] of mediaToSync.entries()) {
            if (parents.has(path) && failedFiles.has(mediaPath)) {
              mediaFailed = true
              break
            }
          }

          if (!mediaFailed) {
            syncState[path] = lastMod
          }
        }
      })

      // Сохраняем стейт
      await dbRpc.syncTextBatch(vaultId, [
        { path: `meta/${vaultId}/sync_state.json`, content: JSON.stringify(syncState), lastModified: Date.now() },
      ])

      vault.isDownloaded = true
      vault.lastSync = Date.now()

      if (failedFiles.size > 0) {
        vault.syncStatus = 'partial'
        console.warn('Ошибки при синхронизации файлов:', Array.from(failedFiles))
      }
      else {
        vault.syncStatus = 'idle'
      }

      setSyncProgress(vaultId, 100)
    }
    catch (e: any) {
      vault.syncStatus = 'error'
      throw e
    }
  }

  const deleteVault = async (vaultId: string) => {
    await dbRpc.deleteVault(vaultId)
    vaults.value = vaults.value.filter(v => v.id !== vaultId)
  }

  // Медиа раздаются Service Worker'ом напрямую из OPFS — blob URL больше не нужны
  const resolveMediaUrl = async (vaultId: string, mediaPath: string): Promise<string> => {
    const vault = getVault(vaultId)
    if (!vault)
      return mediaPath

    if (vault.isDownloaded) {
      const encoded = mediaPath.split('/').map(encodeURIComponent).join('/')
      return new URL(`opfs-media/${vaultId}/${encoded}`, document.baseURI).href
    }

    if (vault.type === 'remote') {
      return `${vault.url}/${mediaPath}`
    }
    return mediaPath
  }

  // Пасsthrough для совместимости с local-хранилищами (Tauri)
  const getMediaUrl = async (path: string, _absolute = false): Promise<string> => path

  return {
    vaults,
    syncProgress,
    setSyncProgress,
    initPredefinedVaults,
    addRemoteVault,
    syncVault,
    deleteVault,
    getVault,
    getFileContent,
    resolveMediaUrl,
    getMediaUrl,
  }
})
