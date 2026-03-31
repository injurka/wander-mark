<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import BoardBuilder from '../components/board-builder.vue'
import BoardReview from '../components/board-review.vue'
import BoardSituational from '../components/board-situational.vue'
import BoardSpeaking from '../components/board-speaking.vue'
import BoardTranslation from '../components/board-translation.vue'
import InputZone from '../components/input-zone.vue'
import Settings from '../components/settings.vue'
import { usePluginI18n } from '../i18n'
import { generateFollowUp } from '../services/ai.service'
import { initTbStore, tbActions, tbState } from '../store/textbook.store'

const { t } = usePluginI18n()

onMounted(() => initTbStore())

const activeComponent = computed(() => {
  const item = tbState.history.find(h => h.id === tbState.activeHistoryId)
  if (!item)
    return null
  switch (item.scenario) {
    case 'situational': return BoardSituational
    case 'builder': return BoardBuilder
    case 'translation': return BoardTranslation
    case 'review': return BoardReview
    case 'speaking': return BoardSpeaking
    default: return null
  }
})

function selectHistory(id: string) {
  tbState.activeHistoryId = id
  // Закрываем сайдбар на мобильных устройствах при выборе истории
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    tbState.isSidebarOpen = false
  }
}

// Слушаем генерацию нового контента, чтобы на мобилке тоже закрывать сайдбар
watch(() => tbState.activeHistoryId, (newId, oldId) => {
  if (newId !== oldId && typeof window !== 'undefined' && window.innerWidth <= 768) {
    tbState.isSidebarOpen = false
  }
})
</script>

<template>
  <div class="tb-layout">
    <!-- Мобильный затемняющий фон -->
    <div
      class="tb-mobile-overlay"
      :class="{ 'is-active': tbState.isSidebarOpen }"
      @click="tbState.isSidebarOpen = false"
    />

    <div class="tb-sidebar" :class="{ 'is-collapsed': !tbState.isSidebarOpen }">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          {{ t('tb.title') }}
        </h2>
        <button class="settings-btn" :title="t('settings.title')" @click="tbState.isSettingsOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
      </div>

      <InputZone class="input-zone-wrapper" />

      <div class="tb-history">
        <h3 class="history-title">
          {{ t('tb.history') }}
        </h3>
        <div class="history-list">
          <div
            v-for="item in tbState.history" :key="item.id"
            class="history-item" :class="{ 'is-active': tbState.activeHistoryId === item.id }"
            @click="selectHistory(item.id)"
          >
            <div class="hi-header">
              <span class="badge">{{ t(`scenario.${item.scenario}`) }}</span>
              <button class="del-btn" @click.stop="tbActions.deleteHistory(item.id)">
                ✕
              </button>
            </div>
            <p class="truncate">
              {{ item.prompt }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <button
      class="sidebar-toggle"
      :class="{ 'is-collapsed': !tbState.isSidebarOpen }"
      :title="tbState.isSidebarOpen ? 'Скрыть панель' : 'Показать панель'"
      @click="tbState.isSidebarOpen = !tbState.isSidebarOpen"
    >
      <svg v-if="tbState.isSidebarOpen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="9" y1="3" y2="21" /><path d="m16 15-3-3 3-3" /></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="9" y1="3" y2="21" /><path d="m14 9 3 3-3 3" /></svg>
    </button>

    <div class="tb-board" :class="{ expanded: !tbState.isSidebarOpen }">
      <div v-if="tbState.isLoading" class="tb-loading-overlay">
        <div class="spinner" />
        <p>{{ t('tb.loading') }}</p>
      </div>

      <template v-else-if="activeComponent">
        <component
          :is="activeComponent"
          :key="tbState.activeHistoryId"
          :data="tbActions.getActiveData()"
        />

        <div class="follow-up-wrapper">
          <button v-if="!tbState.isFollowUpVisible" class="btn-new-query" @click="tbState.isFollowUpVisible = true">
            ✨ {{ t('tb.newQuery') }}
          </button>

          <div v-else class="follow-up-box">
            <textarea
              v-model="tbState.followUpInput"
              class="tb-textarea"
              :placeholder="t('tb.placeholder')"
              @keydown.ctrl.enter.prevent="generateFollowUp"
            />
            <div class="follow-up-actions">
              <button
                class="tb-btn"
                :class="{ 'is-loading': tbState.isFollowUpLoading }"
                :disabled="tbState.isFollowUpLoading || !tbState.followUpInput.trim()"
                @click="generateFollowUp"
              >
                {{ tbState.isFollowUpLoading ? t('tb.loading') : t('tb.send') }}
              </button>
              <button class="tb-btn secondary icon-btn" @click="tbState.isFollowUpVisible = false">
                ✕
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="tb-empty">
        <div class="empty-icon">
          📚
        </div>
        <p>{{ t('tb.emptyState') }}</p>
      </div>
    </div>

    <Transition name="fade">
      <Settings v-if="tbState.isSettingsOpen" />
    </Transition>
  </div>
</template>

<style scoped>
.tb-layout {
  display: flex;
  height: calc(100dvh - 50px);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  position: relative;
  overflow: hidden;
}

.tb-mobile-overlay {
  display: none;
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 25;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}
.tb-mobile-overlay.is-active {
  opacity: 1;
  pointer-events: auto;
}

.tb-sidebar {
  width: 380px;
  min-width: 380px;
  border-right: 1px solid var(--border-primary-color);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-secondary-color);
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 30;
}
.tb-sidebar.is-collapsed {
  transform: translateX(-100%);
  margin-left: -380px;
}

