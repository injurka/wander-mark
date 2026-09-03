/**
 * Wander Mark CLI — публичный API для программного использования.
 *
 * @module
 */

export { runAutoGeneration } from './auto.ts'
export { loadConfig } from './config.ts'
export { runDeploy } from './deploy.ts'
export { runDeployS3 } from './deploy-s3.ts'
export { runDeployS3Rclone } from './deploy-s3-rclone.ts'
export { main as runMigrator } from './migrator.ts'
export { buildFileMapRecursive } from './link-resolver.ts'
export { processDirectoryRecursive } from './processor.ts'

export type {
  ContentNavItem,
  ContentNavItemType,
  FileMetaData,
  SearchIndexItem,
  GraphNode,
  GraphLink,
  GraphData,
  BacklinksMap,
  ProcessingContext,
  DeployConfig,
  VaultConfig,
  ProjectConfig,
} from './types.ts'

export {
  NAV_FILENAME,
  TREE_FILENAME,
  IMAGE_DEST_FOLDER,
  FRONT_MATTER_REGEX,
  SYSNAME_REGEX,
  OBSIDIAN_LINK_REGEX,
  INLINE_TAG_REGEX,
  IMAGE_EXTENSIONS,
} from './constants.ts'

export {
  isImageExtension,
  extractSysnameFromFrontMatter,
  extractTags,
  ensureDirectoryExists,
  safeCopyFile,
  stripMarkdown,
} from './utils.ts'