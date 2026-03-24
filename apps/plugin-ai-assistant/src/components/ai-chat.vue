<script setup lang="ts">
import { marked } from 'marked'
import { computed, nextTick, ref, watch } from 'vue'
import { cancelAiRequest, sendAiRequest } from '../services/ai.service'
import { aiActions, aiState, MODELS } from '../store/ai.store'

const chatBodyRef = ref<HTMLElement | null>(null)
const showPromptMenu = ref(false)
const showModelMenu = ref(false)

const currentTopic = computed(() => aiActions.getCurrentTopic())
const activePromptName = computed(() => aiState.systemPrompts.find(p => p.id === aiState.selectedPromptId)?.name || 'Неизвестно')

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

watch(() => aiState.isOpen, (isOpen) => {
  if (isOpen && aiState.activeTab === 'chat')
    scrollToBottom()
})
watch(() => aiState.currentTopicId, () => scrollToBottom())

function renderMarkdown(text: string) {
  try { return marked.parse(text) }
  catch { return text }
}

function handleSend() {
  const prompt = aiState.userPrompt.trim()
  if (!prompt)
    return
  aiState.userPrompt = ''
  sendAiRequest(prompt, scrollToBottom)
}

function selectModel(model: string) {
  aiState.selectedModel = model
  showModelMenu.value = false
}

function selectPrompt(id: string) {
  aiState.selectedPromptId = id
  showPromptMenu.value = false
}

function closeMenus() {
  showPromptMenu.value = false
  showModelMenu.value = false
}
</script>

<template>
  <div class="ai-tab-view" @click="closeMenus">
    <div ref="chatBodyRef" class="ai-body">
      <div v-if="!currentTopic || currentTopic.history.length === 0" style="text-align: center; color: var(--fg-muted-color); margin-top: 40px;">
        Новый диалог начат. Напишите первый запрос!
      </div>

      <template v-if="currentTopic">
        <div v-for="item in currentTopic.history" :key="item.id" class="ai-history-item">
          <div class="ai-prompt-bubble">
            {{ item.prompt }}
          </div>
          <div v-if="item.status === 'loading'" class="ai-status loading">
            Генерация ответа...
          </div>
          <div v-else class="ai-response-bubble ai-md-content markdown-body" v-html="renderMarkdown(item.response)" />
          <div class="ai-status" :class="item.status">
            {{ item.status === 'error' ? 'Ошибка' : item.status === 'aborted' ? 'Отменено' : new Date(item.date).toLocaleTimeString() }}
          </div>
        </div>
      </template>
    </div>

    <div class="ai-input-area">
      <div class="ai-input-box">
        <textarea
          v-model="aiState.userPrompt"
          class="ai-textarea custom-scrollbar"
          placeholder="Напишите сообщение..."
          @keydown.ctrl.enter.prevent="handleSend"
        />

        <div class="ai-input-bottom">
          <div class="ai-tools-left">
            <button class="ai-tool-btn shrink-none" title="Очистить чат" @click.stop="aiActions.clearCurrentTopic()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
            <button class="ai-tool-btn shrink-none" title="Новый топик" @click.stop="aiActions.createNewTopic()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            </button>

            <div class="ai-dropdown-wrap">
              <button class="ai-tool-btn" title="Выбор промпта" @click.stop="showPromptMenu = !showPromptMenu; showModelMenu = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <span class="tool-text">{{ activePromptName }}</span>
              </button>
              <div v-if="showPromptMenu" class="ai-dropdown">
                <div class="dropdown-title">
                  Промпт
                </div>
                <div v-for="p in aiState.systemPrompts" :key="p.id" class="dropdown-item" :class="{ 'is-active': p.id === aiState.selectedPromptId }" @click.stop="selectPrompt(p.id)">
                  {{ p.name }}
                </div>
              </div>
            </div>

            <div class="ai-dropdown-wrap">
              <button class="ai-tool-btn" title="Выбор модели" @click.stop="showModelMenu = !showModelMenu; showPromptMenu = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-none"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
                <span class="tool-text">{{ aiState.selectedModel }}</span>
              </button>
              <div v-if="showModelMenu" class="ai-dropdown">
                <div class="dropdown-title">
                  Модель
                </div>
                <div v-for="m in MODELS" :key="m" class="dropdown-item" :class="{ 'is-active': m === aiState.selectedModel }" @click.stop="selectModel(m)">
                  {{ m }}
                </div>
              </div>
            </div>
          </div>

          <div class="ai-tools-right">
            <button v-if="aiState.isLoading" class="ai-send-btn is-stop" title="Отменить" @click.stop="cancelAiRequest">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
            <button v-else class="ai-send-btn" :class="{ 'is-ready': aiState.userPrompt.trim() }" title="Отправить" @click.stop="handleSend">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
