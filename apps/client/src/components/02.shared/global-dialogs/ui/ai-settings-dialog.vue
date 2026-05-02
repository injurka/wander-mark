<script setup lang="ts">
import { useGlobalSettingsStore } from '~/shared/store/settings.store'

const visible = defineModel<boolean>('visible', { required: true })
const globalSettings = useGlobalSettingsStore()
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
        <label>API Key (AiHubMix)</label>
        <p class="input-hint">
          Этот ключ будет использоваться всеми плагинами, которым нужен доступ к AI.
        </p>
        <KitInput v-model="globalSettings.aiKey" placeholder="sk-..." />
      </div>

      <div class="form-group">
        <label>Модель по умолчанию</label>
        <KitInput v-model="globalSettings.aiModel" placeholder="gemini-3-flash-preview" />
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
</style>
