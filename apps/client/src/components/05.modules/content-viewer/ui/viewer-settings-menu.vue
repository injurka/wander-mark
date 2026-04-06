<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { KitBtn, KitCheckbox, KitDropdown } from '~/components/01.kit'
import { ThemesVariant, useChangeTheme } from '~/shared/composables/use-change-theme'
import { useLocale } from '~/shared/composables/use-locale'
import { useContentViewerStore } from '../store'

const props = defineProps<{ vault: string }>()

const emit = defineEmits<{
  (e: 'openPlugins'): void
}>()

const { setTheme, theme } = useChangeTheme()
const contentViewerStore = useContentViewerStore()
const dropdownRef = ref<InstanceType<typeof KitDropdown> | null>(null)

const { currentLocale, cycleLanguage, languageNames, t } = useLocale()

const currentThemeIcon = computed(() =>
  theme.value === ThemesVariant.Light ? 'mdi:weather-sunny' : 'mdi:weather-night',
)

function toggleTheme() {
  setTheme(theme.value === ThemesVariant.Light ? ThemesVariant.Dark : ThemesVariant.Light)
}

function handleOpenPlugins() {
  emit('openPlugins')
  dropdownRef.value?.close()
}
</script>

<template>
  <KitDropdown ref="dropdownRef" :width="280" :close-on-content-click="false">
    <template #activator>
      <KitBtn
        variant="text"
        size="sm"
        icon="mdi:dots-vertical"
        title="Настройки"
      />
    </template>

    <div class="menu-content">
      <div class="divider" />

      <div class="menu-section">
        <div class="section-title">
          {{ t('settings.appearance') }}
        </div>
        <div class="menu-item" @click="toggleTheme">
          <div class="item-label">
            <Icon :icon="currentThemeIcon" class="item-icon" />
            <span>{{ t('settings.theme') }}</span>
          </div>
          <span class="value-text">{{ theme === 'light' ? t('settings.themeLight') : t('settings.themeDark') }}</span>
        </div>
        <!-- Выбор языка -->
        <div class="menu-item" @click="cycleLanguage">
          <div class="item-label">
            <Icon icon="mdi:translate" class="item-icon" />
            <span>{{ t('settings.language') }}</span>
          </div>
          <span class="value-text">{{ languageNames[currentLocale] }}</span>
        </div>
      </div>

      <div class="divider" />

      <div class="menu-section">
        <div class="section-title">
          {{ t('settings.interface') }}
        </div>
        <div class="settings-group">
          <KitCheckbox v-model="contentViewerStore.pinHeaderEnabled" :label="t('settings.pinHeader')" />
          <KitCheckbox v-model="contentViewerStore.borderlessViewEnabled" :label="t('settings.borderless')" />
          <KitCheckbox v-model="contentViewerStore.coloredFoldersEnabled" :label="t('settings.coloredFolders')" />
          <KitCheckbox v-model="contentViewerStore.showIconsEnabled" :label="t('settings.showIcons')" />
          <KitCheckbox v-model="contentViewerStore.showOutlineEnabled" :label="t('settings.showOutline')" />
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="handleOpenPlugins">
          <div class="item-label">
            <Icon icon="mdi:puzzle-outline" class="item-icon" />
            <span>{{ t('settings.plugins') }}</span>
          </div>
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
  gap: 8px;
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
  padding: 4px 8px;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
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
  gap: 12px;
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  font-weight: 500;
}

.item-icon {
  font-size: 1.2rem;
  color: var(--fg-secondary-color);
}

.value-text {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
}

.divider {
  height: 1px;
  background-color: var(--border-secondary-color);
  margin: 0 4px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 8px 8px;
}
</style>
