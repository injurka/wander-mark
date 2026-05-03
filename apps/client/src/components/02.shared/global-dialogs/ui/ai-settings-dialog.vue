<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGlobalSettingsStore } from '~/shared/store/settings.store'

const visible = defineModel<boolean>('visible', { required: true })
const globalSettings = useGlobalSettingsStore()

const availableModels = ref<{ label: string, value: string }[]>([])
const isLoadingModels = ref(false)
const errorModels = ref('')

async function fetchModels() {
  if (!globalSettings.aiUrl || !globalSettings.aiKey) {
    errorModels.value = 'Введите URL и API ключ для загрузки'
    return
  }

  isLoadingModels.value = true
  errorModels.value = ''

  try {
    const baseUrl = globalSettings.aiUrl.replace(/\/$/, '')
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${globalSettings.aiKey}`,
      },
    })

    if (!res.ok)
      throw new Error(`HTTP Error: ${res.status}`)

    const data = await res.json()
    if (data && Array.isArray(data.data)) {
      availableModels.value = data.data.map((m: any) => ({
        label: m.id,
        value: m.id,
      }))

      if (globalSettings.aiModel && !availableModels.value.some(m => m.value === globalSettings.aiModel)) {
        availableModels.value.unshift({
          label: globalSettings.aiModel,
          value: globalSettings.aiModel,
        })
      }
    }
    else {
      throw new Error('Неверный формат ответа от сервера')
    }
  }
  catch (e: any) {
    errorModels.value = e.message
    availableModels.value = []
  }
  finally {
    isLoadingModels.value = false
  }
}

watch(visible, (isOpen) => {
  if (isOpen && globalSettings.aiKey && availableModels.value.length === 0) {
    fetchModels()
  }
})
</script>

<template>
  <KitDialog
    v-model:visible="visible"
    title="Настройки AI"
    icon="mdi:robot-outline"
    :max-width="450"
  >
    <div class="settings-form">
      <div class="form-group">
        <label>API URL (OpenAI совместимый)</label>
        <p class="input-hint">
          Базовый URL, например: https://api.aihubmix.com/v1
        </p>
        <KitInput v-model="globalSettings.aiUrl" placeholder="https://api.aihubmix.com/v1" />
      </div>

      <div class="form-group">
        <label>API Key</label>
        <p class="input-hint">
          Этот ключ будет использоваться всеми плагинами, которым нужен доступ к AI.
        </p>
        <KitInput v-model="globalSettings.aiKey" placeholder="sk-..." type="password" />
      </div>

      <div class="form-group">
        <label>Модель по умолчанию</label>
        <p class="input-hint">
          Выберите модель из списка (кнопка обновить) или введите название вручную.
        </p>
        <div class="model-input-row">
          <KitSelect
            v-if="availableModels.length > 0"
            v-model="globalSettings.aiModel"
            :options="availableModels"
            class="flex-1"
          />
          <KitInput
            v-else
            v-model="globalSettings.aiModel"
            placeholder="gemini-3-flash-preview"
            class="flex-1"
          />
          <KitBtn
            variant="tonal"
            icon="mdi:refresh"
            :disabled="isLoadingModels"
            title="Загрузить список моделей"
            @click="fetchModels"
          />
        </div>
        <p v-if="errorModels" class="input-hint error-text">
          {{ errorModels }}
        </p>
      </div>
    </div>
  </KitDialog>
</template>

<style scoped>
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg-primary-color);
}
.input-hint {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  margin: 4px 0 8px;
}
.model-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.flex-1 {
  flex: 1;
  min-width: 0;
}
.error-text {
  color: var(--fg-error-color);
  margin-top: 8px;
}
</style>
