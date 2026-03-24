<script setup lang="ts">
import { onMounted } from 'vue'
import AiChat from './components/ai-chat.vue'
import { aiState, initAiStore } from './store/ai.store'

onMounted(() => {
  initAiStore()
  aiState.activeTab = 'chat'
})
</script>

<template>
  <div class="ai-page">
    <div class="ai-page-header">
      <h2>AI Assistant Chat</h2>
      <p>Полноэкранный режим чата с ИИ.</p>
    </div>
    <div class="ai-page-chat-wrapper">
      <AiChat />
    </div>
  </div>
</template>
