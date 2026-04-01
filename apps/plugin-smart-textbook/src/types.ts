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

export interface TranslationData {
  paragraphs: {
    words: {
      word: string
      literal: string
    }[]
    translation: string
    literal?: string
    cultural_note?: string
  }[]
}

/**
 * Расширенный тип сценария.
 * 4 базовых + 6 языко-специфичных, каждый со своей схемой данных и компонентом.
 */
export type ScenarioType
  = | 'situational'
  | 'builder'
  | 'review'
  | 'speaking'
  | 'stpmvo'
  | 'measure-words'
  | 'chengyu'
  | 'declension'
  | 'aspect-pairs'
  | 'phrasal-verbs'

export type TargetLanguage = 'Chinese' | 'English' | 'Russian'

/** Определение темы с опциональной привязкой к языку */
export interface TopicDefinition {
  /** Уникальный ключ темы */
  id: string
  /** i18n-ключ для отображаемого названия */
  labelKey: string
  /** Тип сценария — определяет компонент, промпт и валидацию */
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

// ── Базовые сценарии ──

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

export interface SpeakingKeyword {
  word: string
  transcription?: string
  explanation?: string
}

export interface SpeakingVariant {
  text: string
  transcription?: string
  keywords?: SpeakingKeyword[]
}

export interface SpeakingData {
  original: string
  grammatical: string | SpeakingVariant
  colloquial: string | SpeakingVariant
  formal: string | SpeakingVariant
  possiblereplies: (
    | string
    | {
      text: string
      transcription?: string
      translation?: string
      keywords?: SpeakingKeyword[]
    }
  )[]
}

// ── Языко-специфичные сценарии ──

/** Разбор предложения по модели STPMVO (китайский) */
export interface StpmvoData {
  sentence: string
  pinyin: string
  translation: string
  components: {
    role: 'S' | 'T' | 'P' | 'M' | 'V' | 'O' | 'particle'
    text: string
    pinyin: string
    meaning: string
    explanation: string
  }[]
  grammar_notes: string
}

/** Тренажёр счётных слов 量词 (китайский) */
export interface MeasureWordsData {
  exercises: {
    noun: string
    noun_pinyin: string
    noun_meaning: string
    correct_measure: string
    correct_measure_pinyin: string
    options: { text: string, pinyin: string }[]
    example_sentence: string
    example_pinyin: string
    example_translation: string
    explanation: string
  }[]
}

/** Карточки идиом — чэнъюй 成语 (китайский) */
export interface ChengyuData {
  idioms: {
    chengyu: string
    pinyin: string
    literal_translation: string
    meaning: string
    origin: string
    example_sentence: string
    example_pinyin: string
    example_translation: string
    usage_notes: string
  }[]
}

/** Тренажёр падежей (русский) */
export interface DeclensionData {
  exercises: {
    base_form: string
    word_type: string
    context_sentence: string
    target_case: string
    correct_form: string
    options: string[]
    explanation: string
    declension_table: {
      case_name: string
      form: string
    }[]
  }[]
}

/** Видовые пары глаголов (русский) */
export interface AspectPairsData {
  pairs: {
    imperfective: string
    perfective: string
    base_meaning: string
    imperfective_usage: string
    perfective_usage: string
    examples: {
      imperfective_sentence: string
      perfective_sentence: string
      translation: string
      context_hint: string
    }[]
    formation_rule: string
  }[]
}

/** Фразовые глаголы (английский) */
export interface PhrasalVerbsData {
  base_verb: string
  base_meaning: string
  variations: {
    phrasal_verb: string
    meaning: string
    example_sentence: string
    example_translation: string
    fill_in_blank: string
    correct_particle: string
    particle_options: string[]
  }[]
}
