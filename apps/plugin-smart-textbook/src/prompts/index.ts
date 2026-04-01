import type { ScenarioType, TargetLanguage } from '../types'

export function buildSystemPrompt(
  scenario: ScenarioType,
  targetLang: TargetLanguage,
  uiLocale: string,
): string {
  const uiLangMap: Record<string, string> = {
    ru: 'Russian',
    en: 'English',
    cn: 'Chinese',
  }
  const explanationLang = uiLangMap[uiLocale] || 'English'

  const baseInstructions = `You are an expert ${targetLang} language teacher. 
Your student's interface and preferred language for explanations is ${explanationLang}.
ALWAYS write your explanations, translations, and analysis in ${explanationLang}.
ONLY generate the text in the target language (${targetLang}) when providing the actual target phrases, words, or sentences.
Provide STRICTLY valid JSON without markdown wrapping (\`\`\`json).`

  switch (scenario) {
    case 'situational':
      return `${baseInstructions}
Generate a dialogue based on the user's situation. 
Schema:
{
  "messages": [
    {
      "speaker": "Name of speaker in ${explanationLang}",
      "original": "Sentence in ${targetLang}",
      "transcription": "Phonetic transcription (e.g., Pinyin for Chinese, IPA for English, accents for Russian) - space separated words. Leave empty if not applicable.",
      "translation": "Natural translation in ${explanationLang}",
      "literal_translation": "Word-for-word translation in ${explanationLang}",
      "keywords": [
        {
          "word": "Complex word from original",
          "transcription": "Phonetics/pinyin for this specific word (optional)",
          "explanation": "Short meaning in ${explanationLang}"
        }
      ]
    }
  ]
}`

    case 'builder':
      return `${baseInstructions}
Analyze the user's sentence for translation into ${targetLang}. Break it down logically.
Schema:
{
  "target": "Full target sentence in ${targetLang}",
  "grammar_rule": "Detailed grammar explanation in ${explanationLang} (markdown allowed)",
  "tokens": [
    {
      "text": "word/character in ${targetLang}",
      "transcription": "Phonetics/pinyin for this word (optional)",
      "role": "grammar role (subject/verb/object/etc) in ${explanationLang}",
      "logic_tag": "logic tag (Who/When/Where/What) in ${explanationLang}"
    }
  ]
}`

    case 'review':
      return `${baseInstructions}
Create a quiz/flashcards based on the provided text or words to learn ${targetLang}.
Schema:
{
  "cards": [
    {
      "context_with_blank": "Sentence in ${targetLang} with '___' replacing the target word",
      "phonetic_hint": "Phonetics/reading of the missing word (if applicable)",
      "answer": "Correct target word in ${targetLang}",
      "explanation": "Why this word is used, explained in ${explanationLang} (markdown allowed)"
    }
  ]
}`

    case 'speaking':
      return `${baseInstructions}
User inputs a phrase in ${explanationLang} or ${targetLang}. 
Provide translation options and possible replies in ${targetLang}.
Schema:
{
  "original": "User's exact input",
  "grammatical": {
    "text": "Grammatically correct version in ${targetLang}",
    "transcription": "Phonetics/pinyin (optional)"
  },
  "colloquial": {
    "text": "How a native speaker would say it (natural/slang) in ${targetLang}",
    "transcription": "Phonetics/pinyin (optional)"
  },
  "formal": {
    "text": "Formal or polite version in ${targetLang}",
    "transcription": "Phonetics/pinyin (optional)"
  },
  "possible_replies": [
    {
      "text": "Interlocutor reply option 1 in ${targetLang}",
      "transcription": "Phonetics/pinyin (optional)",
      "translation": "Translation of this reply in ${explanationLang}"
    }
  ]
}`

    // ── Языко-специфичные сценарии ──

    case 'stpmvo':
      return `${baseInstructions}
Analyze the user's Chinese sentence using the STPMVO word-order model (Subject, Time, Place, Manner, Verb, Object).
Break the sentence into components, assigning each word/phrase one of these roles: S, T, P, M, V, O, or "particle" for grammatical particles (的, 了, 吗, etc.).
Generate exactly ONE analysis per request.

Schema:
{
  "sentence": "Full sentence in Chinese",
  "pinyin": "Full pinyin for the sentence",
  "translation": "Natural translation in ${explanationLang}",
  "components": [
    {
      "role": "S",
      "text": "Chinese text for this component",
      "pinyin": "Pinyin for this component",
      "meaning": "Short meaning in ${explanationLang}",
      "explanation": "Detailed explanation of why this role was assigned, in ${explanationLang}"
    }
  ],
  "grammar_notes": "Detailed grammar analysis in ${explanationLang} (markdown). Explain the STPMVO structure, any deviations, and key grammar patterns."
}`

    case 'measure-words':
      return `${baseInstructions}
Create a quiz about Chinese measure words (量词). Based on the user's input, generate exercises where the student must choose the correct measure word for a given noun.
Generate 5 exercises.

Schema:
{
  "exercises": [
    {
      "noun": "Chinese noun",
      "noun_pinyin": "Pinyin of the noun",
      "noun_meaning": "Meaning in ${explanationLang}",
      "correct_measure": "Correct measure word in Chinese",
      "correct_measure_pinyin": "Pinyin of the correct measure word",
      "options": [
        { "text": "measure word option in Chinese", "pinyin": "its pinyin" }
      ],
      "example_sentence": "Full example sentence using this noun with the correct measure word",
      "example_pinyin": "Pinyin of the example sentence",
      "example_translation": "Translation in ${explanationLang}",
      "explanation": "Why this measure word is used with this noun, in ${explanationLang}"
    }
  ]
}

IMPORTANT: Provide exactly 4 options per exercise. Only one option is correct. Make distractors plausible but wrong.`

    case 'chengyu':
      return `${baseInstructions}
Based on the user's input, generate Chinese idioms (成语 chéngyǔ) with detailed explanations.
Generate EXACTLY the number of idioms the user requests. If they ask for one, return one. If no specific number is mentioned, generate 3.

Schema:
{
  "idioms": [
    {
      "chengyu": "Four-character idiom in Chinese",
      "pinyin": "Pinyin with tones",
      "literal_translation": "Word-by-word literal translation in ${explanationLang}",
      "meaning": "Actual meaning / how it's used, in ${explanationLang}",
      "origin": "Historical origin story or source text, in ${explanationLang} (markdown allowed). Be detailed and interesting.",
      "example_sentence": "Example sentence using this chengyu in Chinese",
      "example_pinyin": "Pinyin of example sentence",
      "example_translation": "Translation of the example in ${explanationLang}",
      "usage_notes": "When and how to use this idiom. Formality level, common contexts, in ${explanationLang}"
    }
  ]
}`

    case 'declension':
      return `${baseInstructions}
Create a Russian declension (склонение) quiz. Based on the user's input, generate exercises where the student must choose the correct grammatical case form of a word.
Generate 5 exercises.

Schema:
{
  "exercises": [
    {
      "base_form": "Dictionary form of the word (nominative singular)",
      "word_type": "Part of speech in ${explanationLang} (e.g. noun, adjective)",
      "context_sentence": "Sentence in Russian with '___' where the correct form should go",
      "target_case": "Name of the required case in ${explanationLang} (e.g. Genitive, Dative)",
      "correct_form": "Correct declined form in Russian",
      "options": ["option1", "option2", "option3", "option4"],
      "explanation": "Why this case is needed here, grammar rule, in ${explanationLang} (markdown)",
      "declension_table": [
        { "case_name": "Nominative", "form": "declined form" },
        { "case_name": "Genitive", "form": "declined form" },
        { "case_name": "Dative", "form": "declined form" },
        { "case_name": "Accusative", "form": "declined form" },
        { "case_name": "Instrumental", "form": "declined form" },
        { "case_name": "Prepositional", "form": "declined form" }
      ]
    }
  ]
}

IMPORTANT: Provide exactly 4 options per exercise. Only one is correct. Include plausible wrong forms.`

    case 'aspect-pairs':
      return `${baseInstructions}
Generate Russian aspect pairs (видовые пары) analysis. Based on the user's input, show pairs of imperfective (НСВ) and perfective (СВ) verbs with usage examples.
Generate 3-4 pairs.

Schema:
{
  "pairs": [
    {
      "imperfective": "Imperfective verb form in Russian",
      "perfective": "Perfective verb form in Russian",
      "base_meaning": "Base meaning of the verb pair in ${explanationLang}",
      "imperfective_usage": "When to use the imperfective form, in ${explanationLang}",
      "perfective_usage": "When to use the perfective form, in ${explanationLang}",
      "examples": [
        {
          "imperfective_sentence": "Example sentence with imperfective in Russian",
          "perfective_sentence": "Same meaning but with perfective in Russian",
          "translation": "Translation in ${explanationLang}",
          "context_hint": "Short label: process/result/repeated/single etc in ${explanationLang}"
        }
      ],
      "formation_rule": "How this pair is formed (prefix, suffix, stem change, suppletive), in ${explanationLang} (markdown)"
    }
  ]
}`

    case 'phrasal-verbs':
      return `${baseInstructions}
Generate English phrasal verbs analysis. Based on the user's input, analyze a base verb and its phrasal variations.
Generate 4-6 variations.

Schema:
{
  "base_verb": "Base verb in English",
  "base_meaning": "Core meaning of the base verb in ${explanationLang}",
  "variations": [
    {
      "phrasal_verb": "verb + particle (e.g. 'give up')",
      "meaning": "Meaning of this phrasal verb in ${explanationLang}",
      "example_sentence": "Example sentence using this phrasal verb in English",
      "example_translation": "Translation in ${explanationLang}",
      "fill_in_blank": "Same or similar sentence with '___' replacing the particle",
      "correct_particle": "The correct particle (e.g. 'up')",
      "particle_options": ["up", "off", "out", "in"]
    }
  ]
}

IMPORTANT: Provide exactly 4 particle_options per variation. Only one is correct.`

    default:
      return baseInstructions
  }
}

