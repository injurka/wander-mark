import type { HanziData } from '../types'
import { state } from '../store/hanzi-saver.store'

export async function analyzeHanziWithAi(text: string, signal?: AbortSignal): Promise<HanziData> {
  if (!state.apiKey)
    throw new Error('API Key is missing')

  const prompt = `
You are an expert in Chinese linguistics. Analyze the provided Chinese text. 
First, determine if the text is a single word/character/idiom OR a full sentence.
Provide STRICTLY valid JSON.

Schema:
{
  "char": "The exact input text",
  "pinyin": "Pinyin with tone marks",
  "translation": "Translation in Russian",
  "type": "Must be exactly 'word' or 'sentence'",
  
  // If type is 'word', include these fields:
  "part_of_speech": "Part of speech in Russian",
  "hsk": "HSK Level 1-9 (e.g. 'HSK 1', 'HSK 4', 'None')",
  "strokes": Number of strokes (integer),
  "components": ["List of radicals/components with translation, e.g. '氵 (вода)'"],
  "etymology": "Brief etymology or mnemonic story in Russian",

  // If type is 'sentence', include these fields instead:
  "words_breakdown": [
    { 
      "word": "Chinese word or character", 
      "pinyin": "pinyin", 
      "translation": "short translation in Russian",
      "grammar_role": "Grammatical role (e.g., Subject, Time, Place, Manner, Verb, Object, Particle). Keep it short in Russian.",
      "explanation": "Detailed explanation of its grammatical function or literal meaning in context (e.g., 'глагольный суффикс, указывающий на завершенность действия (прошедшее время)')."
    }
  ],
  "grammar_notes": "General explanation of the grammar patterns used in the whole sentence in Russian"
}`

  const res = await fetch('https://api.aihubmix.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({
      model: state.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
    }),
    signal,
  })

  if (!res.ok)
    throw new Error(`AI API Error: ${res.status}`)

  const data = await res.json()
  const content = data.choices[0].message.content.replace(/^```(?:json)?\s*/i, '').replace(/`{1,3}\s*$/, '')
  return JSON.parse(content) as HanziData
}
