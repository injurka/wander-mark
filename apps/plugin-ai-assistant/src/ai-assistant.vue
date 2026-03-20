<script setup lang="ts">
import { onMounted } from 'vue'
import AiChat from './components/ai-chat.vue'
import AiSettings from './components/ai-settings.vue'
import AiTopics from './components/ai-topics.vue'
import { aiActions, aiState, initAiStore } from './store/ai.store'

defineOptions({ name: 'AiAssistantWidget', inheritAttrs: false })

onMounted(() => initAiStore())
</script>

<template>
  <button v-bind="$attrs" type="button" class="ai-trigger" title="AI Assistant" @click.stop.prevent="aiActions.toggle()">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
    <div v-if="aiState.isLoading && !aiState.isOpen" class="ai-indicator" />
  </button>

  <Teleport to="body">
    <div v-if="aiState.isMinimized" class="ai-minimized-widget" @click.stop="aiActions.open()">
      <div v-if="aiState.isLoading" class="ai-indicator" style="position: static;" />
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /></svg>
      <span>{{ aiState.isLoading ? 'AI думает...' : 'AI Assistant' }}</span>
    </div>

    <Transition name="ai-fade">
      <div v-if="aiState.isOpen" class="ai-backdrop" @mousedown.self="aiActions.close()">
        <div class="ai-modal">
          <div class="ai-header">
            <div class="ai-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /></svg>
              AI Assistant
            </div>
            <div class="ai-header-actions">
              <button class="ai-icon-btn" title="Свернуть в фон" type="button" @click.stop="aiActions.minimize()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
              </button>
              <button class="ai-icon-btn" title="Закрыть" type="button" @click.stop="aiActions.close()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          <div class="ai-tabs">
            <button class="ai-tab" :class="{ 'is-active': aiState.activeTab === 'chat' }" @click="aiState.activeTab = 'chat'">
              Чат
            </button>
            <button class="ai-tab" :class="{ 'is-active': aiState.activeTab === 'topics' }" @click="aiState.activeTab = 'topics'">
              Топики
            </button>
            <button class="ai-tab" :class="{ 'is-active': aiState.activeTab === 'settings' }" @click="aiState.activeTab = 'settings'">
              Настройки
            </button>
          </div>

          <div class="ai-tabs-content">
            <AiChat v-show="aiState.activeTab === 'chat'" />
            <AiTopics v-if="aiState.activeTab === 'topics'" />
            <AiSettings v-if="aiState.activeTab === 'settings'" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
