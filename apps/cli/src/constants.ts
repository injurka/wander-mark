/**
 * Constants used throughout the Wander Mark CLI.
 *
 * @module
 */

/* eslint-disable regexp/no-obscure-range */
/* eslint-disable regexp/no-super-linear-backtracking */

/** Filename for the generated navigation JSON. */
export const NAV_FILENAME = 'nav.json'
/** Filename for the tree-structure JSON (mirrors nav). */
export const TREE_FILENAME = 'tree.json'
/** Destination folder name for copied images. */
export const IMAGE_DEST_FOLDER = '_'

/**
 * Regex to match the entire front matter block (YAML between `---` fences).
 *
 * Captures the YAML content in group 1.
 */
export const FRONT_MATTER_REGEX = /^---\s*([\s\S]*?)\s*---/

/**
 * Regex to extract `sysname` specifically from front matter content.
 *
 * Expects a `sysname: "value"` or `sysname: value` line.
 */
export const SYSNAME_REGEX = /^\s*sysname:\s*"?([^"\s]+)"?\s*$/m

/**
 * Regex for Obsidian wiki-style links (excluding image links `![[...]]`).
 *
 * Matches `[[link]]` and `[[link|alias]]`.
 */
export const OBSIDIAN_LINK_REGEX = /(?<!!)\[\[([^|\]\n]+)(?:\|([^\]\n]+))?\]\]/g

/**
 * Regex to extract inline tags (e.g. `#tag` or `#tag/nested`).
 *
 * Supports Cyrillic, Latin, numbers, underscores, hyphens, and forward
 * slashes. Requires a word boundary or start-of-line before `#`.
 */
export const INLINE_TAG_REGEX = /(?<=^|\s)#([\wа-яА-Я\-/]+)/g

/** Set of recognized image file extensions (lowercase). */
export const IMAGE_EXTENSIONS: Set<string> = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.bmp',
  '.tiff',
])
