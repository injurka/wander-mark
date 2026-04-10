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
/* Обновленные стили для components/settings-modal.vue */
.hz-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}
.hz-settings-card {
  background: var(--bg-primary-color);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-secondary-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 90%;
  max-width: 360px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.hz-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 12px;
  margin-bottom: 4px;
}
h4 {
  margin: 0;
  color: var(--fg-primary-color);
  font-size: 1.2rem;
  font-weight: 700;
}
label {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  font-weight: 600;
  margin-bottom: -10px;
}
.hz-input {
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  padding: 10px 14px;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.hz-input:focus {
  border-color: var(--fg-accent-color);
  box-shadow: 0 0 0 2px rgba(var(--fg-accent-color-rgb), 0.1);
}
.hz-btn {
  margin-top: 12px;
  background: var(--fg-accent-color);
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.hz-btn:hover {
  opacity: 0.9;
}
.hz-btn-small {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}
.hz-btn-small:hover:not(:disabled) {
  background: var(--bg-hover-color);
  color: var(--fg-accent-color);
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
