import { state } from '../store/hanzi-saver.store'

export async function analyzeHanziWithAi(text: string) {
  if (!state.apiKey)
    throw new Error('API Key is missing')

  const prompt = `
You are an expert in Chinese linguistics. Analyze the provided Chinese text (can be a character, word, or short idiom).
Provide STRICTLY valid JSON.
Schema:
{
  "character": "The exact input",
  "pinyin": "Pinyin with tone marks",
  "translation": "Translation in Russian",
  "part_of_speech": "Part of speech in Russian (e.g. 'Существительное', 'Глагол', 'Идиома')",
  "hsk": "HSK Level (e.g. 'HSK 1', 'HSK 4', 'None')",
  "strokes": "Number of strokes (integer)",
  "components": ["List of radicals/components with translation, e.g. '氵 (вода)'"],
  "etymology": "Brief etymology or mnemonic story in Russian"
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
  })

  if (!res.ok)
    throw new Error(`AI API Error: ${res.status}`)

  const data = await res.json()
  const content = data.choices[0].message.content.replace(/^```(?:json)?\s*/i, '').replace(/`{1,3}\s*$/, '')
  return JSON.parse(content)
}
