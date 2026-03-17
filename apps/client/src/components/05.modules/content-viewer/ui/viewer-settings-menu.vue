<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { KitBtn, KitCheckbox, KitDropdown } from '~/components/01.kit'
import { ThemesVariant, useChangeTheme } from '~/shared/composables/use-change-theme'
import { useContentViewerStore } from '../store'
import { useVaultService } from '~/shared/services/vault.service'

const props = defineProps<{ vault: string }>()

const { setTheme, theme } = useChangeTheme()
const contentViewerStore = useContentViewerStore()
const vaultService = useVaultService()

const isCaching = ref(false)
const cacheProgress = ref(0)

const currentThemeIcon = computed(() =>
  theme.value === ThemesVariant.Light ? 'mdi:weather-sunny' : 'mdi:weather-night',
)

const isRemote = computed(() => {
    const vault = vaultService.getVault(props.vault)
    return vault?.type === 'remote'
})

function toggleTheme() {
  setTheme(theme.value === ThemesVariant.Light ? ThemesVariant.Dark : ThemesVariant.Light)
}

async function handleCacheVault() {
  if (isCaching.value) return
  isCaching.value = true
  
  await vaultService.syncVault(props.vault, (p) => {
    cacheProgress.value = p
  })

  setTimeout(() => {
    isCaching.value = false
    cacheProgress.value = 0
  }, 1000)
}
</script>

<template>
  <KitDropdown :width="280" :close-on-content-click="false">
    
    <template #activator>
      <KitBtn variant="text" size="sm" icon="mdi:dots-vertical" title="Меню настроек" />
    </template>

    <div class="menu-content">
      <div class="menu-section">
        <div class="section-title">Внешний вид</div>
        <div class="menu-item" @click="toggleTheme">
          <div class="item-label">
            <Icon :icon="currentThemeIcon" class="item-icon" />
            <span>Тема оформления</span>
          </div>
          <span class="value-text">{{ theme === 'light' ? 'Светлая' : 'Темная' }}</span>
        </div>
        <div class="divider" />
        <div class="settings-group">
          <KitCheckbox v-model="contentViewerStore.borderlessViewEnabled" label="Широкий просмотр" />
          <KitCheckbox v-model="contentViewerStore.coloredFoldersEnabled" label="Цветные папки" />
          <KitCheckbox v-model="contentViewerStore.showIconsEnabled" label="Иконки в меню" />
          <KitCheckbox v-model="contentViewerStore.showOutlineEnabled" label="Линии структуры" />
        </div>
      </div>

      <div v-if="isRemote" class="menu-section">
        <div class="section-title">Данные и хранилище</div>

        <div class="cache-control">
          <KitBtn 
            variant="tonal" 
            color="primary" 
            class="menu-action-btn" 
            :disabled="isCaching" 
            @click="handleCacheVault"
          >
            <Icon :icon="isCaching ? 'svg-spinners:ring-resize' : 'mdi:folder-download'" class="btn-icon" />
            <span>{{ isCaching ? `Синхронизация ${cacheProgress}%` : 'Скачать для оффлайна' }}</span>
          </KitBtn>
          <div v-if="isCaching" class="progress-bar">
            <div class="progress-fill" :style="{ width: `${cacheProgress}%` }" />
          </div>
          <p class="hint-text">Сохраняет все файлы текущего раздела для доступа без интернета.</p>
        </div>
      </div>
    </div>
  </KitDropdown>
</template>


<style lang="scss" scoped>
.menu-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--fg-muted-color);
  font-weight: 600;
  padding: 0 8px 4px;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;

  &:hover {
    background-color: var(--bg-hover-color);
  }
}

.item-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--fg-primary-color);
}

.item-icon {
  font-size: 1.1rem;
  color: var(--fg-secondary-color);
}

.value-text {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
}

.divider {
  height: 1px;
  background-color: var(--border-secondary-color);
  margin: 4px 0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
}

.menu-action-btn {
  justify-content: flex-start !important;
  width: 100%;
  padding-left: 8px;
  font-weight: 500;

  .btn-icon {
    margin-right: 8px;
    font-size: 1.1rem;
  }
}

.cache-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.progress-bar {
  height: 4px;
  background-color: var(--bg-tertiary-color);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background-color: var(--fg-accent-color);
  transition: width 0.3s ease;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  padding: 0 4px;
  line-height: 1.3;
}
</style>
