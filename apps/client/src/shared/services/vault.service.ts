import { useLocalStorage } from '@vueuse/core'
import { readTextFile, writeTextFile, getMediaUrl, isTauri } from './fs.client'

export interface VaultConfig {
  id: string
  name: string
  type: 'remote' | 'local'
  url?: string
  localPath?: string // Для Tauri
}

export const useVaultService = () => {
  const vaults = useLocalStorage<VaultConfig[]>('app-vaults', [])

  const addRemoteVault = (id: string, name: string, url: string) => {
    if (!vaults.value.find(v => v.id === id)) {
      vaults.value.push({ id, name, type: 'remote', url })
    }
  }

  const addLocalVault = async (id: string, name: string) => {
    if (isTauri) {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({ directory: true, multiple: false })
      if (selected && typeof selected === 'string') {
        vaults.value.push({ id, name, type: 'local', localPath: selected })
      }
    }
  }

  const getVault = (id: string) => vaults.value.find(v => v.id === id)

  // Получить контент файла: сначала пытаемся взять локально, если нет — качаем (для remote)
  const getFileContent = async (vaultId: string, filePath: string): Promise<string | null> => {
    const vault = getVault(vaultId)
    if (!vault) return null

    if (vault.type === 'local' && vault.localPath) {
      return await readTextFile(`${vault.localPath}/${filePath}`, true)
    }

    // Remote Vault
    const localCachePath = `vaults/${vaultId}/${filePath}`
    let content = await readTextFile(localCachePath)

    // Fallback on network if not cached
    if (!content && vault.url) {
      try {
        const res = await fetch(`${vault.url}/${filePath}`)
        if (res.ok) {
          content = await res.text()
          await writeTextFile(localCachePath, content) // Сохраняем в кэш
        }
      } catch (e) { console.error('Fetch failed', e) }
    }
    return content
  }

  const syncVault = async (vaultId: string, onProgress: (p: number) => void) => {
    const vault = getVault(vaultId)
    if (!vault || vault.type === 'local' || !vault.url) return

    // 1. Качаем манифест навигации
    const navContent = await getFileContent(vaultId, 'content/nav.json')
    if (!navContent) return
    const navItems = JSON.parse(navContent)

    // Вспомогательная функция для сбора всех файлов
    const extractPaths = (items: any[], currentPath = ''): string[] => {
      let paths: string[] = []
      for (const item of items) {
        const fullPath = currentPath ? `${currentPath}/${item.sysname}` : item.sysname
        if (item.type === 'file') paths.push(`content/${vaultId}/${fullPath}.md`)
        if (item.children) paths.push(...extractPaths(item.children, fullPath))
      }
      return paths
    }

    const filesToSync = [
      'content/nav.json',
      `meta/${vaultId}/settings.json`,
      `meta/${vaultId}/backlinks.json`,
      `meta/${vaultId}/search.json`,
      ...extractPaths(navItems)
    ]

    let loaded = 0
    for (const file of filesToSync) {
      try {
        const res = await fetch(`${vault.url}/${file}`)
        if (res.ok) {
          const content = await res.text()
          await writeTextFile(`vaults/${vaultId}/${file}`, content)
        }
      } catch (e) { }
      loaded++
      onProgress(Math.floor((loaded / filesToSync.length) * 100))
    }
  }

  return { vaults, addRemoteVault, addLocalVault, getVault, getFileContent, syncVault, getMediaUrl }
}