const RANDOM_PROMPTS_BY_TOPIC: Record<string, string[]> = {
  review: [
    'Дай мне неожиданный вопрос для самопроверки по этой теме, который большинство учеников упускают',
    'Придумай мини-тест из 3 вопросов с возрастающей сложностью по этой теме',
    'Сформулируй провокационное утверждение по теме, которое нужно опровергнуть или подтвердить',
  ],
  translation: [
    'Предложи нестандартное предложение для перевода, где легко ошибиться в выборе слова',
    'Дай предложение с культурным контекстом, которое сложно перевести дословно',
    'Придумай предложение с идиомой, которую нужно адаптировать при переводе',
  ],
  situational: [
    'Опиши неожиданную бытовую ситуацию, в которой нужно срочно объясниться',
    'Придумай диалог в нестандартном месте — например, в ремонтной мастерской или у врача',
    'Создай ситуацию с недопониманием, которое нужно разрешить вежливо',
  ],
  speaking: [
    'Предложи тему для монолога на 1 минуту, которая заставит думать на ходу',
    'Дай вопрос для дискуссии, где нет однозначного ответа',
    'Придумай ролевую игру: я — клиент, ты — сотрудник, с неожиданным поворотом',
  ],
  builder: [
    'Составь предложение с редкой грамматической конструкцией этой темы',
    'Дай предложение, где порядок слов критически важен',
    'Придумай предложение с двумя возможными интерпретациями из-за пунктуации',
  ],
  declension: [
    'Предложи существительное с нестандартным склонением для практики',
    'Дай предложение с несколькими словами в разных падежах одновременно',
    'Придумай фразу, где ошибка в падеже меняет смысл на противоположный',
  ],
  aspectPairs: [
    'Придумай ситуацию, где выбор вида глагола (СВ/НСВ) меняет смысл предложения',
    'Дай пример, где оба вида формально возможны, но имеют разные оттенки',
    'Составь мини-рассказ, где важно чередовать совершенный и несовершенный вид',
  ],
  phrasalVerbs: [
    'Дай предложение с фразовым глаголом, смысл которого нельзя угадать из частей',
    'Придумай контекст, где один фразовый глагол имеет два разных значения',
    'Составь диалог, где ключевую роль играет предлог при фразовом глаголе',
  ],
  stpmvo: [
    'Разбери предложение с необычным порядком членов предложения',
    'Придумай предложение, где подлежащее намеренно скрыто или подразумевается',
    'Дай пример сложного предложения с несколькими придаточными',
  ],
  chengyu: [
    'Расскажи историю происхождения одного чэнъюй, связанного с едой или природой',
    'Придумай современный контекст употребления классического чэнъюй',
    'Дай чэнъюй, который часто путают с другим из-за схожих иероглифов',
  ],
  measureWords: [
    'Придумай предложение, где выбор счётного слова принципиально важен для смысла',
    'Дай список из 5 существительных и попроси подобрать к ним счётные слова',
    'Составь вопрос-ловушку с двумя кажущимися правильными счётными словами',
  ],
}

const DEFAULT_RANDOM_PROMPTS = [
  'Придумай нестандартное упражнение по текущей теме, которое удивит своей необычностью',
  'Дай пример из реальной жизни, иллюстрирующий главную сложность этой темы',
  'Предложи задание, которое объединяет эту тему с другой смежной областью языка',
  'Составь короткую историю, в которой демонстрируются 3 разных аспекта этой темы',
  'Придумай мнемонический приём для запоминания ключевого правила по этой теме',
]

export function getRandomPrompt(topicId: string): string {
  const pool = RANDOM_PROMPTS_BY_TOPIC[topicId] ?? DEFAULT_RANDOM_PROMPTS
  return pool[Math.floor(Math.random() * pool.length)]
}
