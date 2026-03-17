<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { KitBtn, KitDialog, KitInput } from '~/components/01.kit'
import { InteractiveGridPattern } from '~/components/02.shared/interactive-grid-pattern'
import { useVaultManagement } from '../composables/use-vault-management'

const {
  vaults,
  progressMap,
  installingMap,
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
    
    <div class="container">
      <div class="hero-section">
        <h1 class="title">База знаний <span class="text-accent">WanderingMark</span></h1>
        <p class="subtitle">Управляйте вашими удаленными хранилищами</p>
        
        <div class="action-buttons">
          <KitBtn prepend-icon="mdi:cloud-plus" @click="openAddDialog">Добавить хранилище</KitBtn>
        </div>
      </div>

      <div v-if="vaults.length > 0" class="section">
        <h2 class="section-title"><Icon icon="mdi:server-network" class="mr-2"/> Ваши хранилища</h2>
        <div class="vault-list">
          <div v-for="vault in vaults" :key="vault.id" class="vault-item">
            <div class="vault-info" @click="openVault(vault.id)">
              <Icon :icon="vault.isDownloaded ? 'mdi:database-check-outline' : 'mdi:cloud-outline'" class="vault-icon" :class="{ 'ready': vault.isDownloaded }" />
              <div>
                <h3 class="vault-name">{{ vault.name }}</h3>
                <p class="vault-url">{{ vault.url }}</p>
              </div>
            </div>

            <div v-if="installingMap[vault.id]" class="install-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progressMap[vault.id]}%` }" />
              </div>
              <span class="progress-text">{{ progressMap[vault.id] }}%</span>
            </div>

            <div v-else class="vault-actions">
              <KitBtn v-if="!vault.isDownloaded" variant="tonal" size="sm" @click="handleInstall(vault.id)">Скачать</KitBtn>
              <KitBtn v-else variant="text" size="sm" icon="mdi:refresh" title="Переустановить" @click="handleInstall(vault.id)" />
              <KitBtn variant="text" color="secondary" size="sm" icon="mdi:delete-outline" title="Удалить" @click="confirmDelete(vault.id)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <KitDialog v-model:visible="isAddDialogVisible" title="Добавить хранилище" icon="mdi:cloud-plus" :max-width="500">
      <div class="form-content">
        <div v-if="addError" class="alert-error">
          <Icon icon="mdi:alert-circle-outline" class="mr-2" />
          <span>{{ addError }}</span>
        </div>
        
        <div class="form-group">
          <label>ID хранилища</label>
          <p class="input-hint">Точное имя папки на сервере, например, Chinese</p>
          <KitInput v-model="addForm.id" placeholder="Chinese" />
        </div>
        
        <div class="form-group">
          <label>Название</label>
          <p class="input-hint">Понятное название для отображения</p>
          <KitInput v-model="addForm.name" placeholder="Chinese Base" />
        </div>
        
        <div class="form-group">
          <label>URL сервера</label>
          <p class="input-hint">Базовый URL, откуда качать данные</p>
          <KitInput v-model="addForm.url" placeholder="https://md.chinisik.ru/local-files" />
        </div>
      </div>

      <template #footer>
        <KitBtn variant="text" color="secondary" @click="isAddDialogVisible = false">Отмена</KitBtn>
        <KitBtn @click="submitAddRemote">Добавить</KitBtn>
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
        <KitBtn variant="text" color="secondary" @click="isDeleteDialogVisible = false">Отмена</KitBtn>
        <KitBtn color="primary" @click="proceedDelete">Удалить</KitBtn>
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
        <KitBtn @click="isErrorDialogVisible = false">OK</KitBtn>
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
  position: fixed; top: 0; left: 0; z-index: 0; opacity: 0.8;
}
.container {
  position: relative; z-index: 1; max-width: 900px;
  margin: 0 auto; padding: 80px 20px;
  display: flex; flex-direction: column; gap: 60px;
}
.hero-section {
  text-align: center; max-width: 700px; margin: 0 auto;
}
.title {
  color: var(--fg-primary-color); font-size: 3rem; font-weight: 800;
  margin-bottom: 16px; line-height: 1.2;
  .text-accent {
    color: var(--fg-accent-color);
  }
}
.subtitle {
  color: var(--fg-secondary-color); font-size: 1.2rem;
}
.action-buttons {
  margin-top: 30px; display: flex; gap: 12px; justify-content: center;
}
.section {
  display: flex; flex-direction: column; gap: 16px;
}
.section-title {
  font-size: 1.5rem; font-weight: 700; color: var(--fg-primary-color);
  display: flex; align-items: center; margin: 0;
  border-bottom: 1px solid var(--border-secondary-color); padding-bottom: 12px;
}
.vault-list {
  display: flex; flex-direction: column; gap: 8px;
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
}
.vault-info {
  display: flex; align-items: center; gap: 16px;
  flex: 1; min-width: 0; cursor: pointer;
}
.vault-icon {
  font-size: 2rem; color: var(--fg-muted-color); flex-shrink: 0;
  &.ready { color: var(--fg-accent-color); }
}
.vault-name {
  font-size: 1.1rem; font-weight: 600; color: var(--fg-primary-color); margin: 0 0 2px;
}
.vault-url {
  font-size: 0.85rem; color: var(--fg-secondary-color); margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vault-actions {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.install-progress {
  display: flex; align-items: center; gap: 12px; width: 150px;
}
.progress-bar {
  flex: 1; height: 6px; background-color: var(--bg-primary-color);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; background-color: var(--fg-accent-color);
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 0.8rem; font-weight: 600; color: var(--fg-accent-color);
}
.mr-2 { margin-right: 8px; }
.custom-scrollbar {
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
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
</style>
