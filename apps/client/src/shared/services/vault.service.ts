import { useLocalStorage } from '@vueuse/core'
import { readTextFile, writeTextFile, getMediaUrl, writeBinaryFile, deleteFilesByPrefix, isNative } from './fs.client'
import { get } from 'idb-keyval'

export interface VaultConfig {
  id: string
  title: string
  description?: string
  type: 'remote' | 'local'
  url: string
  localPath?: string
  isDownloaded: boolean
  name?: string
}

export const useVaultService = () => {
  const vaults = useLocalStorage<VaultConfig[]>('app-vaults', [])

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
            if (!vaults.value.find(v => v.id === vaultId)) {
              vaults.value.push({
                id: vaultId,
                title: vaultId,
                description: '',
                type: 'remote',
                url: serverUrl.replace(/\/$/, ''),
                isDownloaded: false
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
                  .then(settings => {
                    if (settings.info?.title) vault.title = settings.info.title
                    if (settings.info?.description) vault.description = settings.info.description
                  })
                  .catch(e => console.warn(`Failed to fetch metadata for predefined vault ${vaultId}:`, e))
              }
            })
          }
        }
      }
    } catch (e) {
      console.log('No config.json found or failed to parse, skipping predefined vaults.')
    }
  }

  const addRemoteVault = async (id: string, rawUrl: string) => {
    const cleanUrl = rawUrl.replace(/\/$/, '')

    if (vaults.value.find(v => v.id === id)) {
      throw new Error('Хранилище с таким ID уже существует.')
    }

    try {
      // Валидируем теперь по settings.json, так как он содержит метаданные
      const validationUrl = `${cleanUrl}/meta/${id}/settings.json`
      const res = await fetch(validationUrl)

      if (!res.ok) {
        throw new Error(`Хранилище не найдено. Сервер вернул ошибку ${res.status} по адресу: ${validationUrl}. Проверьте правильность ID и URL.`)
      }

      const settings = await res.json()
      const title = settings.info?.title || id
      const description = settings.info?.description || ''

      vaults.value.push({ id, title, description, type: 'remote', url: cleanUrl, isDownloaded: false })

    } catch (e: any) {
      console.error(e)
      if (e instanceof TypeError && e.message.includes('fetch')) {
        throw new Error('Ошибка сети или CORS. Убедитесь, что сервер доступен и отдает правильные заголовки.')
      }
      throw e
    }
  }

  const installVault = async (vaultId: string, onProgress: (p: number) => void) => {
    const vault = vaults.value.find(v => v.id === vaultId)
    if (!vault || !vault.url) throw new Error('Хранилище не найдено.')

    const filesToSync = [
      `content/${vaultId}/nav.json`,
      `meta/${vaultId}/settings.json`,
      `meta/${vaultId}/backlinks.json`,
      `meta/${vaultId}/search.json`
    ]

    try {
      const navRes = await fetch(`${vault.url}/content/${vaultId}/nav.json`)
      if (!navRes.ok) throw new Error(`Не удалось загрузить nav.json: ${navRes.statusText}`)

      const navItems = await navRes.json()
      const extractPaths = (items: any[], currentPath = ''): string[] => {
        let paths: string[] = []
        for (const item of items) {
          const fullPath = currentPath ? `${currentPath}/${item.sysname}` : item.sysname
          if (item.type === 'file') paths.push(`content/${vaultId}/${fullPath}.md`)
          if (item.children) paths.push(...extractPaths(item.children, fullPath))
        }
        return paths
      }
      const itemsToParse = Array.isArray(navItems) ? navItems : (navItems.children || [])
      filesToSync.push(...extractPaths(itemsToParse))
    } catch (e: any) {
      throw new Error(`Не удалось загрузить структуру хранилища: ${e.message}`)
    }

    try {
      const setRes = await fetch(`${vault.url}/meta/${vaultId}/settings.json`)
      if (setRes.ok) {
        const settings = await setRes.json()

        if (settings.scripts) {
          filesToSync.push(...settings.scripts.map((s: string) => `meta/${vaultId}/${s}`))
        }
        if (settings.styles) {
          filesToSync.push(...settings.styles.map((s: string) => `meta/${vaultId}/${s}`))
        }

        if (settings.plugins && Array.isArray(settings.plugins)) {
          for (const p of settings.plugins) {
            const pUrl = typeof p === 'string' ? p : p.url;
            if (pUrl && !pUrl.startsWith('http') && !pUrl.startsWith('data:')) {
              filesToSync.push(pUrl.replace(/^\//, ''));
            }
          }
        }
      }
    } catch (e) { }

    let loaded = 0
    const mediaToSync = new Set<string>()
    const failedFiles: string[] = []

    for (const file of filesToSync) {
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
                if (imgPath.startsWith('/images/')) {
                  mediaToSync.add(imgPath.replace(/^\//, ''))
                } else {
                  mediaToSync.add(`content/${vaultId}/${imgPath}`)
                }
              }
            }
            while ((match = imgRegex.exec(content)) !== null) extractMedia(match[1])
            while ((match = wikiRegex.exec(content)) !== null) extractMedia(match[1])
          }
        } else {
          failedFiles.push(file)
        }
      } catch (e) {
        console.error(`Failed to load text file: ${file}`)
        failedFiles.push(file)
      }
      loaded++
      onProgress(Math.floor((loaded / (filesToSync.length + mediaToSync.size)) * 100))
    }

    const mediaArray = Array.from(mediaToSync)
    for (const media of mediaArray) {
      try {
        const res = await fetch(`${vault.url}/${media}`)
        if (res.ok) {
          const blob = await res.blob()
          const savePath = media.startsWith('images/') ? media : `vaults/${vaultId}/${media}`
          await writeBinaryFile(savePath, blob)
        } else {
          failedFiles.push(media)
        }
      } catch (e) {
        console.error(`Failed to load media file: ${media}`)
        failedFiles.push(media)
      }
      loaded++
      onProgress(Math.floor((loaded / (filesToSync.length + mediaArray.length)) * 100))
    }

    try {
      const iconPath = `meta/${vaultId}/images/icon.png`
      const iconRes = await fetch(`${vault.url}/${iconPath}`)
      if (iconRes.ok) {
        const blob = await iconRes.blob()
        await writeBinaryFile(`vaults/${vaultId}/${iconPath}`, blob)
      }
    } catch {
    }

    if (failedFiles.length > 0) {
      console.warn('Не удалось загрузить следующие файлы:', failedFiles)
      const vIndex = vaults.value.findIndex(v => v.id === vaultId)
      if (vIndex !== -1) vaults.value[vIndex].isDownloaded = true
      throw new Error(`Хранилище скачано частично. Не удалось скачать ${failedFiles.length} файлов. Посмотрите консоль для подробностей.`)
    }

    const vIndex = vaults.value.findIndex(v => v.id === vaultId)
    if (vIndex !== -1) vaults.value[vIndex].isDownloaded = true

    onProgress(100)
  }

  const deleteVault = async (vaultId: string) => {
    await deleteFilesByPrefix(`vaults/${vaultId}`)
    vaults.value = vaults.value.filter(v => v.id !== vaultId)
  }

  const getVault = (id: string) => vaults.value.find(v => v.id === id)

  const getFileContent = async (vaultId: string, filePath: string): Promise<string | null> => {
    const vault = getVault(vaultId)
    if (!vault) return null

    if (vault.type === 'local' && vault.localPath) {
      return await readTextFile(`${vault.localPath}/${filePath}`, true)
    }

    if (vault.isDownloaded) {
      const content = await readTextFile(`vaults/${vaultId}/${filePath}`)
      if (content !== null) return content
    }

    if (vault.type === 'remote') {
      try {
        const res = await fetch(`${vault.url}/${filePath}`)
        if (res.ok) return await res.text()
      } catch (e) {
        console.warn(`[Web Mode] Не удалось загрузить файл по сети: ${filePath}`, e)
      }
    }

    return null
  }

  const resolveMediaUrl = async (vaultId: string, mediaPath: string): Promise<string> => {
    const vault = getVault(vaultId)
    if (!vault) return mediaPath

    if (vault.type === 'local' && vault.localPath) {
      return await getMediaUrl(`${vault.localPath}/${mediaPath}`, true)
    }

    if (vault.isDownloaded) {
      if (isNative) {
        return await getMediaUrl(`vaults/${vaultId}/${mediaPath}`)
      } else {
        try {
          const blob = await get(`vaults/${vaultId}/${mediaPath}`)
          if (blob instanceof Blob) {
            return URL.createObjectURL(blob)
          }
        } catch (e) {
          console.error('Failed to load media from IndexedDB:', e)
        }
      }
    }

    if (vault.type === 'remote') {
      return `${vault.url}/${mediaPath}`
    }

    return mediaPath
  }

  return {
    vaults,
    initPredefinedVaults,
    addRemoteVault,
    installVault,
    deleteVault,
    getVault,
    getFileContent,
    resolveMediaUrl,
    getMediaUrl
  }
}
