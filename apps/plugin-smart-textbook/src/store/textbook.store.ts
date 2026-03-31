import type { GenerationHistory, PluginContext, ScenarioType } from '../types'
import { reactive, watch } from 'vue'

export const MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gpt-5.4-nano',
  'qwen3.5-397b-a17b',
]

export const tbState = reactive({
  apiKey: '',
  model: MODELS[0],

  isLoading: false,
  isSettingsOpen: false,
  isSidebarOpen: true,
  activeScenario: 'situational' as ScenarioType,
  currentInput: '',

  isFollowUpVisible: false,
  followUpInput: '',
  isFollowUpLoading: false,

  history: [] as GenerationHistory[],
  activeHistoryId: null as string | null,

  router: null as any,
  vaultId: '',
  vaultUrl: '',
  showToast: null as any,
  getFileContent: null as any,
  confirm: null as any,
})

export const tbActions = {
  setContext(ctx: PluginContext) {
    tbState.router = ctx.router
    tbState.vaultId = ctx.vaultId
    tbState.vaultUrl = ctx.vaultUrl
    tbState.getFileContent = ctx.getFileContent
    if (ctx.showToast)
      tbState.showToast = ctx.showToast
    if (ctx.confirm)
      tbState.confirm = ctx.confirm
  },

  notify(msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    if (tbState.showToast) {
      tbState.showToast(msg, { type })
    }
    else if (tbState.confirm) {
      tbState.confirm(msg)
    }
    else {
      // eslint-disable-next-line no-alert
      alert(msg)
    }
  },

  addHistory(scenario: ScenarioType, prompt: string, data: any) {
    const newEntry: GenerationHistory = {
      id: Date.now().toString(36),
      scenario,
      prompt,
      data,
      date: Date.now(),
    }
    tbState.history.unshift(newEntry)
    tbState.activeHistoryId = newEntry.id
  },

  getActiveData() {
    return tbState.history.find(h => h.id === tbState.activeHistoryId)?.data
  },

  getActivePrompt() {
    return tbState.history.find(h => h.id === tbState.activeHistoryId)?.prompt || ''
  },

  deleteHistory(id: string) {
    tbState.history = tbState.history.filter(h => h.id !== id)
    if (tbState.activeHistoryId === id) {
      tbState.activeHistoryId = tbState.history[0]?.id || null
    }
  },
}

export function initTbStore() {
  tbState.apiKey = localStorage.getItem('wm-tb-apikey') || ''
  tbState.model = localStorage.getItem('wm-tb-model') || MODELS[0]

  const savedSidebar = localStorage.getItem('wm-tb-sidebar')
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  if (savedSidebar !== null) {
    tbState.isSidebarOpen = savedSidebar === 'true'
  }
  else {
    tbState.isSidebarOpen = !isMobile
  }

  const savedHistory = localStorage.getItem('wm-tb-history')
  if (savedHistory) {
    tbState.history = JSON.parse(savedHistory)
    if (tbState.history.length > 0)
      tbState.activeHistoryId = tbState.history[0].id
  }

  watch(() => tbState.apiKey, val => localStorage.setItem('wm-tb-apikey', val))
  watch(() => tbState.model, val => localStorage.setItem('wm-tb-model', val))
  watch(() => tbState.isSidebarOpen, val => localStorage.setItem('wm-tb-sidebar', String(val)))
  watch(() => tbState.history, val => localStorage.setItem('wm-tb-history', JSON.stringify(val)), { deep: true })
}
