<script setup lang="ts">
import { ref } from 'vue'
import { usePluginI18n } from '../i18n'
import { MODELS, tbActions, tbState } from '../store/textbook.store'

const { t } = usePluginI18n()
const isLoadingConfig = ref(false)

async function loadConfig() {
  isLoadingConfig.value = true
  try {
    const configPath = `meta/${tbState.vaultId}/plugins/configs/smart-textbook.json`
    let configText = null

    // 1. Попытка через нативный API хоста
    if (tbState.getFileContent) {
      configText = await tbState.getFileContent(configPath)
    }

    // 2. Fallback через HTTP Fetch
    if (!configText) {
      const url = `${tbState.vaultUrl}/${configPath}`
      const res = await fetch(url)
      if (!res.ok)
        throw new Error(`HTTP: ${res.status}`)
      configText = await res.text()
    }

    const data = JSON.parse(configText)
    let loaded = false

    if (data.apiKey) {
      tbState.apiKey = data.apiKey
      loaded = true
    }
    if (data.model && MODELS.includes(data.model)) {
      tbState.model = data.model
      loaded = true
    }

    if (loaded) {
      tbActions.notify(t('settings.configSuccess'), 'success')
    }
    else {
      tbActions.notify(t('settings.configEmpty'), 'warning')
    }
  }
  catch (e: any) {
    tbActions.notify(`${t('settings.configError')}${e.message}`, 'error')
  }
  finally {
    isLoadingConfig.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @mousedown.self="tbState.isSettingsOpen = false">
    <div class="settings-modal">
      <div class="modal-header">
        <h2>{{ t('settings.title') }}</h2>
        <button class="icon-btn" @click="tbState.isSettingsOpen = false">
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>{{ t('settings.apiKey') }} (AiHubMix)</label>
          <input v-model="tbState.apiKey" type="password" placeholder="sk-..." class="tb-input">
        </div>

        <div class="form-group">
          <label>{{ t('settings.model') }}</label>
          <select v-model="tbState.model" class="tb-input">
            <option v-for="m in MODELS" :key="m" :value="m">
              {{ m }}
            </option>
          </select>
        </div>

        <div class="actions-row">
          <button class="tb-btn secondary" :disabled="isLoadingConfig" @click="loadConfig">
            <span v-if="isLoadingConfig" class="spinner" />
            {{ isLoadingConfig ? t('settings.loading') : t('settings.loadConfig') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.settings-modal {
  background: var(--bg-primary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-secondary-color);
}
.modal-header h2 {
  margin: 0;
  font-size: 1.2em;
  color: var(--fg-primary-color);
}
.icon-btn {
  background: transparent;
  border: none;
  font-size: 1.2em;
  color: var(--fg-muted-color);
  cursor: pointer;
}
.icon-btn:hover {
  color: var(--fg-primary-color);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 0.9em;
  font-weight: bold;
  color: var(--fg-secondary-color);
}
.tb-input {
  padding: 10px 12px;
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  font-family: inherit;
  outline: none;
}
.tb-input:focus {
  border-color: var(--border-focus-color);
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.tb-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
}
.tb-btn.secondary {
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
}
.tb-btn.secondary:hover {
  background: var(--bg-hover-color);
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--fg-primary-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
