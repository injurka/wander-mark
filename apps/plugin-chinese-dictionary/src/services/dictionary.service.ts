import type { DictionaryEntry, PluginContext } from '../types'
import { dictionaryActions, dictionaryState } from '../store/dictionary.store'

let isInitialized = false

export async function init(ctx: PluginContext): Promise<void> {
  if (isInitialized)
    return

  try {
    const dictionaryUrl = `${ctx.vaultUrl}/meta/${ctx.vaultId}/plugins/assets/chinese-dictionary/cedict.json`
    const response = await fetch(dictionaryUrl)
    if (!response.ok)
      throw new Error(`Failed to fetch dictionary: ${response.statusText}`)

    const data: Record<string, DictionaryEntry> = await response.json()
    dictionaryActions.setDictionary(data)
    isInitialized = true
  }
  catch (error) {
    console.error('[Chinese Dictionary] Failed to load dictionary:', error)
    ctx.showToast?.('Ошибка загрузки словаря', { type: 'error' })
  }
}

export function lookup(word: string): DictionaryEntry | null {
  if (!dictionaryState.isDictionaryLoaded)
    return null

  for (let i = word.length; i > 0; i--) {
    const sub = word.substring(0, i)
    if (dictionaryState.dictionary.has(sub)) {
      return dictionaryState.dictionary.get(sub)!
    }
  }

  return null
}
