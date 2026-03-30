<script setup lang="ts">
import { usePluginI18n } from '../i18n'
import { trackerState } from '../store/tracker.store'

const { t } = usePluginI18n()

function openReports() {
  if (trackerState.router && trackerState.vaultId) {
    trackerState.router.push(`/${trackerState.vaultId}/plugin/reading-tracker`)
  }
}
</script>

<template>
  <button class="rt-sidebar-widget" @click="openReports">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4" /></svg>
    <span>{{ t('widget.title') }}</span>
  </button>
</template>

<style scoped>
.rt-sidebar-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-top: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.rt-sidebar-widget:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}
</style>
