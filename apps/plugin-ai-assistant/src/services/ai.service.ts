import { usePluginI18n } from '../i18n'
import { aiActions, aiState } from '../store/ai.store'

let abortController: AbortController | null = null

export async function sendAiRequest(promptText: string, onScrollRequest: () => void) {
  if (!promptText.trim() || aiState.isLoading)
    return

  const { t } = usePluginI18n()

  if (!aiState.apiKey) {
    aiState.activeTab = 'settings'
    // eslint-disable-next-line no-alert
    alert(t('settings.apiKeyMissing'))
    return
  }

  if (!aiState.currentTopicId) {
    aiActions.createNewTopic()
  }

  const topic = aiActions.getCurrentTopic()
  if (!topic)
    return

  if (topic.title === t('store.newChat') || topic.title === t('store.oldChat')) {
    topic.title = promptText.length > 30 ? `${promptText.slice(0, 30)}...` : promptText
  }

  const activePrompt = aiState.systemPrompts.find(p => p.id === aiState.selectedPromptId) || aiState.systemPrompts[0]

  const messages: any[] = [
    { role: 'system', content: activePrompt.content },
  ]

  for (const item of topic.history) {
    if (item.status === 'success') {
      messages.push({ role: 'user', content: item.prompt })

      if (item.response) {
        messages.push({ role: 'assistant', content: item.response })
      }
    }
  }

  messages.push({ role: 'user', content: promptText })

  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`

  topic.history.push({
    id: requestId,
    prompt: promptText,
    response: '',
    status: 'loading',
    date: Date.now(),
  })
  topic.updatedAt = Date.now()

  aiState.isLoading = true
  abortController = new AbortController()
  onScrollRequest()

  try {
    const res = await fetch('https://api.aihubmix.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiState.apiKey}`,
      },
      body: JSON.stringify({
        model: aiState.selectedModel,
        messages,
      }),
      signal: abortController.signal,
    })

    if (!res.ok)
      throw new Error(`API Error: ${res.status}`)

    const data = await res.json()
    const responseText = data.choices?.[0]?.message?.content || t('store.emptyRes')

    updateHistoryItem(requestId, { response: responseText, status: 'success' })
  }
  catch (error: any) {
    if (error.name === 'AbortError') {
      updateHistoryItem(requestId, { response: t('store.abortedRes'), status: 'aborted' })
    }
    else {
      updateHistoryItem(requestId, { response: `${t('chat.error')}: ${error.message}`, status: 'error' })
    }
  }
  finally {
    aiState.isLoading = false
    abortController = null
    topic.updatedAt = Date.now()
    onScrollRequest()
  }
}

function updateHistoryItem(id: string, updates: any) {
  const topic = aiActions.getCurrentTopic()
  if (!topic)
    return
  const index = topic.history.findIndex(item => item.id === id)
  if (index !== -1) {
    topic.history[index] = { ...topic.history[index], ...updates }
  }
}

export function cancelAiRequest() {
  if (abortController)
    abortController.abort()
}
