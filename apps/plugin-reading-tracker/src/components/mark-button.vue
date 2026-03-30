<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePluginI18n } from '../i18n'
import { trackerActions, trackerState } from '../store/tracker.store'

const { t } = usePluginI18n()

const currentPath = computed(() => {
  if (!trackerState.router)
    return null
  const route = trackerState.router.currentRoute.value || trackerState.router.currentRoute
  const pwd = route?.params?.pwd
  if (!pwd)
    return null
  return Array.isArray(pwd) ? pwd.join('/') : pwd
})

const currentLog = computed(() => {
  if (!currentPath.value)
    return null
  return trackerActions.getLogByPath(currentPath.value)
})

const recentlyMarked = ref(false)
let markTimeout: ReturnType<typeof setTimeout> | null = null

function handleMark() {
  if (!currentPath.value)
    return
  const title = currentPath.value.split('/').pop() || currentPath.value

  trackerActions.markAsRead(currentPath.value, title)

  recentlyMarked.value = true
  if (markTimeout)
    clearTimeout(markTimeout)

  markTimeout = setTimeout(() => {
    recentlyMarked.value = false
  }, 2000)
}
</script>

<template>
  <div v-if="currentPath" class="rt-mark-wrapper">
    <div class="rt-action-area">
      <div v-if="currentLog" class="rt-info">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-icon-success">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{{ t('mark.readTimes') }}: <strong>{{ currentLog.readDates.length }}</strong></span>
      </div>
      <p v-else class="rt-info-empty">
        {{ t('mark.notRead') }}
      </p>

      <button class="rt-btn" :class="{ 'rt-btn-success': recentlyMarked }" @click="handleMark">
        {{ recentlyMarked ? t('mark.markedNow') : t('mark.button') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.rt-mark-wrapper {
  margin-top: 16px;
  min-height: 86px;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border-secondary-color);
  padding: 0 16px;
}
.rt-action-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.rt-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
}
.rt-info-empty {
  color: var(--fg-muted-color);
  font-size: 0.9rem;
  margin: 0;
}
.rt-icon-success {
  color: var(--fg-success-color, #3fb950);
}
.rt-btn {
  background-color: transparent;
  border: 1px solid var(--border-primary-color);
  color: var(--fg-primary-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  user-select: none;
}
.rt-btn:hover {
  border-color: var(--fg-accent-color);
  color: var(--fg-accent-color);
}
.rt-btn:active {
  transform: scale(0.97);
}
.rt-btn-success {
  background-color: var(--bg-success-color, rgba(46, 160, 67, 0.1));
  border-color: var(--border-success-color, #2ea043);
  color: var(--fg-success-color, #3fb950);
}
</style>
