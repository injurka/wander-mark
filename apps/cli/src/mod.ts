/**
 * Wander Mark CLI — публичный API для программного использования.
 *
 * @module
 */

export { runAutoGeneration } from './auto.js'
export { loadConfig } from './config.js'
export { FRONT_MATTER_REGEX, IMAGE_DEST_FOLDER, IMAGE_EXTENSIONS, INLINE_TAG_REGEX, NAV_FILENAME, OBSIDIAN_LINK_REGEX, SYSNAME_REGEX, TREE_FILENAME } from './constants.js'
export { runDeployS3Rclone } from './deploy-s3-rclone.js'
export { runDeployS3 } from './deploy-s3.js'
export { runDeploy } from './deploy.js'
export { buildFileMapRecursive } from './link-resolver.js'
export { main as runMigrator } from './migrator.js'
export { processDirectoryRecursive } from './processor.js'
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
} from './types.js'
export {
  ensureDirectoryExists,
  extractSysnameFromFrontMatter,
  extractTags,
  isImageExtension,
  safeCopyFile,
  stripMarkdown,
} from './utils.js'
