<script setup lang="ts">
import { state } from '../store/hanzi-saver.store'
import ManualInputModal from './manual-input-modal.vue'

function openModal() {
  state.manualInputTarget = ''
  state.isManualInputOpen = true
}
</script>

<template>
  <button class="hz-toolbar-btn" title="Добавить иероглиф/фразу" @click="openModal">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M2 15h10" />
      <path d="M7 10v10" />
    </svg>
  </button>

  <ManualInputModal v-if="state.isManualInputOpen" @close="state.isManualInputOpen = false" />
</template>

<style scoped>
.hz-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--fg-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}
.hz-toolbar-btn:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}
</style>
