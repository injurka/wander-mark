import type { Ref } from 'vue'

export interface PluginContext {
  vaultId: string
  vaultUrl: string
  router: any
  getFileContent: (path: string) => Promise<string | null>
  showToast?: (message: string, options?: any) => void
  locale?: Ref<string>
  t?: (key: string) => string
}

export interface DictionaryEntry {
  pinyin: string
  definition: string
}
