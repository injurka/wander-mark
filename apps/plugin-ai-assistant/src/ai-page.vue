<script setup lang="ts">
import { onMounted } from 'vue'
import AiChat from './components/ai-chat.vue'
import AiSettings from './components/ai-settings.vue'
import AiTopics from './components/ai-topics.vue'
import { aiState, initAiStore } from './store/ai.store'

onMounted(() => {
  initAiStore()
  if (!aiState.activeTab) {
    aiState.activeTab = 'chat'
  }
})
</script>

<template>
  <div class="ai-page">
    <div class="ai-page-header">
      <h2>AI Assistant</h2>
      <div class="ai-page-header-actions">
        <button class="ai-page-btn" :class="{ 'is-active': aiState.activeTab === 'chat' }" title="Чат" @click="aiState.activeTab = 'chat'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <span class="btn-text">Чат</span>
        </button>
        <button class="ai-page-btn" :class="{ 'is-active': aiState.activeTab === 'topics' }" title="Топики" @click="aiState.activeTab = 'topics'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          <span class="btn-text">Топики</span>
        </button>
        <button class="ai-page-btn" :class="{ 'is-active': aiState.activeTab === 'settings' }" title="Настройки" @click="aiState.activeTab = 'settings'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span class="btn-text">Настройки</span>
        </button>
      </div>
    </div>
    <div class="ai-page-chat-wrapper">
      <AiChat v-show="aiState.activeTab === 'chat'" />
      <AiTopics v-if="aiState.activeTab === 'topics'" />
      <AiSettings v-if="aiState.activeTab === 'settings'" />
    </div>
  </div>
</template>
