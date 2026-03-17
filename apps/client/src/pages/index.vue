<script setup lang="ts">
import { useRouter } from 'vue-router'
import { KitBtn } from '~/components/01.kit'
import { InteractiveGridPattern } from '~/components/02.shared/interactive-grid-pattern'
import { useVaultService } from '~/shared/services/vault.service'
import { isTauri } from '~/shared/services/fs.client'

const router = useRouter()
const vaultService = useVaultService()

function navigateTo(path: string) {
  router.push(path)
}

function addRemote() {
  const url = prompt('Введите URL сервера (например, https://cms.example.com)')
  const name = prompt('Введите название хранилища')
  const id = name?.toLowerCase().replace(/\s+/g, '-')
  if (url && name && id) {
    vaultService.addRemoteVault(id, name, url)
  }
}

async function addLocal() {
  const name = prompt('Введите название для локального хранилища')
  const id = name?.toLowerCase().replace(/\s+/g, '-')
  if (name && id) {
    await vaultService.addLocalVault(id, name)
  }
}
</script>

<template>
  <div class="landing-page">
    <InteractiveGridPattern class="background-pattern" :width="60" :height="60" :squares="[50, 30]" />
    <div class="container">
      <div class="hero-section">
        <h1 class="title">База знаний <span class="text-accent">WanderingMark</span></h1>
        <p class="subtitle">Выберите хранилище для начала работы</p>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <KitBtn @click="addRemote">Добавить удаленное</KitBtn>
          <KitBtn v-if="isTauri" variant="tonal" @click="addLocal">Открыть локальную папку</KitBtn>
        </div>
      </div>
      
      <div class="grid">
        <div v-for="item in vaultService.vaults.value" :key="item.id" class="card" @click="navigateTo(`/${item.id}`)">
          <div class="card-content">
            <h2 class="card-title">{{ item.name }}</h2>
            <p class="card-desc">Тип: {{ item.type === 'remote' ? 'Удаленное' : 'Локальное' }}</p>
          </div>
          <div class="card-footer">
            <span class="learn-more">Перейти</span>
            <KitBtn variant="tonal" icon="mdi:arrow-right" size="sm" class="action-btn" />
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
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
}

.background-pattern {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  opacity: 0.6; 
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  padding: 80px 20px;
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
  letter-spacing: -0.02em;

  .text-accent {
    color: var(--fg-accent-color);
    background: linear-gradient(120deg, var(--fg-accent-color), var(--fg-highlight-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.subtitle {
  color: var(--fg-secondary-color);
  font-size: 1.2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.card {
  background-color: rgba(var(--bg-secondary-color-rgb), 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    border-color: var(--fg-accent-color);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
    background-color: var(--bg-secondary-color); 

    .icon-wrapper {
      transform: scale(1.1) rotate(5deg);
      background-color: var(--bg-tertiary-color);
    }

    .action-btn {
      background-color: var(--fg-accent-color);
      color: var(--bg-primary-color);
    }
  }
}

.card-content {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background-color: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition:
    transform 0.3s ease,
    background-color 0.3s;
}

.card-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  margin: 0 0 12px;
}

.card-desc {
  color: var(--fg-secondary-color);
  font-size: 0.95rem;
  line-height: 1.6;
}

.card-footer {
  padding: 20px 32px;
  border-top: 1px solid var(--border-secondary-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(var(--bg-tertiary-color-rgb), 0.3);
}

.learn-more {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  .container {
    padding: 40px 16px;
  }
}
</style>
