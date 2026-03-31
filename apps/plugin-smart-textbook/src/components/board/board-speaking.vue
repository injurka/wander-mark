<script setup lang="ts">
import type { SpeakingData } from '../../types'
import { ref } from 'vue'
import { usePluginI18n } from '../../i18n'

defineProps<{ data: SpeakingData }>()
const { t } = usePluginI18n()
const activeTab = ref<'grammatical' | 'colloquial' | 'formal'>('colloquial')
const showReplies = ref(false)
</script>

<template>
  <div class="speaking-board">
    <div class="user-input-box">
      <span class="label">Твой ввод:</span>
      <p class="original-text">
        {{ data.original }}
      </p>
    </div>

    <div class="tabs-container">
      <div class="tabs-header">
        <button class="tab-btn" :class="{ active: activeTab === 'grammatical' }" @click="activeTab = 'grammatical'">
          {{ t('board.grammatical') }}
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'colloquial' }" @click="activeTab = 'colloquial'">
          {{ t('board.colloquial') }} ⚡
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'formal' }" @click="activeTab = 'formal'">
          {{ t('board.formal') }} 👔
        </button>
      </div>

      <div class="tab-content">
        <p class="translated-text">
          {{ typeof data[activeTab] === 'string' ? data[activeTab] : data[activeTab].text }}
        </p>
        <p v-if="typeof data[activeTab] !== 'string' && data[activeTab].transcription" class="transcription-text">
          {{ data[activeTab].transcription }}
        </p>
      </div>
    </div>

    <div class="replies-accordion">
      <button class="accordion-header" @click="showReplies = !showReplies">
        {{ t('board.possibleReplies') }}
        <span class="icon" :class="{ rotated: showReplies }">▼</span>
      </button>
      <Transition name="slide">
        <div v-if="showReplies" class="accordion-body">
          <ul class="reply-list">
            <li v-for="(reply, idx) in data.possible_replies" :key="idx">
              <div class="reply-text">
                {{ typeof reply === 'string' ? reply : reply.text }}
              </div>
              <div v-if="typeof reply !== 'string' && reply.transcription" class="reply-transcription">
                {{ reply.transcription }}
              </div>
            </li>
          </ul>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.speaking-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.user-input-box {
  background: var(--bg-secondary-color);
  padding: 16px 24px;
  border-radius: 12px;
  border-left: 4px solid var(--border-primary-color);
}
.label {
  font-size: 12px;
  color: var(--fg-secondary-color);
  text-transform: uppercase;
}
.original-text {
  font-size: 1.2em;
  margin-top: 8px;
  color: var(--fg-primary-color);
}

.tabs-container {
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-tertiary-color);
}
.tabs-header {
  display: flex;
  background: var(--bg-secondary-color);
  border-bottom: 1px solid var(--border-secondary-color);
}
.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--fg-secondary-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: var(--bg-hover-color);
}
.tab-btn.active {
  background: var(--bg-tertiary-color);
  color: var(--fg-accent-color);
  border-bottom: 2px solid var(--border-accent-color);
}
.tab-content {
  padding: 32px;
  text-align: center;
}
.translated-text {
  font-size: 2em;
  font-family: 'Maple Mono CN', sans-serif;
  color: var(--fg-primary-color);
}
.transcription-text {
  color: var(--fg-accent-color);
  font-family: monospace;
  font-size: 1.2em;
  margin-top: 8px;
}

.replies-accordion {
  background: var(--bg-secondary-color);
  border-radius: 12px;
  overflow: hidden;
}
.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: transparent;
  border: none;
  color: var(--fg-primary-color);
  font-weight: bold;
  cursor: pointer;
}
.accordion-header:hover {
  background: var(--bg-hover-color);
}
.icon {
  transition: transform 0.3s;
}
.icon.rotated {
  transform: rotate(180deg);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.accordion-body {
  padding: 0 24px 24px 24px;
  max-height: 500px;
  overflow-y: auto;
}
.reply-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reply-list li {
  background: var(--bg-primary-color);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary-color);
}
.reply-text {
  color: var(--fg-primary-color);
  font-size: 1.1em;
  font-family: var(--lang-font, inherit);
}
.reply-transcription {
  color: var(--fg-accent-color);
  font-family: monospace;
  font-size: 0.9em;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .tabs-header {
    flex-direction: column;
  }
  .tab-btn {
    padding: 12px;
    border-bottom: 1px solid var(--border-secondary-color);
  }
  .tab-btn.active {
    border-bottom: 2px solid var(--border-accent-color);
  }
  .translated-text {
    font-size: 1.5em;
  }
  .tab-content {
    padding: 24px 16px;
  }
}
</style>
