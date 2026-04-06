<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KitBtn, KitDialog, KitInput } from '~/components/01.kit'
import { usePluginStore } from '../store'

const visible = defineModel<boolean>('visible', { required: true })
const pluginStore = usePluginStore()
const { t } = useI18n()

const installUrl = ref('')
const installLoading = ref(false)
const installError = ref('')

async function handleInstall() {
  if (!installUrl.value.trim())
    return

  installLoading.value = true
  installError.value = ''

  try {
    await pluginStore.install(installUrl.value.trim())
    installUrl.value = ''
  }
  catch (e: any) {
    installError.value = e.message
  }
  finally {
    installLoading.value = false
  }
}

async function handleToggle(pluginId: string, currentlyEnabled: boolean) {
  if (currentlyEnabled) {
    await pluginStore.disable(pluginId)
  }
  else {
    await pluginStore.enable(pluginId)
  }
}

async function handleUninstall(pluginId: string) {
  await pluginStore.uninstall(pluginId)
}
</script>

<template>
  <KitDialog
    v-model:visible="visible"
    :title="t('plugins.title')"
    icon="mdi:puzzle-outline"
    :max-width="560"
  >
    <!-- Секция установки -->
    <div class="pm-install-section">
      <div class="pm-install-row">
        <KitInput
          v-model="installUrl"
          :placeholder="t('plugins.urlPlaceholder')"
          class="pm-install-input"
          size="md"
          @keydown.enter="handleInstall"
        />
        <KitBtn
          variant="solid"
          :disabled="installLoading || !installUrl.trim()"
          @click="handleInstall"
        >
          {{ installLoading ? t('plugins.installing') : t('plugins.install') }}
        </KitBtn>
      </div>
      <p v-if="installError" class="pm-error">
        {{ installError }}
      </p>
    </div>

    <!-- Список плагинов -->
    <div class="pm-list">
      <div v-if="pluginStore.plugins.length === 0" class="pm-empty">
        <Icon icon="mdi:puzzle-outline" class="pm-empty-icon" />
        <p>{{ t('plugins.noInstalled') }}</p>
        <span>{{ t('plugins.pasteHint') }}</span>
      </div>

      <div
        v-for="plugin in pluginStore.plugins"
        :key="plugin.id"
        class="pm-plugin-card"
        :class="{ 'is-disabled': !plugin.enabled }"
      >
        <div class="pm-plugin-info">
          <Icon :icon="plugin.icon || 'mdi:puzzle-outline'" class="pm-plugin-icon" />
          <div class="pm-plugin-text">
            <div class="pm-plugin-name">
              {{ plugin.name }}
              <span class="pm-plugin-version">v{{ plugin.version }}</span>
            </div>
            <div v-if="plugin.description" class="pm-plugin-desc">
              {{ plugin.description }}
            </div>
            <div v-if="pluginStore.getError(plugin.id)" class="pm-plugin-error">
              <Icon icon="mdi:alert-circle-outline" />
              {{ pluginStore.getError(plugin.id) }}
            </div>
          </div>
        </div>

        <div class="pm-plugin-actions">
          <KitBtn
            variant="tonal"
            size="md"
            density="compact"
            @click="handleToggle(plugin.id, plugin.enabled)"
          >
            {{ plugin.enabled ? t('plugins.disable') : t('plugins.enable') }}
          </KitBtn>
          <KitBtn
            v-if="plugin.removable === false"
            variant="text"
            size="md"
            density="compact"
            icon="mdi:lock-outline"
            disabled
            :title="t('plugins.requiredByVault')"
          />
          <KitBtn
            v-else
            variant="text"
            size="md"
            density="compact"
            icon="mdi:delete-outline"
            @click="handleUninstall(plugin.id)"
          />
        </div>
      </div>
    </div>
  </KitDialog>
</template>

<style lang="scss" scoped>
.pm-install-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-secondary-color);
}

.pm-install-row {
  display: flex;
  gap: 8px;
}

.pm-install-input {
  flex: 1;
}

.pm-error {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 8px;
  margin-bottom: 0;
}

.pm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.pm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  color: var(--fg-muted-color);
  gap: 8px;

  .pm-empty-icon {
    font-size: 2.5rem;
    opacity: 0.3;
  }

  p {
    margin: 0;
    font-weight: 600;
  }

  span {
    font-size: 0.85rem;
  }
}

.pm-plugin-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
  background-color: var(--bg-secondary-color);
  transition: all 0.2s;

  &.is-disabled {
    opacity: 0.5;
  }

  &:hover {
    border-color: var(--border-primary-color);
  }
}

.pm-plugin-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.pm-plugin-icon {
  font-size: 1.5rem;
  color: var(--fg-accent-color);
  flex-shrink: 0;
  margin-top: 2px;
}

.pm-plugin-text {
  flex: 1;
  min-width: 0;
}

.pm-plugin-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pm-plugin-version {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--fg-muted-color);
  font-family: 'Maple Mono CN', monospace;
}

.pm-plugin-desc {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  margin-top: 2px;
}

.pm-plugin-error {
  font-size: 0.75rem;
  color: #e74c3c;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pm-plugin-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 12px;
}
</style>
