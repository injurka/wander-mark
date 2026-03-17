<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { KitBtn } from '~/components/01.kit'

const showInstallBanner = ref<boolean>(false)
const showUpdateBanner = ref<boolean>(false)
const { $pwa } = useNuxtApp()

onMounted(() => {
  if ($pwa) {
    if ($pwa.showInstallPrompt && !localStorage.getItem('pwa-dismissed')) {
      showInstallBanner.value = true
    }
    if ($pwa.needRefresh)
      showUpdateBanner.value = true
  }
})

function dismiss() {
  showInstallBanner.value = false
  localStorage.setItem('pwa-dismissed', 'true')
}
</script>

<template>
  <div class="banners-container">
    <div v-if="showInstallBanner" class="banner">
      <div class="banner-content">
        <Icon icon="mdi:cellphone" class="banner-icon" />
        <span>Установите приложение для быстрого доступа!</span>
      </div>
      <div class="banner-actions">
        <KitBtn size="sm" @click="$pwa?.install()">
          Установить
        </KitBtn>
        <KitBtn size="sm" variant="text" icon="mdi:close" @click="dismiss" />
      </div>
    </div>

    <div v-if="showUpdateBanner" class="banner update">
      <div class="banner-content">
        <Icon icon="mdi:refresh" class="banner-icon" />
        <span>Доступно обновление.</span>
      </div>
      <KitBtn size="sm" @click="$pwa?.updateServiceWorker()">
        Обновить
      </KitBtn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banners-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  width: 90%;
  max-width: 400px;
}

.banner {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--s-l);
  gap: 12px;

  &.update {
    border-color: var(--fg-accent-color);
  }
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--fg-primary-color);
}

.banner-actions {
  display: flex;
  gap: 4px;
}

.banner-icon {
  color: var(--fg-accent-color);
}
</style>
