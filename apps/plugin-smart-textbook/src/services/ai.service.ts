import type { ScenarioType } from '../types'
import { usePluginI18n } from '../i18n'
import { buildSystemPrompt } from '../prompts'
import { activeScenario, tbActions, tbState, TOPIC_REGISTRY } from '../store/textbook.store'

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
    default:
      return false
  }
}

/**
 * Формирует дополнительную подсказку для AI,
 * если выбрана языко-специфичная тема.
 */
function getTopicHint(topicId: string): string {
  const topic = TOPIC_REGISTRY.find(t => t.id === topicId)
  if (!topic || !topic.languages || topic.languages.length === 0)
    return ''

  const hints: Record<string, string> = {
    'stpmvo-analysis': 'Focus on breaking the sentence using the Chinese STPMVO word-order model (Subject, Time, Place, Manner, Verb, Object). Highlight the role of each token according to STPMVO.',
    'declension-practice': 'Focus on Russian noun/adjective declension. Generate flashcards where the student must fill in the correct grammatical case form.',
    'measure-words': 'Focus on Chinese measure words (量词). Each card should test the correct measure word for a given noun.',
    'chengyu-idioms': 'Generate a dialogue that naturally uses Chinese chengyu (成语). Explain the origin and meaning of each idiom used.',
    'phrasal-verbs': 'Focus on English phrasal verbs. Show how different particles change the meaning of the base verb.',
    'aspect-pairs': 'Focus on Russian aspect pairs (видовые пары). For each verb, show both perfective and imperfective forms and contexts where each is used.',
  }

  return hints[topicId] || ''
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

  let systemPrompt = buildSystemPrompt(scenario, targetLang, locale.value)

  const topicHint = getTopicHint(tbState.activeTopic)
  if (topicHint) {
    systemPrompt += `\n\nAdditional focus: ${topicHint}`
  }

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

    // eslint-disable-next-line e18e/prefer-static-regex
    const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
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

    // eslint-disable-next-line e18e/prefer-static-regex
    const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
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
