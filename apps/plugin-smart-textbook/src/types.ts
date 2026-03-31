import type { Ref } from 'vue'

export interface PluginContext {
  vaultId: string
  vaultUrl: string
  searchIndex: any[] | null
  navItems: any[] | null
  router: any
  getFileContent: (path: string) => Promise<string | null>
  showToast?: (message: string, options?: any) => void
  confirm?: (options: any) => Promise<boolean>
  locale?: Ref<string>
  t?: (key: string) => string
}

export type ScenarioType = 'situational' | 'builder' | 'review' | 'speaking' | 'translation'

export interface GenerationHistory {
  id: string
  scenario: ScenarioType
  prompt: string
  data: any // Распарсенный JSON
  date: number
}

// 1. Ситуативные сценарии
export interface SituationalData {
  messages: {
    speaker: string
    original: string
    pinyin: string
    translation: string
    literal: string
    keywords: { word: string, explanation: string }[]
  }[]
}

// 2. Конструктор предложений
export interface BuilderData {
  target: string
  grammar_rule: string
  tokens: { text: string, role: string, logic_tag: string }[]
}

// 3. Повторение (Review)
export interface ReviewData {
  cards: {
    context_with_blank: string
    pinyin_hint: string
    answer: string
    explanation: string
  }[]
}

// 4. Разговорная практика
export interface SpeakingData {
  original: string
  grammatical: string
  colloquial: string
  formal: string
  possible_replies: string[]
}

// 5. Расширенный перевод
export interface TranslationData {
  paragraphs: {
    original: string
    translation: string
    literal: string
    cultural_note?: string
    words: { word: string, literal: string }[]
  }[]
}
