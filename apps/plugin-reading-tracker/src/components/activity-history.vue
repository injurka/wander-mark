<script setup lang="ts">
import { computed } from 'vue'
import { usePluginI18n } from '../i18n'
import { trackerState } from '../store/tracker.store'

const { t, locale } = usePluginI18n()

const CHART_DAYS = 14

const chartData = computed(() => {
  const data: { date: Date, label: string, count: number }[] = []
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({
      date: d,
      label: `${d.getDate()}.${d.getMonth() + 1}`,
      count: 0,
    })
  }

  trackerState.logs.forEach((log) => {
    log.readDates.forEach((ts) => {
      const diffMs = today.getTime() - ts
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
      if (diffDays >= 0 && diffDays < CHART_DAYS) {
        data[CHART_DAYS - 1 - diffDays].count++
      }
    })
  })

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return { data, maxCount }
})

const recentHistory = computed(() => {
  const list: { path: string, title: string, ts: number }[] = []
  trackerState.logs.forEach((log) => {
    log.readDates.forEach((ts) => {
      list.push({ path: log.path, title: log.title, ts })
    })
  })
  return list.sort((a, b) => b.ts - a.ts).slice(0, 30)
})

function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

function openFile(path: string) {
  if (trackerState.router && trackerState.vaultId) {
    trackerState.router.push(`/${trackerState.vaultId}/${path}`)
  }
}
</script>

<template>
  <div class="rt-history">
    <div class="rt-card">
      <h2>{{ t('history.chartTitle') }}</h2>
      <div class="rt-chart-container">
        <div
          v-for="(day, idx) in chartData.data"
          :key="idx"
          class="rt-chart-bar-wrap"
        >
          <div
            class="rt-chart-bar"
            :style="{ height: `${day.count / chartData.maxCount * 100}%` }"
            :title="`${day.count} ${t('history.reads')} (${day.label})`"
          />
          <span class="rt-chart-label">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <div class="rt-card mt-24">
      <h2>{{ t('history.timelineTitle') }}</h2>

      <div v-if="recentHistory.length === 0" class="rt-empty">
        {{ t('history.empty') }}
      </div>

      <div v-else class="rt-timeline">
        <div
          v-for="(item, idx) in recentHistory"
          :key="idx"
          class="rt-timeline-item"
          @click="openFile(item.path)"
        >
          <div class="rt-timeline-time">
            {{ formatDateTime(item.ts) }}
          </div>
          <div class="rt-timeline-content">
            <div class="rt-timeline-title" :title="item.title">
              {{ item.title }}
            </div>
            <div class="rt-timeline-path" :title="item.path">
              {{ item.path }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-history {
  display: flex;
  flex-direction: column;
}
.rt-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 24px;
}
.mt-24 {
  margin-top: 24px;
}
.rt-card h2 {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 1.2rem;
  color: var(--fg-primary-color);
}

.rt-chart-container {
  display: flex;
  align-items: flex-end;
  height: 180px;
  gap: 8px;
  padding-bottom: 24px;
  position: relative;
  border-bottom: 1px dashed var(--border-secondary-color);
}
.rt-chart-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  position: relative;
}
.rt-chart-bar {
  width: 100%;
  max-width: 40px;
  background: var(--fg-accent-color);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition:
    opacity 0.2s,
    height 0.5s ease-out;
  opacity: 0.85;
  cursor: pointer;
}
.rt-chart-bar:hover {
  opacity: 1;
  background: var(--fg-action-color);
}
.rt-chart-label {
  position: absolute;
  bottom: -24px;
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  white-space: nowrap;
}

.rt-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rt-timeline-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.rt-timeline-item:hover {
  border-color: var(--fg-accent-color);
  transform: translateX(4px);
}
.rt-timeline-time {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  min-width: 110px;
  white-space: nowrap;
}
.rt-timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  border-left: 2px solid var(--border-secondary-color);
  padding-left: 16px;
}
.rt-timeline-title {
  font-weight: 600;
  color: var(--fg-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-timeline-path {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-empty {
  color: var(--fg-muted-color);
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
}
</style>
