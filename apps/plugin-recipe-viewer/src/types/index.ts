export interface Ingredient {
  item: string // snake_case Cyrillic: ^[а-яё0-9_]+$
  amount: number
  unit: string
  required: boolean
  alternatives: string[] // Array of snake_case Cyrillic strings
  group?: string // Optional ingredient group name for HTML rendering
}

export interface ScienceNote {
  question: string
  answer: string
}

export interface RecipeStep {
  title: string
  description: string
}

export interface RecipeFormState {
  title: string
  id: string
  category: string
  difficulty: number
  tea_base_type: string
  temperature: string
  time_total_min: number
  servings_default: number
  ingredients: Ingredient[]
  tools: string[]
  tags: string[]

  // HTML Body sections
  description: string
  science_notes: ScienceNote[]
  steps: RecipeStep[]
  tip_title: string
  tip_content: string
  history_title: string
  history_content: string
}

export interface RecipeFrontmatter {
  target: 'tea-recipe'
  id: string
  title: string
  category: string
  difficulty: number
  time_total_min: number
  servings_default: number
  tea_base_type: string
  temperature: string
  ingredients: {
    item: string
    amount: number
    unit: string
    required: boolean
    alternatives?: string[]
  }[]
  tools: string[]
  tags: string[]
}
