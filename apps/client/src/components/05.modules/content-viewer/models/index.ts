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
  scripts?: string[]
  styles?: string[]
  [key: string]: any
}

interface BacklinkItem {
  title: string
  url: string
}

type BacklinksMap = Record<string, BacklinkItem[]>

interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export { ContentNavItemType }
export type { BacklinkItem, BacklinksMap, ContentNavItem, FileMetaData, SearchIndexItem, VaultMetaSettings }
