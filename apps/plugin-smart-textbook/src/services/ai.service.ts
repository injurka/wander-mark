import type { ScenarioType } from '../types'
import { usePluginI18n } from '../i18n'
import { tbActions, tbState } from '../store/textbook.store'

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
      return typeof data.grammatical === 'string' && Array.isArray(data.possible_replies)
    case 'translation':
      return Array.isArray(data.paragraphs)
    default:
      return false
  }
}

export async function generateContent() {
  if (!tbState.currentInput.trim() || tbState.isLoading)
    return

  const { t } = usePluginI18n()

  if (!tbState.apiKey) {
    tbState.isSettingsOpen = true
    tbActions.notify(t('settings.apiKeyMissing'), 'warning')
    return
  }

  tbState.isLoading = true
  const prompt = tbState.currentInput
  const scenario = tbState.activeScenario

  const systemPrompt = t(`prompts.${scenario}`)

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

  const { t } = usePluginI18n()
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

  const systemPrompt = t(`prompts.${scenario}`)

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
