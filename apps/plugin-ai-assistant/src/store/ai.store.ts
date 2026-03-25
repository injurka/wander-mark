import type { AiSystemPrompt, AiTopic, PluginContext } from '../types'
import { reactive, watch } from 'vue'

export const MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gpt-5.4-nano',
  'qwen3.5-397b-a17b',
]

export const aiState = reactive({
  isOpen: false,
  isMinimized: false,
  isFullscreen: false,
  activeTab: 'chat' as 'chat' | 'settings' | 'topics',
  apiKey: '',
  isLoading: false,
  isInitialized: false,
  userPrompt: '',

  topics: [] as AiTopic[],
  currentTopicId: null as string | null,

  systemPrompts: [] as AiSystemPrompt[],
  selectedPromptId: 'default',
  selectedModel: MODELS[0],

  router: null as any,
  vaultId: '',
  vaultUrl: '',
  showToast: null as any,
  confirm: null as any,
})

export const aiActions = {
  setContext(ctx: PluginContext) {
    aiState.router = ctx.router
    aiState.vaultId = ctx.vaultId
    aiState.vaultUrl = ctx.vaultUrl
    aiState.showToast = ctx.showToast
    aiState.confirm = ctx.confirm
  },

  open() {
    aiState.isOpen = true
    aiState.isMinimized = false
  },
  close() {
    aiState.isOpen = false
    aiState.isMinimized = false
  },
  minimize() {
    aiState.isMinimized = true
    aiState.isOpen = false
  },
  toggle() {
    aiState.isOpen ? this.close() : this.open()
  },
  toggleFullscreen() {
    aiState.isFullscreen = !aiState.isFullscreen
  },

  createNewTopic() {
    const newTopic: AiTopic = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      title: 'Новый чат',
      history: [],
      updatedAt: Date.now(),
    }
    aiState.topics.unshift(newTopic)
    aiState.currentTopicId = newTopic.id
    aiState.activeTab = 'chat'
  },
  selectTopic(id: string) {
    aiState.currentTopicId = id
    aiState.activeTab = 'chat'
  },
  deleteTopic(id: string) {
    aiState.topics = aiState.topics.filter(t => t.id !== id)
    if (aiState.currentTopicId === id) {
      aiState.currentTopicId = aiState.topics.length > 0 ? aiState.topics[0].id : null
    }
  },
  clearCurrentTopic() {
    const topic = this.getCurrentTopic()
    // eslint-disable-next-line no-alert
    if (topic && confirm('Очистить текущий чат?')) {
      topic.history = []
      topic.updatedAt = Date.now()
    }
  },
  getCurrentTopic(): AiTopic | undefined {
    return aiState.topics.find(t => t.id === aiState.currentTopicId)
  },

  addPrompt(name: string, content: string) {
    // Делаем ID гарантированно уникальным даже при цикле
    const uniqueId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
    aiState.systemPrompts.push({ id: uniqueId, name, content })
  },
  updatePrompt(id: string, name: string, content: string) {
    const p = aiState.systemPrompts.find(p => p.id === id)
    if (p) { p.name = name; p.content = content }
  },
  deletePrompt(id: string) {
    if (id === 'default')
      return
    aiState.systemPrompts = aiState.systemPrompts.filter(p => p.id !== id)
    if (aiState.selectedPromptId === id)
      aiState.selectedPromptId = 'default'
  },
}

export function initAiStore() {
  if (aiState.isInitialized)
    return

  aiState.apiKey = localStorage.getItem('wm-ai-apikey') || ''
  aiState.selectedModel = localStorage.getItem('wm-ai-model') || MODELS[0]

  const savedPrompts = localStorage.getItem('wm-ai-prompts')
  if (savedPrompts) {
    const parsed = JSON.parse(savedPrompts)
    const seenIds = new Set()

    // Дедупликация ID: чинит уже сломанные из локал стораджа промпты
    parsed.forEach((p: any) => {
      if (seenIds.has(p.id)) {
        p.id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
      }
      seenIds.add(p.id)
    })
    aiState.systemPrompts = parsed
  }
  else {
    const oldPrompt = localStorage.getItem('wm-ai-sysprompt')
    aiState.systemPrompts = [{
      id: 'default',
      name: 'Стандартный',
      content: oldPrompt || 'Ты полезный AI-ассистент. Отвечай кратко и по делу. Форматируй код и текст в Markdown.',
    }]
  }
  aiState.selectedPromptId = localStorage.getItem('wm-ai-selected-prompt') || aiState.systemPrompts[0].id

  const savedTopics = localStorage.getItem('wm-ai-topics')
  if (savedTopics) {
    aiState.topics = JSON.parse(savedTopics)
  }
  else {
    const oldHistory = localStorage.getItem('wm-ai-history')
    if (oldHistory) {
      aiState.topics = [{
        id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
        title: 'Старый чат',
        history: JSON.parse(oldHistory),
        updatedAt: Date.now(),
      }]
    }
  }

  const lastTopicId = localStorage.getItem('wm-ai-current-topic')
  if (lastTopicId && aiState.topics.some(t => t.id === lastTopicId)) {
    aiState.currentTopicId = lastTopicId
  }
  else if (aiState.topics.length > 0) {
    aiState.currentTopicId = aiState.topics[0].id
  }

  aiState.isInitialized = true

  watch(() => aiState.apiKey, val => localStorage.setItem('wm-ai-apikey', val))
  watch(() => aiState.selectedModel, val => localStorage.setItem('wm-ai-model', val))
  watch(() => aiState.selectedPromptId, val => localStorage.setItem('wm-ai-selected-prompt', val))
  watch(() => aiState.systemPrompts, val => localStorage.setItem('wm-ai-prompts', JSON.stringify(val)), { deep: true })
  watch(() => aiState.topics, val => localStorage.setItem('wm-ai-topics', JSON.stringify(val)), { deep: true })
  watch(() => aiState.currentTopicId, (val) => {
    if (val)
      localStorage.setItem('wm-ai-current-topic', val)
  })
}
