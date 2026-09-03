/**
 * Core type definitions for the Wander Mark CLI.
 *
 * @module
 */

/** Type distinguishing content navigation items. */
export enum ContentNavItemType {
  File = 'file',
  Directory = 'directory',
}

/**
 * Metadata extracted from a processed Markdown file.
 *
 * Includes word count, estimated reading time, and last modification date.
 */
export interface FileMetaData {
  words: number
  readingTime: number
  lastModified: string
}

/**
 * A single entry in the site's navigation structure.
 *
 * Can represent a file or directory; directories may contain nested children.
 */
export interface ContentNavItem {
  sysname: string
  title: string
  type: ContentNavItemType
  children?: ContentNavItem[]
  meta?: FileMetaData
}

/** An entry in the search index. */
export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

/** A node in the site's backlink graph (visualization). */
export interface GraphNode {
  id: string
  label: string
  val: number
  group?: string
}

/** A directed edge between two graph nodes. */
export interface GraphLink {
  source: string
  target: string
}

/** Complete graph data for the site's inter-page link visualization. */
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

/**
 * Map from page URL to an array of pages that link to it.
 *
 * Each entry contains the linking page's title and URL.
 */
export type BacklinksMap = Record<string, Array<{ title: string, url: string }>>

/**
 * Runtime context passed through the processing pipeline.
 *
 * Accumulates search index, graph data, and backlinks as pages are processed.
 */
export interface ProcessingContext {
  searchIndex: SearchIndexItem[]
  graphData: GraphData
  backlinks: BacklinksMap
}

/** Deployment target configuration. */
export interface DeployConfig {
  mode?: 'static' | 's3'
  host?: string
  user?: string
  path?: string
}

/** A single Obsidian vault entry in the project configuration. */
export interface VaultConfig {
  sourcePath: string
  exportPath?: string
}

/**
 * Top-level project configuration.
 *
 * Maps source directories to output paths, defines vaults, and specifies
 * deployment settings.
 */
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
