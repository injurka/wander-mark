<script setup lang="ts">
import { ref } from 'vue'
import ActivityHistory from '../components/activity-history.vue'
import NeedsReview from '../components/needs-review.vue'
import StatsOverview from '../components/stats-overview.vue'
import SyncSettings from '../components/sync-settings.vue'
import { usePluginI18n } from '../i18n'

const { t } = usePluginI18n()
const activeTab = ref('overview')
</script>

<template>
  <div class="rt-page">
    <div class="rt-header">
      <div class="rt-title-group">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-title-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
        <h1>{{ t('report.title') }}</h1>
      </div>

      <div class="rt-tabs">
        <button class="rt-tab" :class="[{ active: activeTab === 'overview' }]" @click="activeTab = 'overview'">
          {{ t('report.tabs.overview') }}
        </button>
        <button class="rt-tab" :class="[{ active: activeTab === 'history' }]" @click="activeTab = 'history'">
          {{ t('report.tabs.history') }}
        </button>
        <button class="rt-tab" :class="[{ active: activeTab === 'review' }]" @click="activeTab = 'review'">
          {{ t('report.tabs.review') }}
        </button>
        <button class="rt-tab" :class="[{ active: activeTab === 'sync' }]" @click="activeTab = 'sync'">
          {{ t('report.tabs.sync') }}
        </button>
      </div>
    </div>

    <div class="rt-content">
      <StatsOverview v-if="activeTab === 'overview'" />
      <ActivityHistory v-if="activeTab === 'history'" />
      <NeedsReview v-if="activeTab === 'review'" />
      <SyncSettings v-if="activeTab === 'sync'" />
    </div>
  </div>
</template>

<style scoped>
.rt-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}
.rt-header {
  margin-bottom: 30px;
}
.rt-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.rt-title-group h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--fg-primary-color);
}
.rt-title-icon {
  color: var(--fg-accent-color);
}
.rt-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-secondary-color);
}
.rt-tab {
  background: transparent;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  color: var(--fg-secondary-color);
  font-weight: 500;
  border-bottom: 2px solid transparent;
}
.rt-tab:hover {
  color: var(--fg-primary-color);
}
.rt-tab.active {
  color: var(--fg-accent-color);
  border-bottom-color: var(--fg-accent-color);
}
.rt-content {
  margin-top: 24px;
}
</style>
