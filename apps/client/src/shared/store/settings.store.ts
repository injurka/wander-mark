import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useGlobalSettingsStore = defineStore('globalSettings', () => {
  const aiKey = useLocalStorage('global-ai-key', '')
  const aiModel = useLocalStorage('global-ai-model', 'gemini-3-flash-preview')

  return { aiKey, aiModel }
})
