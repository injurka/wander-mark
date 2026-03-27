import type { DictionaryEntry, PluginContext } from '../types'
import { reactive } from 'vue'

export const dictionaryState = reactive({
  // Контекст хоста
  context: null as PluginContext | null,

  // Состояние словаря
  isDictionaryLoaded: false,
  dictionary: new Map<string, DictionaryEntry>(),

  // Состояние UI
  isVisible: false,
  isLoading: false,
  position: { x: 0, y: 0 },
  entry: null as DictionaryEntry | null,
  hanzi: '',
})

export const dictionaryActions = {
  setContext(ctx: PluginContext) {
    dictionaryState.context = ctx
  },

  showTooltip(x: number, y: number, hanzi: string) {
    dictionaryState.position = { x, y }
    dictionaryState.hanzi = hanzi
    dictionaryState.isVisible = true
    dictionaryState.isLoading = true
    dictionaryState.entry = null
  },

  hideTooltip() {
    dictionaryState.isVisible = false
  },

  setEntry(entry: DictionaryEntry | null) {
    dictionaryState.entry = entry
    dictionaryState.isLoading = false
  },

  setDictionary(data: Record<string, DictionaryEntry>) {
    dictionaryState.dictionary = new Map(Object.entries(data))
    dictionaryState.isDictionaryLoaded = true
  },
}
