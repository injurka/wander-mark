/**
 * Wander Mark CLI — публичный API для программного использования.
 *
 * @module
 */

export { runAutoGeneration } from './auto'
export { loadConfig } from './config'
export { FRONT_MATTER_REGEX, IMAGE_DEST_FOLDER, IMAGE_EXTENSIONS, INLINE_TAG_REGEX, NAV_FILENAME, OBSIDIAN_LINK_REGEX, SYSNAME_REGEX, TREE_FILENAME } from './constants'
export { runDeploy } from './deploy'
export { runDeployS3 } from './deploy-s3'
export { runDeployS3Rclone } from './deploy-s3-rclone'
export { buildFileMapRecursive } from './link-resolver'
export { main as runMigrator } from './migrator'
export { processDirectoryRecursive } from './processor'
export type {
  BacklinksMap,
  ContentNavItem,
  ContentNavItemType,
  DeployConfig,
  FileMetaData,
  GraphData,
  GraphLink,
  GraphNode,
  ProcessingContext,
  ProjectConfig,
  SearchIndexItem,
  VaultConfig,
} from './types'
export {
  ensureDirectoryExists,
  extractSysnameFromFrontMatter,
  extractTags,
  isImageExtension,
  safeCopyFile,
  stripMarkdown,
} from './utils'
