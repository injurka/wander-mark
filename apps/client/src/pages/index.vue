<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { KitBtn } from '~/components/01.kit'
import { InteractiveGridPattern } from '~/components/02.shared/interactive-grid-pattern'
import { useVaultService } from '~/shared/services/vault.service'

const router = useRouter()
const vaultService = useVaultService()

const progressMap = ref<Record<string, number>>({})
const installingMap = ref<Record<string, boolean>>({})

// --- Методы добавления ---
async function handleAddRemote() {
  const id = prompt('Введите ID хранилища (точное имя папки на сервере, например, Chinese)')
  if (!id) return
  const name = prompt('Введите понятное название для отображения (например, Chinese Base)', id)
  if (!name) return
  const url = prompt('Введите базовый URL сервера (например, https://md.chinisik.ru/local-files)')
  if (!url) return

  try {
    await vaultService.addRemoteVault(id, name, url)
  } catch (e: any) {
    alert(`Ошибка: ${e.message}`)
  }
}

// --- Методы управления ---
async function handleInstall(vaultId: string) {
  if (installingMap.value[vaultId]) return
  installingMap.value[vaultId] = true
  progressMap.value[vaultId] = 0

  try {
    await vaultService.installVault(vaultId, (p) => {
      progressMap.value[vaultId] = p
    })
  } catch (e: any) {
    alert(`Ошибка при скачивании: ${e.message}`)
  } finally {
    setTimeout(() => {
      installingMap.value[vaultId] = false
    }, 1000)
  }
}

async function handleDelete(vaultId: string) {
  if(confirm('Вы уверены, что хотите удалить это хранилище и все его скачанные файлы?')) {
    await vaultService.deleteVault(vaultId)
  }
}

function openVault(vaultId: string) {
  const vault = vaultService.getVault(vaultId)
  if (vault) {
    router.push(`/${vaultId}`)
  }
}
</script>

<template>
  <div class="landing-page custom-scrollbar">
    <InteractiveGridPattern class="background-pattern" :width="60" :height="60" :squares="[50, 30]" />
    
    <div class="container">
      <div class="hero-section">
        <h1 class="title">База знаний <span class="text-accent">WanderingMark</span></h1>
        <p class="subtitle">Управляйте вашими удаленными хранилищами</p>
        
        <div class="action-buttons">
          <KitBtn prepend-icon="mdi:cloud-plus" @click="handleAddRemote">Добавить хранилище</KitBtn>
        </div>
      </div>

      <!-- Удаленные хранилища -->
      <div v-if="vaultService.vaults.value.length > 0" class="section">
        <h2 class="section-title"><Icon icon="mdi:server-network" class="mr-2"/> Ваши хранилища</h2>
        <div class="vault-list">
          <div v-for="vault in vaultService.vaults.value" :key="vault.id" class="vault-item">
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
              <KitBtn variant="text" color="secondary" size="sm" icon="mdi:delete-outline" title="Удалить" @click="handleDelete(vault.id)" />
            </div>
          </div>
        </div>
      </div>

    </div>
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
.mono-path { font-family: 'Maple Mono CN', monospace; }
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
</style>
