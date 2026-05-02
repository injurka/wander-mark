enum ContentNavItemType {
  File = 'file',
  Directory = 'directory',
}

interface FileMetaData {
  words: number
  readingTime: number // в минутах
  lastModified: string // ISO date
}

interface ContentNavItem {
  sysname: string
  title: string
  type: ContentNavItemType
  children?: ContentNavItem[]
  meta?: FileMetaData
}

interface VaultMetaSettings {
  info?: {
    title?: string
    description?: string
    sysname?: string
    [key: string]: any
  }
  scripts?: string[]
  styles?: string[]
  [key: string]: any
}

interface VaultMetaBacklinkItem {
  title: string
  url: string
}

type BacklinksMap = Record<string, VaultMetaBacklinkItem[]>

interface VaultMetaSearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export { ContentNavItemType }
export type {
  BacklinksMap,
  ContentNavItem,
  FileMetaData,
  VaultMetaBacklinkItem,
  VaultMetaSearchIndexItem,
  VaultMetaSettings,
}
