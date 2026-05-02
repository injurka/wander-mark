<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { state } from '../store/hanzi-saver.store'

const emit = defineEmits(['close'])

const isLoadingConfig = ref(false)
let abortController = new AbortController()

const isOpen = ref(true)

watch(isOpen, (val) => {
  if (!val) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
})

function handleClose() {
  isOpen.value = false
}

onUnmounted(() => {
  abortController.abort()
})

async function loadConfig() {
  if (isLoadingConfig.value)
    abortController.abort()

  abortController = new AbortController()
  isLoadingConfig.value = true

  try {
    const configPath = `meta/${state.vaultId}/plugins/configs/hanzi-saver.json`
    let configText = null

    if (state.getFileContent) {
      configText = await state.getFileContent(configPath)
    }

    if (!configText) {
      const url = `${state.vaultUrl}/${configPath}`
      const res = await fetch(url, { signal: abortController.signal })
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
  catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        console.log('Config fetch aborted.')
        return
      }
      if (state.showToast)
        state.showToast(`Ошибка: ${e.message}`, { type: 'error' })
    }
  }
  finally {
    isLoadingConfig.value = false
  }
}
</script>

<template>
  <KitDialog
    v-model:visible="isOpen"
    title="Настройки Hanzi Saver"
    icon="mdi:cog"
    :max-width="400"
  >
    <div class="hz-settings-form">
      <div class="form-group">
        <label>URL Бэкенда (Bun + SQLite)</label>
        <KitInput
          v-model="state.backendUrl"
          placeholder="http://localhost:3000"
        />
      </div>

      <div class="form-group">
        <label>API Key (AiHubMix / OpenAI)</label>
        <KitInput
          v-model="state.apiKey"
          type="password"
          placeholder="sk-..."
        />
      </div>

      <div class="form-group">
        <label>Модель</label>
        <KitInput
          v-model="state.model"
          placeholder="gemini-3-flash-preview"
        />
      </div>
    </div>

    <template #footer>
      <KitBtn
        variant="tonal"
        color="secondary"
        :disabled="isLoadingConfig"
        @click="loadConfig"
      >
        {{ isLoadingConfig ? 'Загрузка...' : 'Загрузить конфиг' }}
      </KitBtn>
      <KitBtn @click="handleClose">
        Сохранить
      </KitBtn>
    </template>
  </KitDialog>
</template>

<style scoped>
.hz-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  font-weight: 600;
  display: block;
}
</style>
