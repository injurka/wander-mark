<script setup lang="ts">
import { ref } from 'vue'
import { state } from '../store/hanzi-saver.store'

const emit = defineEmits(['close'])
const isLoadingConfig = ref(false)

async function loadConfig() {
  isLoadingConfig.value = true
  try {
    const configPath = `meta/${state.vaultId}/plugins/configs/hanzi-saver.json`
    let configText = null

    if (state.getFileContent) {
      configText = await state.getFileContent(configPath)
    }

    if (!configText) {
      const url = `${state.vaultUrl}/${configPath}`
      const res = await fetch(url)
      if (!res.ok)
        throw new Error(`HTTP: ${res.status}`)
      configText = await res.text()
    }

    const data = JSON.parse(configText)

    if (data.apiKey)
      state.apiKey = data.apiKey
    if (data.backendUrl)
      state.backendUrl = data.backendUrl
    if (data.model)
      state.model = data.model

    if (state.showToast)
      state.showToast('Настройки загружены', { type: 'success' })
  }
  catch (e: any) {
    if (state.showToast)
      state.showToast(`Ошибка: ${e.message}`, { type: 'error' })
  }
  finally {
    isLoadingConfig.value = false
  }
}
</script>

<template>
  <div class="hz-settings-overlay" @click.stop>
    <div class="hz-settings-card">
      <div class="hz-modal-header">
        <h4>Настройки Hanzi Saver</h4>
        <button class="hz-btn-small" :disabled="isLoadingConfig" @click="loadConfig">
          {{ isLoadingConfig ? 'Загрузка...' : 'Загрузить конфиг' }}
        </button>
      </div>

      <label>URL Бэкенда (Bun + SQLite)</label>
      <input v-model="state.backendUrl" class="hz-input" placeholder="http://localhost:3000">

      <label>API Key (AiHubMix)</label>
      <input v-model="state.apiKey" type="password" class="hz-input" placeholder="sk-...">

      <label>Модель</label>
      <input v-model="state.model" class="hz-input" placeholder="gemini-3-flash-preview">

      <button class="hz-btn" @click="emit('close')">
        Сохранить и закрыть
      </button>
    </div>
  </div>
</template>

<style scoped>
.hz-settings-overlay {
  position: absolute;
  inset: -10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}
.hz-settings-card {
  background: var(--bg-primary-color);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-primary-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 320px;
}
.hz-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h4 {
  margin: 0;
  color: var(--fg-primary-color);
  font-size: 1.1rem;
}
label {
  font-size: 0.8em;
  color: var(--fg-muted-color);
  font-weight: 600;
  margin-bottom: -8px;
}
.hz-input {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  padding: 8px 12px;
  border-radius: 6px;
  outline: none;
}
.hz-input:focus {
  border-color: var(--fg-accent-color);
}
.hz-btn {
  margin-top: 8px;
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.hz-btn-small {
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
}
</style>
