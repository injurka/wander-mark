<script setup lang="ts">
import type { SituationalData } from '../../types'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ data: SituationalData }>()
const expandedIndexes = ref<Set<number>>(new Set())

/** Активный тултип — управляется программно для корректного позиционирования */
const activeTooltip = ref<{ text: string, x: number, y: number, visible: boolean, positioned: boolean }>({
  text: '',
  x: 0,
  y: 0,
  visible: false,
  positioned: false,
})

const boardRef = ref<HTMLElement | null>(null)

function toggle(index: number) {
  if (expandedIndexes.value.has(index))
    expandedIndexes.value.delete(index)
  else expandedIndexes.value.add(index)
}

function renderOriginalWithTooltips(original: string, keywords: any[]) {
  if (!keywords)
    return original
  let result = original
  keywords.forEach((kw) => {
    const tooltipText = kw.transcription ? `[${kw.transcription}] ${kw.explanation}` : kw.explanation
    const safeText = tooltipText.replace(/"/g, '&quot;')
    const tooltipHtml = `<span class="keyword" data-tooltip="${safeText}">${kw.word}</span>`
    result = result.replace(new RegExp(kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tooltipHtml)
  })
  return result
}

/**
 * Программное позиционирование тултипа.
 * Вычисляет координаты относительно viewport и прижимает к краям при необходимости.
 */
function showTooltip(e: Event) {
  const el = e.target as HTMLElement
  if (!el.classList.contains('keyword'))
    return

  const text = el.getAttribute('data-tooltip') || ''
  if (!text)
    return

  const rect = el.getBoundingClientRect()

  activeTooltip.value = {
    text,
    x: rect.left + rect.width / 2,
    y: rect.top,
    visible: true,
    positioned: false,
  }

  // После рендера — вычислить финальные координаты
  nextTick(() => {
    const tip = document.getElementById('kw-tooltip')
    if (!tip)
      return

    const tipRect = tip.getBoundingClientRect()
    const pad = 8

    // Горизонтальная коррекция
    let left = activeTooltip.value.x - tipRect.width / 2
    if (left < pad)
      left = pad
    if (left + tipRect.width > window.innerWidth - pad)
      left = window.innerWidth - pad - tipRect.width

    // Вертикальная: если не помещается сверху — показать снизу
    let top = activeTooltip.value.y - tipRect.height - 8
    if (top < pad) {
      top = rect.bottom + 8
    }

    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
    activeTooltip.value.positioned = true
  })
}

function hideTooltip(e: Event) {
  const el = e.target as HTMLElement
  if (el.classList.contains('keyword')) {
    activeTooltip.value.visible = false
  }
}

/** Touch-устройства: toggle по тапу */
function handleTouch(e: Event) {
  const el = e.target as HTMLElement
  if (!el.classList.contains('keyword'))
    return

  e.preventDefault()

  if (activeTooltip.value.visible && activeTooltip.value.text === (el.getAttribute('data-tooltip') || '')) {
    activeTooltip.value.visible = false
  }
  else {
    showTooltip(e)
  }
}

/** Закрытие тултипа по клику вне keyword */
function handleGlobalClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.keyword') && !el.closest('#kw-tooltip')) {
    activeTooltip.value.visible = false
  }
}

onMounted(() => document.addEventListener('click', handleGlobalClick))
onBeforeUnmount(() => document.removeEventListener('click', handleGlobalClick))
</script>

<template>
  <div ref="boardRef" class="chat-board">
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
            @mouseenter.capture="showTooltip"
            @mouseleave.capture="hideTooltip"
            @touchstart.capture="handleTouch"
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
          <!-- Открытый глаз -->
          <svg v-if="expandedIndexes.has(i)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <!-- Закрытый глаз -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
            <path d="m2 2 20 20" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Глобальный тултип, рендерится в fixed-позиции -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="activeTooltip.visible"
          id="kw-tooltip"
          class="kw-tooltip"
          :style="{
            left: activeTooltip.positioned ? undefined : `${activeTooltip.x}px`,
            top: activeTooltip.positioned ? undefined : `${activeTooltip.y}px`,
            opacity: activeTooltip.positioned ? 1 : 0,
          }"
        >
          {{ activeTooltip.text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.chat-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100% - 60px);
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

/* ── Eye Button (SVG вместо emoji) ── */
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
  margin-top: 8px;
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
  border-bottom: 1px dashed var(--fg-accent-color);
  cursor: help;
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

<!-- Глобальные стили для тултипа (он рендерится через Teleport в body) -->
<style>
.kw-tooltip {
  position: fixed;
  background: var(--bg-inverted-color, #1a1a2e);
  color: var(--fg-inverted-color, #fff);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  max-width: min(360px, calc(100vw - 16px));
  width: max-content;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  word-wrap: break-word;
  white-space: normal;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
