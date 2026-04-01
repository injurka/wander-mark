import type { GenerationHistory, PluginContext, ScenarioType, TargetLanguage, TopicDefinition } from '../types'
import { computed, reactive, watch } from 'vue'

export const MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
]

export const TARGET_LANGUAGES: TargetLanguage[] = [
  'Chinese',
  'English',
  'Russian',
]

/**
 * Реестр тем.
 * Каждая тема имеет собственный scenario, определяющий компонент, промпт и валидацию.
 * Темы без `languages` — общие. Темы с `languages` — видны только для указанных языков.
 */
export const TOPIC_REGISTRY: TopicDefinition[] = [
  // ── Общие (все языки) ──
  { id: 'situational', labelKey: 'scenario.situational', scenario: 'situational' },
  { id: 'builder', labelKey: 'scenario.builder', scenario: 'builder' },
  { id: 'review', labelKey: 'scenario.review', scenario: 'review' },
  { id: 'speaking', labelKey: 'scenario.speaking', scenario: 'speaking' },

  // ── Китайский ──
  { id: 'stpmvo-analysis', labelKey: 'scenario.stpmvoAnalysis', scenario: 'stpmvo', languages: ['Chinese'] },
  { id: 'measure-words', labelKey: 'scenario.measureWords', scenario: 'measure-words', languages: ['Chinese'] },
  { id: 'chengyu-idioms', labelKey: 'scenario.chengyuIdioms', scenario: 'chengyu', languages: ['Chinese'] },

  // ── Русский ──
  { id: 'declension-practice', labelKey: 'scenario.declensionPractice', scenario: 'declension', languages: ['Russian'] },
  { id: 'aspect-pairs', labelKey: 'scenario.aspectPairs', scenario: 'aspect-pairs', languages: ['Russian'] },

  // ── Английский ──
  { id: 'phrasal-verbs', labelKey: 'scenario.phrasalVerbs', scenario: 'phrasal-verbs', languages: ['English'] },
]

export const tbState = reactive({
  apiKey: '',
  model: MODELS[0],
  targetLanguage: TARGET_LANGUAGES[0] as TargetLanguage,

  isLoading: false,
  isSettingsOpen: false,
  isSidebarOpen: true,
  /** Выбранная тема (id из TOPIC_REGISTRY) */
  activeTopic: 'situational' as string,

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

/**
 * Темы, отфильтрованные под текущий целевой язык,
 * разбитые на группы: общие и языковые.
 */
export const filteredTopics = computed(() => {
  const lang = tbState.targetLanguage
  const universal: TopicDefinition[] = []
  const langSpecific: TopicDefinition[] = []

  for (const topic of TOPIC_REGISTRY) {
    if (!topic.languages || topic.languages.length === 0) {
      universal.push(topic)
    }
    else if (topic.languages.includes(lang)) {
      langSpecific.push(topic)
    }
  }

  return { universal, langSpecific }
})

/** Вычисляемый сценарий на основе выбранной темы */
export const activeScenario = computed<ScenarioType>(() => {
  const topic = TOPIC_REGISTRY.find(t => t.id === tbState.activeTopic)
  return topic?.scenario ?? 'situational'
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
      targetLang: tbState.targetLanguage,
    }
    tbState.history.unshift(newEntry)
    tbState.activeHistoryId = newEntry.id
  },

  getActiveData() {
    return tbState.history.find(h => h.id === tbState.activeHistoryId)?.data
  },

  getActiveTargetLang(): TargetLanguage {
    return tbState.history.find(h => h.id === tbState.activeHistoryId)?.targetLang || tbState.targetLanguage
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

  const savedLang = localStorage.getItem('wm-tb-targetlang') as TargetLanguage
  if (savedLang && TARGET_LANGUAGES.includes(savedLang)) {
    tbState.targetLanguage = savedLang
  }

  const savedTopic = localStorage.getItem('wm-tb-topic')
  if (savedTopic && TOPIC_REGISTRY.some(t => t.id === savedTopic)) {
    tbState.activeTopic = savedTopic
  }

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
  watch(() => tbState.targetLanguage, (val) => {
    localStorage.setItem('wm-tb-targetlang', val)
    // Если текущая тема не подходит под новый язык — сбрасываем на первую общую
    const topic = TOPIC_REGISTRY.find(t => t.id === tbState.activeTopic)
    if (topic?.languages && topic.languages.length > 0 && !topic.languages.includes(val)) {
      tbState.activeTopic = 'situational'
    }
  })
  watch(() => tbState.activeTopic, val => localStorage.setItem('wm-tb-topic', val))
  watch(() => tbState.isSidebarOpen, val => localStorage.setItem('wm-tb-sidebar', String(val)))
  watch(() => tbState.history, val => localStorage.setItem('wm-tb-history', JSON.stringify(val)), { deep: true })
}