.sidebar-toggle {
  position: absolute;
  top: 24px;
  left: 396px;
  z-index: 40;
  background: var(--bg-tertiary-color);
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-toggle:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-focus-color);
}
.sidebar-toggle.is-collapsed {
  left: 24px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.settings-btn {
  background: transparent;
  border: none;
  color: var(--fg-secondary-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.settings-btn:hover {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
}
.sidebar-title {
  font-size: 1.5em;
  margin: 0;
  color: var(--fg-primary-color);
}
.history-title {
  font-size: 1.1em;
  color: var(--fg-secondary-color);
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 8px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 12px;
  border: 1px solid var(--border-secondary-color);
  background: var(--bg-tertiary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.history-item:hover {
  border-color: var(--border-focus-color);
}
.history-item.is-active {
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
}
.hi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.badge {
  font-size: 10px;
  background: var(--bg-primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--fg-accent-color);
  text-transform: uppercase;
}
.del-btn {
  background: transparent;
  color: var(--fg-muted-color);
  font-size: 14px;
  border: none;
  padding: 4px;
}
.del-btn:hover {
  color: var(--fg-error-color);
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9em;
  color: var(--fg-secondary-color);
  margin: 0;
}

.tb-board {
  flex: 1;
  padding: 80px 40px 40px 64px;
  overflow-y: auto;
  position: relative;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}
.tb-board.expanded {
  padding-left: 80px;
}
.tb-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--fg-muted-color);
}
.empty-icon {
  font-size: 4em;
  margin-bottom: 16px;
  opacity: 0.5;
}

.tb-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--bg-primary-color-rgb), 0.8);
  z-index: 20;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-secondary-color);
  border-top-color: var(--border-accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.follow-up-wrapper {
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px dashed var(--border-secondary-color);
}
.btn-new-query {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  padding: 12px 24px;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1em;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
.btn-new-query:hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
  transform: translateY(-2px);
}
.follow-up-box {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}
.tb-textarea {
  width: 100%;
  resize: vertical;
  min-height: 100px;
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
.follow-up-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.tb-btn {
  padding: 10px 20px;
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
.tb-btn.secondary {
  background: transparent;
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  padding: 10px 14px;
}
.tb-btn.secondary:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tb-mobile-overlay {
    display: block;
  }

  .tb-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    min-width: unset;
    margin-left: 0 !important;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
    padding: 16px;

    display: flex;
    flex-direction: column;
  }

  .sidebar-header {
    order: 1;
    margin-bottom: 0;
  }
  .settings-btn {
    display: none;
  }

  .tb-history {
    order: 2;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border-bottom: 1px solid var(--border-secondary-color);
    padding-bottom: 16px;
    margin-bottom: 0;
  }

  .input-zone-wrapper {
    order: 3;
    padding-top: 16px;
  }

  .sidebar-toggle:not(.is-collapsed) {
    display: none;
  }

  .sidebar-toggle.is-collapsed {
    left: 16px;
    top: 16px;
  }

  .tb-board {
    padding: 70px 12px 16px 12px;
  }
  .tb-board.expanded {
    padding-left: 16px;
  }
}
</style>
