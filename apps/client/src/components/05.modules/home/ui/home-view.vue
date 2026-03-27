<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { KitBtn, KitDialog, KitInput } from '~/components/01.kit'
import { InteractiveGridPattern } from '~/components/02.shared/interactive-grid-pattern'
import { ThemesVariant, useChangeTheme } from '~/shared/composables/use-change-theme'
import { useLocale } from '~/shared/composables/use-locale'
import { useVaultManagement } from '../composables/use-vault-management'

const { t } = useI18n()
const { currentLocale, cycleLanguage, languageNames } = useLocale()
const { theme, setTheme } = useChangeTheme()

const currentThemeIcon = computed(() =>
  theme.value === ThemesVariant.Light ? 'mdi:weather-sunny' : 'mdi:weather-night',
)

function toggleTheme() {
  setTheme(theme.value === ThemesVariant.Light ? ThemesVariant.Dark : ThemesVariant.Light)
}

const version = __APP_VERSION__
const buildDateFormatted = computed(() => {
  const date = new Date(__BUILD_DATE__)
  return date.toLocaleString(currentLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const {
  vaults,
  progressMap,
  installingMap,
  iconUrls,
  iconErrors,
  handleIconError,
  isAddDialogVisible,
  addError,
  addForm,
  isErrorDialogVisible,
  errorMessage,
  isDeleteDialogVisible,
  openAddDialog,
  submitAddRemote,
  confirmDelete,
  proceedDelete,
  handleInstall,
  openVault,
} = useVaultManagement()
</script>

<template>
  <div class="landing-page custom-scrollbar">
    <InteractiveGridPattern class="background-pattern" :width="60" :height="60" :squares="[50, 30]" />

    <!-- Панель настроек на главной -->
    <header class="home-header">
      <div class="settings-actions">
        <KitBtn
          variant="text"
          :icon="currentThemeIcon"
          :title="t('settings.theme')"
          @click="toggleTheme"
        />
        <KitBtn
          variant="text"
          prepend-icon="mdi:translate"
          :title="t('settings.language')"
          @click="cycleLanguage"
        >
          {{ languageNames[currentLocale] }}
        </KitBtn>
      </div>
    </header>

    <div class="container">
      <div class="hero-section">
        <h1 class="title">
          {{ t('home.title') }} <span class="text-accent">WanderingMark</span>
        </h1>
        <p class="subtitle">
          {{ t('home.subtitle') }}
        </p>

        <div class="action-buttons">
          <KitBtn prepend-icon="mdi:cloud-plus" @click="openAddDialog">
            {{ t('home.addVault') }}
          </KitBtn>
        </div>
      </div>

      <div v-if="vaults.length > 0" class="section">
        <h2 class="section-title">
          <Icon icon="mdi:server-network" class="mr-2" /> {{ t('home.yourVaults') }}
        </h2>
        <div class="vault-list">
          <div v-for="vault in vaults" :key="vault.id" class="vault-item">
            <div class="vault-info" @click="openVault(vault.id)">
              <div class="vault-icon-wrapper">
                <img
                  v-if="iconUrls[vault.id] && !iconErrors[vault.id]"
                  :src="iconUrls[vault.id]"
                  class="vault-image-icon"
                  alt="icon"
                  @error="handleIconError(vault.id)"
                >
                <Icon
                  v-else
                  :icon="vault.isDownloaded ? 'mdi:database-check-outline' : 'mdi:cloud-outline'"
                  class="vault-icon"
                  :class="{ ready: vault.isDownloaded }"
                />
              </div>

              <div class="vault-text-content">
                <h3 class="vault-name" :title="vault.title || vault.name">
                  {{ vault.title || vault.name }}
                </h3>
                <p class="vault-url" :title="vault.description || vault.url">
                  {{ vault.description || vault.url }}
                </p>
              </div>
            </div>

            <div v-if="installingMap[vault.id]" class="install-progress-circle">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path
                  class="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="circle"
                  :stroke-dasharray="`${progressMap[vault.id] || 0}, 100`"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span class="percentage">{{ progressMap[vault.id] || 0 }}</span>
            </div>

            <div v-else class="vault-actions">
              <template v-if="!vault.isDownloaded">
                <KitBtn class="btn-download-desktop" variant="tonal" size="sm" @click="handleInstall(vault.id)">
                  {{ t('home.download') }}
                </KitBtn>
                <KitBtn class="btn-download-mobile" variant="tonal" size="sm" icon="mdi:download" :title="t('home.download')" @click="handleInstall(vault.id)" />
              </template>

              <KitBtn v-else variant="text" size="sm" icon="mdi:refresh" :title="t('home.reinstall')" @click="handleInstall(vault.id)" />
              <KitBtn variant="text" color="secondary" size="sm" icon="mdi:delete-outline" :title="t('home.delete')" @click="confirmDelete(vault.id)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-build-info">
      v{{ version }} ({{ buildDateFormatted }})
    </div>

    <KitDialog v-model:visible="isAddDialogVisible" :title="t('home.addDialogTitle')" icon="mdi:cloud-plus" :max-width="500">
      <div class="form-content">
        <div v-if="addError" class="alert-error">
          <Icon icon="mdi:alert-circle-outline" class="mr-2" />
          <span>{{ addError }}</span>
        </div>

        <div class="form-group">
          <label>{{ t('home.vaultId') }}</label>
          <p class="input-hint">
            {{ t('home.vaultIdHint') }}
          </p>
          <KitInput v-model="addForm.id" placeholder="Chinese" />
        </div>

        <div class="form-group">
          <label>{{ t('home.serverUrl') }}</label>
          <p class="input-hint">
            {{ t('home.serverUrlHint') }}
          </p>
          <KitInput v-model="addForm.url" placeholder="https://md.chinisik.ru/local-files" />
        </div>
      </div>

      <template #footer>
        <KitBtn variant="text" color="secondary" @click="isAddDialogVisible = false">
          {{ t('home.cancel') }}
        </KitBtn>
        <KitBtn @click="submitAddRemote">
          {{ t('home.add') }}
        </KitBtn>
      </template>
    </KitDialog>

    <KitDialog
      v-model:visible="isDeleteDialogVisible"
      title="Удаление хранилища"
      description="Вы уверены, что хотите удалить это хранилище и все его скачанные файлы?"
      icon="mdi:delete-outline"
      :max-width="400"
    >
      <template #footer>
        <KitBtn variant="text" color="secondary" @click="isDeleteDialogVisible = false">
          {{ t('home.cancel') }}
        </KitBtn>
        <KitBtn color="primary" @click="proceedDelete">
          {{ t('home.delete') }}
        </KitBtn>
      </template>
    </KitDialog>

    <KitDialog
      v-model:visible="isErrorDialogVisible"
      title="Ошибка"
      :description="errorMessage"
      icon="mdi:alert-circle-outline"
      :max-width="450"
    >
      <template #footer>
        <KitBtn @click="isErrorDialogVisible = false">
          OK
        </KitBtn>
      </template>
    </KitDialog>
  </div>
</template>

<style lang="scss" scoped>
.landing-page {
  min-height: 100vh;
  background-color: var(--bg-primary-color);
  position: relative;
  overflow-y: auto;
}
.background-pattern {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  opacity: 0.8;
}
.home-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  z-index: 10;

  @include media-down(sm) {
    padding: 12px 16px;
  }
}
.settings-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(var(--bg-secondary-color-rgb), 0.5);
  backdrop-filter: blur(8px);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--border-secondary-color);
}
.container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 100px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 60px;
}
.hero-section {
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}
.title {
  color: var(--fg-primary-color);
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.2;
  .text-accent {
    color: var(--fg-accent-color);
  }
}
.subtitle {
  color: var(--fg-secondary-color);
  font-size: 1.2rem;
}
.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  display: flex;
  align-items: center;
  margin: 0;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 12px;
}
.vault-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vault-item {
  background-color: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s ease;
  &:hover {
    border-color: var(--fg-accent-color);
  }

  @include media-down(sm) {
    padding: 12px;
    gap: 10px;
  }
}
.vault-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  cursor: pointer;

  @include media-down(sm) {
    gap: 10px;
  }
}

