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
 */
export type ScenarioType
  = | 'situational'
  | 'builder'
  | 'review'
  | 'speaking'
  | 'quiz'
  | 'stpmvo'
  | 'measure-words'
  | 'radicals'
  | 'chengyu'
  | 'tone-guesser'
  | 'declension'
  | 'aspect-pairs'
  | 'phrasal-verbs'

/** Тренажер тонов (Tone Guesser) для китайского */
export interface ToneGuesserData {
  exercises: {
    translation: string
    explanation: string
    syllables: {
      character: string
      base_pinyin: string
      correct_tone: number // 1, 2, 3, 4, 5(neutral)
      full_pinyin: string
    }[]
  }[]
}

export interface RadicalComponent {
  component: string
  pinyin: string
  meaning: string
  role: 'semantic' | 'phonetic' | 'structural' | string
  explanation: string
}

export interface CharacterDeconstruction {
  character: string
  pinyin: string
  meaning: string
  etymology: string
  hsk_level?: string
  components: RadicalComponent[]
}

export interface RadicalDeconstructorData {
  word: string
  word_pinyin: string
  word_translation: string
  characters: CharacterDeconstruction[]
}

export type TargetLanguage = 'Chinese' | 'English' | 'Russian'

export interface TopicDefinition {
  id: string
  labelKey: string
  scenario: ScenarioType
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

export interface QuizData {
  title: string
  questions: {
    type: string
    question: string
    phonetic_hint?: string
    options: string[]
    correct_answer: string
    explanation: string
  }[]
}

// ── Языко-специфичные сценарии ──

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
