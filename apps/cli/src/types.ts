export enum ContentNavItemType {
  File = 'file',
  Directory = 'directory',
}

export interface FileMetaData {
  words: number
  readingTime: number
  lastModified: string
}

export interface ContentNavItem {
  sysname: string
  title: string
  type: ContentNavItemType
  children?: ContentNavItem[]
  meta?: FileMetaData
}

export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export interface GraphNode {
  id: string
  label: string
  val: number
  group?: string
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export type BacklinksMap = Record<string, Array<{ title: string, url: string }>>

export interface ProcessingContext {
  searchIndex: SearchIndexItem[]
  graphData: GraphData
  backlinks: BacklinksMap
}

export interface DeployConfig {
  host?: string
  user?: string
  path?: string
}

export interface VaultConfig {
  sourcePath: string
  exportPath?: string
}

export interface ProjectConfig {
  paths: {
    sourceNotesRoot: string
    metaSource: string
    pluginsSource?: string
    outputContentRoot: string
    outputMetaRoot: string
    outputPluginsRoot?: string
  }
  ignore: {
    folders: string[]
  }
  vaults: VaultConfig[]
  deploy?: DeployConfig
}
