<script setup lang="ts">
import type { SituationalData } from '../types'
import { ref } from 'vue'

defineProps<{ data: SituationalData }>()
const expandedIndexes = ref<Set<number>>(new Set())

function toggle(index: number) {
  if (expandedIndexes.value.has(index)) {
    expandedIndexes.value.delete(index)
  }
  else {
    expandedIndexes.value.add(index)
  }
}

function renderOriginalWithTooltips(original: string, keywords: any[]) {
  let result = original
  keywords.forEach((kw) => {
    const tooltipHtml = `<span class="keyword" data-tooltip="${kw.explanation}">${kw.word}</span>`
    result = result.replace(new RegExp(kw.word, 'g'), tooltipHtml)
  })
  return result
}
</script>

<template>
  <div class="chat-board">
    <div
      v-for="(msg, i) in data.messages" :key="i"
      class="msg-wrapper" :class="{ 'is-user': i % 2 !== 0 }"
    >
      <div class="speaker">
        {{ msg.speaker }}
      </div>
      <div class="msg-bubble" @click="toggle(i)">
        <div class="original" v-html="renderOriginalWithTooltips(msg.original, msg.keywords)" />

        <Transition name="slide">
          <div v-if="expandedIndexes.has(i)" class="msg-details">
            <div class="pinyin">
              {{ msg.pinyin }}
            </div>
            <div class="translation">
              {{ msg.translation }}
            </div>
            <div class="literal">
              <em>{{ msg.literal }}</em>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100% - 60px);
  font-family:
    'Inter',
    'Maple Mono CN',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
.msg-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 100%;
}
.msg-wrapper.is-user {
  align-self: flex-end;
  align-items: flex-end;
}
.speaker {
  font-size: 0.85em;
  color: var(--fg-secondary-color);
  margin-bottom: 4px;
  padding: 0 4px;
}
.msg-bubble {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  padding: 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--border-secondary-color);
  transition: border-color 0.2s;
}
.msg-wrapper.is-user .msg-bubble {
  background: var(--bg-accent-overlay-color);
  border-color: var(--border-accent-color);
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}
.msg-bubble:hover {
  border-color: var(--border-focus-color);
}

:deep(.keyword) {
  border-bottom: 1px dashed var(--fg-accent-color);
  position: relative;
  cursor: help;
}
:deep(.keyword:hover::after) {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-inverted-color);
  color: var(--fg-inverted-color);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  margin-bottom: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  margin-top: 0;
}
.msg-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-secondary-color);
  max-height: 200px;
}
.pinyin {
  color: var(--fg-accent-color);
  font-family: 'Maple Mono CN', monospace;
  margin-bottom: 4px;
}
.translation {
  color: var(--fg-primary-color);
}
.literal {
  color: var(--fg-muted-color);
  font-size: 0.9em;
  margin-top: 4px;
}
.original {
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .msg-wrapper {
    max-width: 95%;
  }
}
</style>
