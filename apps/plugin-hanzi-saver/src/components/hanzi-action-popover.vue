<script setup lang="ts">
import { closePopover, state } from '../store/hanzi-saver.store'

function copy() {
  navigator.clipboard.writeText(state.popover.text)
  state.ctx?.showToast?.('Иероглиф скопирован!', { type: 'success' })
  closePopover()
}

function speak() {
  if (!('speechSynthesis' in window))
    return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(state.popover.text)
  utterance.lang = 'zh-CN'
  window.speechSynthesis.speak(utterance)
  closePopover()
}
</script>

<template>
  <Teleport v-if="state.popover.visible" to="body">
    <div class="hz-popover-overlay" @click.stop="closePopover" @contextmenu.prevent="closePopover">
      <div class="hz-popover" :style="{ left: `${state.popover.x}px`, top: `${state.popover.y}px` }" @click.stop>
        <button class="hz-pop-btn" @click="copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Скопировать
        </button>

        <button class="hz-pop-btn" @click="speak">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Озвучить
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hz-popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999999;
}

.hz-popover {
  position: absolute;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 2px;
  min-width: 140px;
  transform: translate(-10px, 10px);
}

.hz-pop-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--fg-primary-color);
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  transition:
    background 0.2s,
    color 0.2s;
  text-align: left;
}

.hz-pop-btn:hover {
  background: rgba(var(--fg-accent-color-rgb), 0.1);
  color: var(--fg-accent-color);
}
</style>
