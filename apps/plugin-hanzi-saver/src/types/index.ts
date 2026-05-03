export interface HanziWordBreakdown {
  word: string
  pinyin: string
  translation: string
  grammar_role?: string // STPMVO роль или часть речи (Субъект, Глагол, Частица и т.д.)
  explanation?: string 
}

export interface HanziData {
  char: string
  pinyin: string
  translation: string
  type: 'word' | 'sentence'

  // Поля для type === 'word'
  part_of_speech?: string
  hsk?: string
  strokes?: number
  components?: string[]
  etymology?: string

  // Поля для type === 'sentence'
  words_breakdown?: HanziWordBreakdown[]
  grammar_notes?: string
}

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info'
}
