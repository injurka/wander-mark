/* eslint-disable e18e/prefer-static-regex */
import type { ScenarioType } from '../types'
import { usePluginI18n } from '../i18n'
import { buildSystemPrompt } from '../prompts'
import { activeScenario, tbActions, tbState } from '../store/textbook.store'

function cleanAiJson(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, '')
  s = s.replace(/`{1,3}\s*$/, '')
  return s.trim()
}

function isDataValid(scenario: ScenarioType, data: any): boolean {
  if (!data)
    return false
  switch (scenario) {
    case 'situational':
      return Array.isArray(data.messages)
    case 'builder':
      return typeof data.target === 'string' && Array.isArray(data.tokens)
    case 'review':
      return Array.isArray(data.cards)
    case 'speaking':
      return !!data.grammatical && Array.isArray(data.possible_replies)
    case 'quiz':
      return Array.isArray(data.questions) && data.questions.length > 0

    // ── Языко-специфичные ──
    case 'stpmvo':
      return typeof data.sentence === 'string' && Array.isArray(data.components)
    case 'measure-words':
      return Array.isArray(data.exercises) && data.exercises.length > 0
    case 'chengyu':
      return Array.isArray(data.idioms) && data.idioms.length > 0
    case 'declension':
      return Array.isArray(data.exercises) && data.exercises.length > 0
    case 'aspect-pairs':
      return Array.isArray(data.pairs) && data.pairs.length > 0
    case 'phrasal-verbs':
      return typeof data.base_verb === 'string' && Array.isArray(data.variations)

    default:
      return false
  }
}

export async function generateContent() {
  if (!tbState.currentInput.trim() || tbState.isLoading)
    return

  const { t, locale } = usePluginI18n()

  if (!tbState.apiKey) {
    tbState.isSettingsOpen = true
    tbActions.notify(t('settings.apiKeyMissing'), 'warning')
    return
  }

  tbState.isLoading = true
  const prompt = tbState.currentInput
  const scenario = activeScenario.value
  const targetLang = tbState.targetLanguage

  const systemPrompt = buildSystemPrompt(scenario, targetLang, locale.value)

  try {
    const res = await fetch('https://api.aihubmix.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tbState.apiKey}`,
      },
      body: JSON.stringify({
        model: tbState.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok)
      throw new Error(`API Error: ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content

    const cleanJson = cleanAiJson(content)
    const parsedData = JSON.parse(cleanJson)

    if (!isDataValid(scenario, parsedData)) {
      throw new Error('Получен некорректный формат данных от AI.')
    }

    tbActions.addHistory(scenario, prompt, parsedData)
    tbState.currentInput = ''
  }
  catch (error: any) {
    console.error('Ошибка генерации:', error)
    tbActions.notify(`Ошибка: ${error.message}`, 'error')
  }
  finally {
    tbState.isLoading = false
  }
}

export async function generateFollowUp() {
  if (!tbState.followUpInput.trim() || tbState.isFollowUpLoading)
    return

  const { t, locale } = usePluginI18n()
  const activeItem = tbState.history.find(h => h.id === tbState.activeHistoryId)
  if (!activeItem)
    return

  if (!tbState.apiKey) {
    tbState.isSettingsOpen = true
    tbActions.notify(t('settings.apiKeyMissing'), 'warning')
    return
  }

  tbState.isFollowUpLoading = true
  const prompt = tbState.followUpInput
  const scenario = activeItem.scenario
  const targetLang = activeItem.targetLang

  const systemPrompt = buildSystemPrompt(scenario, targetLang, locale.value)

  try {
    const res = await fetch('https://api.aihubmix.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tbState.apiKey}`,
      },
      body: JSON.stringify({
        model: tbState.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: activeItem.prompt },
          { role: 'assistant', content: JSON.stringify(activeItem.data) },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok)
      throw new Error(`API Error: ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content

    const cleanJson = cleanAiJson(content)
    const parsedData = JSON.parse(cleanJson)

    if (!isDataValid(scenario, parsedData)) {
      throw new Error('Получен некорректный формат данных от AI.')
    }

    tbActions.addHistory(scenario, prompt, parsedData)
    tbState.followUpInput = ''
    tbState.isFollowUpVisible = false
  }
  catch (error: any) {
    console.error('Ошибка генерации Follow-up:', error)
    tbActions.notify(`Ошибка: ${error.message}`, 'error')
  }
  finally {
    tbState.isFollowUpLoading = false
  }
}