.vault-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @include media-down(sm) {
    width: 36px;
    height: 36px;
  }
}

.vault-image-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.vault-icon {
  font-size: 2.2rem;
  color: var(--fg-muted-color);
  &.ready {
    color: var(--fg-accent-color);
  }

  @include media-down(sm) {
    font-size: 1.8rem;
  }
}

.vault-text-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.vault-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @include media-down(sm) {
    font-size: 1rem;
    margin: 0 0 2px;
  }
}
.vault-url {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @include media-down(sm) {
    font-size: 0.75rem;
  }
}

.install-progress-circle {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0 4px;
}

.circular-chart {
  display: block;
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--bg-tertiary-color);
  stroke-width: 3.5;
}

.circle {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke: var(--fg-accent-color);
  transition: stroke-dasharray 0.3s ease;
}

.percentage {
  position: absolute;
  font-size: 0.65rem;
  font-family: 'Maple Mono CN', monospace;
  font-weight: 600;
  color: var(--fg-primary-color);
}

.vault-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.btn-download-mobile {
  display: none !important;
}

@include media-down(sm) {
  .btn-download-desktop {
    display: none !important;
  }
  .btn-download-mobile {
    display: inline-flex !important;
  }
}

.mr-2 {
  margin-right: 8px;
}
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-color);
    border-radius: 4px;
  }
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--fg-primary-color);
  }
}
.input-hint {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  margin: 0 0 4px 0;
}
.alert-error {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-error-color);
  border: 1px solid var(--border-error-color);
  color: var(--fg-error-color);
  border-radius: 6px;
  font-size: 0.9rem;
}
.app-build-info {
  position: absolute;
  bottom: 12px;
  left: 20px;
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  font-family: 'Maple Mono CN', monospace;
  z-index: 5;
  opacity: 0.6;
  user-select: none;
  pointer-events: none;

  @include media-down(sm) {
    left: 16px;
    bottom: 8px;
    font-size: 0.7rem;
  }
}
</style>
