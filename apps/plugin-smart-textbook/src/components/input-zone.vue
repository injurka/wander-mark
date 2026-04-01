<script setup lang="ts">
import { ref } from 'vue'
import { usePluginI18n } from '../i18n'
import { getRandomPrompt } from '../prompts/index'
import { generateContent } from '../services/ai.service'
import { tbState } from '../store/textbook.store'
import TopicSelect from './topic-select.vue'

const { t } = usePluginI18n()

const textareaEl = ref<HTMLTextAreaElement | null>(null)

function focusTextarea() {
  textareaEl.value?.focus()
}

function generateRandom() {
  const topic = tbState.activeTopic
  tbState.currentInput = getRandomPrompt(topic)
  focusTextarea()
}

async function handleGenerate() {
  if (!tbState.currentInput.trim() || tbState.isLoading)
    return

  const genPromise = generateContent()

  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    tbState.isSidebarOpen = false
  }

  await genPromise
}
</script>

<template>
  <div class="input-zone">
    <TopicSelect @selected="focusTextarea" />

    <textarea
      ref="textareaEl"
      v-model="tbState.currentInput"
      class="tb-textarea"
      :placeholder="t('tb.placeholder')"
      @keydown.ctrl.enter.prevent="handleGenerate"
    />

    <div class="actions-row">
      <!-- Кнопка случайного промпта -->
      <button
        class="icon-btn random-btn"
        :title="t('tb.randomPrompt')"
        :disabled="tbState.isLoading"
        @click="generateRandom"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
        </svg>
      </button>

      <button
        class="tb-btn main-btn"
        :class="{ 'is-loading': tbState.isLoading }"
        :disabled="tbState.isLoading || !tbState.currentInput.trim()"
        @click="handleGenerate"
      >
        {{ tbState.isLoading ? t('tb.loading') : t('tb.generate') }}
      </button>

      <!-- Настройки (только на мобилке) -->
      <button class="icon-btn mobile-only" :title="t('settings.title')" @click="tbState.isSettingsOpen = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
      </button>

      <button class="icon-btn mobile-only" :title="t('tb.hide')" @click="tbState.isSidebarOpen = false">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="9" y1="3" y2="21" /><path d="m16 15-3-3 3-3" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tb-textarea {
  resize: vertical;
  min-height: 120px;
  padding: 12px;
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  font-family: inherit;
  outline: none;
}
.tb-textarea:focus {
  border-color: var(--border-focus-color);
}
.actions-row {
  display: flex;
  gap: 8px;
}
.main-btn {
  flex: 1;
}
.tb-btn {
  padding: 14px;
  background: var(--bg-action-hover-color);
  color: var(--fg-inverted-color);
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.tb-btn:disabled {
  background: var(--bg-disabled-color);
  color: var(--fg-disabled-color);
  cursor: not-allowed;
}
.tb-btn:not(:disabled):hover {
  opacity: 0.9;
}

/* Кнопка случайного промпта */
.random-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  flex-shrink: 0;
  background: var(--bg-tertiary-color);
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.random-btn:hover:not(:disabled) {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-focus-color);
  transform: rotate(90deg);
}
.random-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn.mobile-only {
  display: none;
  align-items: center;
  justify-content: center;
  width: 48px;
  background: var(--bg-tertiary-color);
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn.mobile-only:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-focus-color);
}

@media (max-width: 768px) {
  .icon-btn.mobile-only {
    display: flex;
  }
}
</style>
