<!-- eslint-disable e18e/prefer-static-regex -->
<script setup lang="ts">
import type { SituationalData } from '../../../types'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import UiTooltip from '../../ui-kit/ui-tooltip.vue'

defineProps<{ data: SituationalData }>()
const expandedIndexes = ref<Set<number>>(new Set())

const activeTooltip = ref<{ text: string, visible: boolean, target: HTMLElement | null }>({
  text: '',
  visible: false,
  target: null,
})

function toggle(index: number) {
  if (expandedIndexes.value.has(index))
    expandedIndexes.value.delete(index)
  else expandedIndexes.value.add(index)
}

function renderOriginalWithTooltips(original: string, keywords: any[]) {
  if (!keywords || !keywords.length)
    return original

  const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length)

  let result = original
  sortedKeywords.forEach((kw) => {
    if (!kw.word)
      return

    const safePinyin = kw.transcription ? kw.transcription.replace(/"/g, '&quot;') : ''
    const safeText = kw.explanation ? kw.explanation.replace(/"/g, '&quot;') : ''

    const tooltipHtml = `<span class="keyword" data-pinyin="${safePinyin}" data-explanation="${safeText}">${kw.word}</span>`

    const parts = result.split(/(<[^>]+>)/g)
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('<')) {
        parts[i] = parts[i].replace(new RegExp(kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tooltipHtml)
      }
    }
    result = parts.join('')
  })

  return result
}

function buildTooltipHtml(el: HTMLElement): string {
  const pinyin = el.getAttribute('data-pinyin') || ''
  const explanation = el.getAttribute('data-explanation') || ''

  if (!pinyin && !explanation)
    return ''

  let htmlText = ''
  if (pinyin) {
    htmlText += `<span style="color:var(--fg-accent-color);font-family:monospace;font-size:0.95em;font-weight:600;">[${pinyin}]</span><br/>`
  }
  htmlText += explanation

  return htmlText
}

function handleMouseOver(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el || !el.classList.contains('keyword'))
    return

  const htmlText = buildTooltipHtml(el)
  if (!htmlText)
    return

  activeTooltip.value = {
    text: htmlText,
    visible: true,
    target: el,
  }
}

function handleMouseOut(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (el && el.classList.contains('keyword')) {
    activeTooltip.value.visible = false
    activeTooltip.value.target = null
  }
}

function handleTouch(e: Event) {
  const el = e.target as HTMLElement
  if (!el || !el.classList.contains('keyword'))
    return

  e.preventDefault()

  if (activeTooltip.value.visible && activeTooltip.value.target === el) {
    activeTooltip.value.visible = false
    activeTooltip.value.target = null
  }
  else {
    const htmlText = buildTooltipHtml(el)
    if (!htmlText)
      return

    activeTooltip.value = {
      text: htmlText,
      visible: true,
      target: el,
    }
  }
}

function handleGlobalClick(e: MouseEvent | TouchEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.keyword')) {
    activeTooltip.value.visible = false
    activeTooltip.value.target = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('touchstart', handleGlobalClick, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('touchstart', handleGlobalClick)
})
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

      <div class="msg-row">
        <div class="msg-bubble">
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="original"
            @mouseover="handleMouseOver"
            @mouseout="handleMouseOut"
            @touchstart="handleTouch"
            v-html="renderOriginalWithTooltips(msg.original, msg.keywords)"
          />
          <!-- eslint-enable vue/no-v-html -->

          <Transition name="slide">
            <div v-if="expandedIndexes.has(i)" class="msg-details">
              <div v-if="msg.transcription" class="transcription">
                {{ msg.transcription }}
              </div>
              <div class="translation">
                {{ msg.translation }}
              </div>
              <div v-if="msg.literal_translation" class="literal">
                <em>{{ msg.literal_translation }}</em>
              </div>
            </div>
          </Transition>
        </div>

        <button class="eye-btn" :class="{ active: expandedIndexes.has(i) }" title="Подробности" @click="toggle(i)">
          <svg v-if="expandedIndexes.has(i)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
            <path d="m2 2 20 20" />
          </svg>
        </button>
      </div>
    </div>

    <UiTooltip
      :visible="activeTooltip.visible"
      :text="activeTooltip.text"
      :target="activeTooltip.target"
    />
  </div>
</template>

<style scoped>
.chat-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
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
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.msg-wrapper.is-user .msg-row {
  flex-direction: row-reverse;
}

.eye-btn {
  background: var(--bg-tertiary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--fg-muted-color);
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 14px;
  padding: 0;
}
.eye-btn:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-focus-color);
}
.eye-btn.active {
  color: var(--fg-accent-color);
  border-color: var(--border-accent-color);
  background: var(--bg-accent-color);
}

.msg-bubble {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  padding: 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border-secondary-color);
}
.msg-wrapper.is-user .msg-bubble {
  background: var(--bg-accent-overlay-color);
  border-color: var(--border-accent-color);
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}

:deep(.keyword) {
  border-bottom: 2px dotted var(--fg-accent-color);
  cursor: help;
  transition:
    background-color 0.2s,
    color 0.2s;
  border-radius: 4px;
  padding: 0 2px;
  margin: 0 -2px;
}

:deep(.keyword:hover) {
  background-color: var(--bg-accent-overlay-color, rgba(128, 128, 128, 0.15));
  color: var(--fg-accent-color);
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
  max-height: 300px;
}
.transcription {
  color: var(--fg-accent-color);
  font-family: monospace;
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
  font-family: var(--lang-font, inherit);
}

@media (max-width: 768px) {
  .msg-wrapper {
    max-width: 95%;
  }
}
</style>
