/**
 * Wander Mark CLI — публичный API для программного использования.
 *
 * @module
 */

export { runAutoGeneration } from './auto.ts'
export { loadConfig } from './config.ts'
export { FRONT_MATTER_REGEX, IMAGE_DEST_FOLDER, IMAGE_EXTENSIONS, INLINE_TAG_REGEX, NAV_FILENAME, OBSIDIAN_LINK_REGEX, SYSNAME_REGEX, TREE_FILENAME } from './constants.ts'
export { runDeployS3Rclone } from './deploy-s3-rclone.ts'
export { runDeployS3 } from './deploy-s3.ts'
export { runDeploy } from './deploy.ts'
export { buildFileMapRecursive } from './link-resolver.ts'
export { main as runMigrator } from './migrator.ts'
export { processDirectoryRecursive } from './processor.ts'
export {
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
} from './types.ts'
export {
  ensureDirectoryExists,
  extractSysnameFromFrontMatter,
  extractTags,
  isImageExtension,
  safeCopyFile,
  stripMarkdown,
} from './utils.ts'
