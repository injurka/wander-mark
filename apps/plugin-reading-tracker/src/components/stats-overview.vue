<script setup lang="ts">
import { computed } from 'vue'
import { usePluginI18n } from '../i18n'
import { trackerState } from '../store/tracker.store'

const { t } = usePluginI18n()

const totalUniqueRead = computed(() => trackerState.logs.length)

const totalSessions = computed(() => {
  return trackerState.logs.reduce((sum, log) => sum + log.readDates.length, 0)
})

const recentlyRead = computed(() => {
  return [...trackerState.logs]
    .filter(log => log.readDates.length > 0)
    .sort((a, b) => {
      const lastA = a.readDates.at(-1) ?? 0
      const lastB = b.readDates.at(-1) ?? 0
      return lastB - lastA
    })
    .slice(0, 5)
})

const mostRead = computed(() => {
  return [...trackerState.logs]
    .sort((a, b) => b.readDates.length - a.readDates.length)
    .slice(0, 5)
})

function openFile(path: string) {
  if (trackerState.router && trackerState.vaultId) {
    trackerState.router.push(`/${trackerState.vaultId}/${path}`)
  }
}
</script>

<template>
  <div class="rt-overview">
    <div class="rt-stats-grid">
      <div class="rt-stat-card">
        <div class="rt-stat-value">
          {{ totalUniqueRead }}
        </div>
        <div class="rt-stat-label">
          {{ t('overview.totalArticles') }}
        </div>
      </div>
      <div class="rt-stat-card">
        <div class="rt-stat-value">
          {{ totalSessions }}
        </div>
        <div class="rt-stat-label">
          {{ t('overview.totalSessions') }}
        </div>
      </div>
    </div>

    <div class="rt-overview-columns">
      <div class="rt-card rt-col">
        <h2>{{ t('overview.recentlyRead') }}</h2>
        <div v-if="recentlyRead.length === 0" class="rt-empty">
          {{ t('overview.noData') }}
        </div>
        <div v-else class="rt-list">
          <div v-for="item in recentlyRead" :key="item.path" class="rt-list-item" @click="openFile(item.path)">
            <div class="rt-item-main">
              <span class="rt-item-title" :title="item.title">{{ item.title }}</span>
            </div>
            <div class="rt-item-meta">
              <span class="rt-badge">{{ t('overview.readCount', { n: item.readDates.length }) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rt-card rt-col">
        <h2>{{ t('overview.mostRead') }}</h2>
        <div v-if="mostRead.length === 0" class="rt-empty">
          {{ t('overview.noData') }}
        </div>
        <div v-else class="rt-list">
          <div v-for="item in mostRead" :key="item.path" class="rt-list-item" @click="openFile(item.path)">
            <div class="rt-item-main">
              <span class="rt-item-title" :title="item.title">{{ item.title }}</span>
            </div>
            <div class="rt-item-meta">
              <span class="rt-badge">{{ t('overview.readCount', { n: item.readDates.length }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.rt-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.rt-stat-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.rt-stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--fg-accent-color);
  line-height: 1;
  margin-bottom: 8px;
}
.rt-stat-label {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  font-weight: 500;
}
.rt-overview-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.rt-col {
  padding: 20px;
}
.rt-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
}
.rt-card h2 {
  margin-top: 0;
  font-size: 1.2rem;
  color: var(--fg-primary-color);
}
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
  margin-right: 12px;
}
.rt-item-title {
  font-weight: 600;
  color: var(--fg-primary-color);
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
.rt-empty {
  color: var(--fg-muted-color);
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
}
</style>
