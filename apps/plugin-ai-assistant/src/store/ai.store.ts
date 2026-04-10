import type { AiSystemPrompt, AiTopic, PluginContext } from '../types'
import { get, set } from 'idb-keyval'
import { reactive, watch } from 'vue'
import { usePluginI18n } from '../i18n'

export const MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
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
  getFileContent: null as any,
})

export const aiActions = {
  setContext(ctx: PluginContext) {
    aiState.router = ctx.router
    aiState.vaultId = ctx.vaultId
    aiState.vaultUrl = ctx.vaultUrl
    aiState.showToast = ctx.showToast
    aiState.confirm = ctx.confirm
    aiState.getFileContent = ctx.getFileContent
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
    const { t } = usePluginI18n()
    const newTopic: AiTopic = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      title: t('store.newChat'),
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
  async clearCurrentTopic() {
    const { t } = usePluginI18n()
    const topic = this.getCurrentTopic()

    let confirmed = false
    if (aiState.confirm) {
      confirmed = await aiState.confirm(t('chat.clearConfirm'))
    }
    else {
      // eslint-disable-next-line no-alert
      confirmed = confirm(t('chat.clearConfirm'))
    }

    if (topic && confirmed) {
      topic.history = []
      topic.updatedAt = Date.now()
    }
  },
  getCurrentTopic(): AiTopic | undefined {
    return aiState.topics.find(t => t.id === aiState.currentTopicId)
  },

  addPrompt(name: string, content: string) {
    const uniqueId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
    aiState.systemPrompts.push({ id: uniqueId, name, content })
  },
  updatePrompt(id: string, name: string, content: string) {
    const p = aiState.systemPrompts.find(p => p.id === id)
    if (p) {
      p.name = name
      p.content = content
    }
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

  const { t } = usePluginI18n()

  aiState.apiKey = localStorage.getItem('wm-ai-apikey') || ''
  aiState.selectedModel = localStorage.getItem('wm-ai-model') || MODELS[0]

  const savedPrompts = localStorage.getItem('wm-ai-prompts')
  if (savedPrompts) {
    const parsed = JSON.parse(savedPrompts)
    const seenIds = new Set()

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
      name: t('store.defaultPromptName'),
      content: oldPrompt || t('store.defaultPromptContent'),
    }]
  }
  aiState.selectedPromptId = localStorage.getItem('wm-ai-selected-prompt') || aiState.systemPrompts[0].id

  get('wm-ai-topics').then((savedTopics) => {
    if (savedTopics && Array.isArray(savedTopics)) {
      aiState.topics = savedTopics
    }
    else {
      const oldHistory = localStorage.getItem('wm-ai-history')
      if (oldHistory) {
        aiState.topics = [{
          id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
          title: t('store.oldChat'),
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
  })

  aiState.isInitialized = true

  watch(() => aiState.apiKey, val => localStorage.setItem('wm-ai-apikey', val))
  watch(() => aiState.selectedModel, val => localStorage.setItem('wm-ai-model', val))
  watch(() => aiState.selectedPromptId, val => localStorage.setItem('wm-ai-selected-prompt', val))
  watch(() => aiState.systemPrompts, val => localStorage.setItem('wm-ai-prompts', JSON.stringify(val)), {
    deep: true,
  })
  watch(() => aiState.topics, (val) => {
    set('wm-ai-topics', JSON.parse(JSON.stringify(val)))
  }, {
    deep: true,
  })
  watch(() => aiState.currentTopicId, (val) => {
    if (val)
      localStorage.setItem('wm-ai-current-topic', val)
  })
}
