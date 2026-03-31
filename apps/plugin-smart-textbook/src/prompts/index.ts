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
      "transcription": "Phonetics/pinyin (optional)"
    }
  ]
}`

    default:
      return baseInstructions
  }
}
