<script setup lang="ts">
import { computed } from 'vue'
import { usePluginI18n } from '../i18n'
import { trackerActions, trackerState } from '../store/tracker.store'

const { t } = usePluginI18n()
const categories = computed(() => trackerActions.getSpacedRepetitionItems())

function openFile(path: string) {
  if (trackerState.router && trackerState.vaultId) {
    trackerState.router.push(`/${trackerState.vaultId}/${path}`)
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString()
}
</script>

<template>
  <div class="rt-review-wrapper">
    <div class="rt-header-block">
      <h2>{{ t('review.title') }}</h2>
      <p class="rt-desc">
        {{ t('review.desc') }}
      </p>
    </div>

    <div v-if="categories.forgotten.length === 0 && categories.due.length === 0" class="rt-all-caught-up">
      🎉 {{ t('review.allCaughtUp') }}
    </div>

    <!-- Секция: Упущено из виду (Забытое) -->
    <div v-if="categories.forgotten.length > 0" class="rt-section rt-section-danger">
      <div class="rt-section-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-danger"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
        <div class="rt-section-title-wrap">
          <h3>{{ t('review.forgotten') }}</h3>
          <span>{{ t('review.forgottenDesc') }}</span>
        </div>
        <span class="rt-count-badge">{{ categories.forgotten.length }}</span>
      </div>

      <div class="rt-list">
        <div v-for="item in categories.forgotten" :key="item.path" class="rt-list-item" @click="openFile(item.path)">
          <div class="rt-item-main">
            <span class="rt-item-title" :title="item.title">{{ item.title }}</span>
            <span class="rt-item-path" :title="item.path">{{ item.path }}</span>
          </div>
          <div class="rt-item-meta">
            <span class="rt-badge">{{ t('review.times', { n: item.readDates.length }) }}</span>
            <span class="rt-date">{{ formatDate(item.readDates[item.readDates.length - 1]) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция: Пора повторить (Актуальное) -->
    <div v-if="categories.due.length > 0" class="rt-section rt-section-warning">
      <div class="rt-section-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-warning"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        <div class="rt-section-title-wrap">
          <h3>{{ t('review.due') }}</h3>
          <span>{{ t('review.dueDesc') }}</span>
        </div>
        <span class="rt-count-badge">{{ categories.due.length }}</span>
      </div>

      <div class="rt-list">
        <div v-for="item in categories.due" :key="item.path" class="rt-list-item" @click="openFile(item.path)">
          <div class="rt-item-main">
            <span class="rt-item-title" :title="item.title">{{ item.title }}</span>
            <span class="rt-item-path" :title="item.path">{{ item.path }}</span>
          </div>
          <div class="rt-item-meta">
            <span class="rt-badge">{{ t('review.times', { n: item.readDates.length }) }}</span>
            <span class="rt-date">{{ formatDate(item.readDates[item.readDates.length - 1]) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция: Твёрдо усвоено -->
    <div v-if="categories.mastered.length > 0" class="rt-section rt-section-success">
      <div class="rt-section-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
        <div class="rt-section-title-wrap">
          <h3>{{ t('review.mastered') }}</h3>
          <span>{{ t('review.masteredDesc') }}</span>
        </div>
        <span class="rt-count-badge">{{ categories.mastered.length }}</span>
      </div>

      <div class="rt-list">
        <div v-for="item in categories.mastered" :key="item.path" class="rt-list-item" @click="openFile(item.path)">
          <div class="rt-item-main">
            <span class="rt-item-title" :title="item.title">{{ item.title }}</span>
            <span class="rt-item-path" :title="item.path">{{ item.path }}</span>
          </div>
          <div class="rt-item-meta">
            <span class="rt-badge">{{ t('review.times', { n: item.readDates.length }) }}</span>
            <span class="rt-date">{{ formatDate(item.readDates[item.readDates.length - 1]) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-review-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.rt-header-block {
  padding: 0 8px;
}
.rt-header-block h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--fg-primary-color);
}
.rt-desc {
  color: var(--fg-muted-color);
  font-size: 0.95rem;
  margin-top: 8px;
  margin-bottom: 0;
}
.rt-all-caught-up {
  background: var(--bg-success-color, rgba(46, 160, 67, 0.1));
  border: 1px solid var(--border-success-color, #2ea043);
  color: var(--fg-success-color, #3fb950);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
}

/* Секции */
.rt-section {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 20px;
}
.rt-section-danger {
  border-top: 3px solid #f85149;
}
.rt-section-warning {
  border-top: 3px solid #d29922;
}
.rt-section-success {
  border-top: 3px solid #2ea043;
}

.rt-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.rt-section-title-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.rt-section-title-wrap h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--fg-primary-color);
}
.rt-section-title-wrap span {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  margin-top: 2px;
}
.rt-count-badge {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

/* Иконки */
.icon-danger {
  color: #f85149;
}
.icon-warning {
  color: #d29922;
}
.icon-success {
  color: #2ea043;
}

/* Список */
.rt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rt-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.rt-list-item:hover {
  border-color: var(--fg-accent-color);
  transform: translateY(-1px);
}
.rt-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}
.rt-item-title {
  font-weight: 600;
  color: var(--fg-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-item-path {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.rt-badge {
  background: var(--bg-tertiary-color);
  color: var(--fg-secondary-color);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  white-space: nowrap;
}
.rt-date {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  white-space: nowrap;
}
</style>
