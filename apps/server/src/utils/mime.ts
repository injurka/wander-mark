import { MIME_OVERRIDES } from '../config'

const EXT_REGEX = /\.[^.]+$/

export function getMimeOverride(filename: string): string | null {
  const extMatch = filename.match(EXT_REGEX)
  const ext = extMatch ? extMatch[0].toLowerCase() : ''

  return MIME_OVERRIDES[ext] ?? null
}
