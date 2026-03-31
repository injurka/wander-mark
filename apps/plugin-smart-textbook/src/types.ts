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

export type ScenarioType = 'situational' | 'builder' | 'review' | 'speaking'
export type TargetLanguage = 'Chinese' | 'English' | 'Russian'

/** Определение темы с опциональной привязкой к языку */
export interface TopicDefinition {
  /** Уникальный ключ сценария (используется как value) */
  id: string
  /** i18n-ключ для отображаемого названия */
  labelKey: string
  /** Тип сценария */
  scenario: ScenarioType
  /**
   * К каким языкам привязана тема.
   * undefined / пустой массив = доступна для всех языков.
   */
  languages?: TargetLanguage[]
}

export interface GenerationHistory {
  id: string
  scenario: ScenarioType
  prompt: string
  data: any
  date: number
  targetLang: TargetLanguage
}

export interface SituationalData {
  messages: {
    speaker: string
    original: string
    transcription?: string
    translation: string
    literal_translation?: string
    keywords: { word: string, transcription?: string, explanation: string }[]
  }[]
}

export interface BuilderData {
  target: string
  grammar_rule: string
  tokens: { text: string, transcription?: string, role: string, logic_tag: string }[]
}

export interface ReviewData {
  cards: {
    context_with_blank: string
    phonetic_hint?: string
    answer: string
    explanation: string
  }[]
}

export interface SpeakingData {
  original: string
  grammatical: { text: string, transcription?: string }
  colloquial: { text: string, transcription?: string }
  formal: { text: string, transcription?: string }
  possible_replies: { text: string, transcription?: string }[]
}
