<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePluginI18n } from '../i18n'
import { trackerActions, trackerState } from '../store/tracker.store'

const { t, locale } = usePluginI18n()
const isLoadingConfig = ref(false)

const lastSyncFormatted = computed(() => {
  if (!trackerState.lastSync)
    return t('sync.never')

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(trackerState.lastSync))
})

async function loadConfig() {
  isLoadingConfig.value = true
  try {
    const configPath = `meta/${trackerState.vaultId}/plugins/configs/reading-tracker.json`
    let configText = null

    // Пытаемся получить файл через API хоста
    if (trackerState.getFileContent) {
      configText = await trackerState.getFileContent(configPath)
    }

    // Fallback: обычный fetch
    if (!configText) {
      const url = `${trackerState.vaultUrl}/${configPath}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP: ${res.status}`)
      }
      configText = await res.text()
    }

    const data = JSON.parse(configText)

    if (data.syncUrl) {
      trackerState.syncUrl = data.syncUrl
      if (data.identifier) {
        trackerState.identifier = data.identifier
      }

      if (trackerState.showToast) {
        trackerState.showToast(t('sync.configSuccess'), { type: 'success' })
      }
      else {
        alert(t('sync.configSuccess'))
      }
    }
    else {
      if (trackerState.showToast) {
        trackerState.showToast(t('sync.configEmpty'), { type: 'warning' })
      }
      else {
        alert(t('sync.configEmpty'))
      }
    }
  }
  catch (e: any) {
    if (trackerState.showToast) {
      trackerState.showToast(`${t('sync.configError')}${e.message}`, { type: 'error' })
    }
    else {
      alert(`${t('sync.configError')}${e.message}`)
    }
  }
  finally {
    isLoadingConfig.value = false
  }
}

async function handleSync() {
  if (!trackerState.syncUrl) {
    if (trackerState.showToast)
      trackerState.showToast(t('sync.emptyUrlError'), { type: 'warning' })
    return
  }
  await trackerActions.sync()
}
</script>

<template>
  <div class="rt-card">
    <h2>{{ t('sync.title') }}</h2>
    <p class="rt-desc">
      {{ t('sync.desc') }}
    </p>

    <div class="rt-sync-form">
      <!-- Блок URL -->
      <div class="rt-form-group">
        <div class="rt-form-header">
          <label class="rt-label">API URL</label>
          <button class="rt-btn-text" :disabled="isLoadingConfig" @click="loadConfig">
            {{ isLoadingConfig ? t('sync.loading') : t('sync.loadConfig') }}
          </button>
        </div>
        <input v-model="trackerState.syncUrl" type="url" class="rt-input" :placeholder="t('sync.placeholder')" :disabled="trackerState.isSyncing">
      </div>

      <!-- Блок Идентификатора -->
      <div class="rt-form-group mt-2">
        <label class="rt-label">{{ t('sync.identifierLabel') }}</label>
        <input v-model="trackerState.identifier" type="text" class="rt-input" :placeholder="t('sync.identifierPlaceholder')" :disabled="trackerState.isSyncing">
      </div>

      <div class="rt-sync-actions">
        <button class="rt-btn rt-btn-primary" :disabled="trackerState.isSyncing || !trackerState.syncUrl" @click="handleSync">
          <span v-if="trackerState.isSyncing">{{ t('sync.syncing') }}</span>
          <span v-else>{{ t('sync.syncBtn') }}</span>
        </button>

        <span class="rt-last-sync">{{ t('sync.lastSync') }}: <strong>{{ lastSyncFormatted }}</strong></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 24px;
}
.rt-card h2 {
  margin-top: 0;
  font-size: 1.2rem;
  color: var(--fg-primary-color);
}
.rt-desc {
  color: var(--fg-muted-color);
  font-size: 0.9rem;
  margin-bottom: 20px;
}
.rt-sync-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}
.rt-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rt-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mt-2 {
  margin-top: 8px;
}
.rt-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  margin: 0;
}
.rt-btn-text {
  background: transparent;
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}
.rt-btn-text:hover:not(:disabled) {
  text-decoration: underline;
}
.rt-btn-text:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rt-input {
  width: 100%;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-primary-color);
  color: var(--fg-primary-color);
  padding: 10px 12px;
  border-radius: 6px;
  outline: none;
}
.rt-input:focus {
  border-color: var(--fg-accent-color);
}
.rt-sync-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
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
}
.rt-btn-primary {
  background-color: var(--bg-accent-color);
  border-color: var(--fg-accent-color);
  color: var(--fg-primary-color);
}
.rt-btn-primary:hover:not(:disabled) {
  background-color: var(--fg-action-color);
}
.rt-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rt-last-sync {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
}
.rt-last-sync strong {
  color: var(--fg-primary-color);
}
</style>
