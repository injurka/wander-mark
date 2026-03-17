<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContentViewer, ContentViewerFooter, useContentViewerStore } from '~/components/05.modules/content-viewer'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { useVaultService } from '~/shared/services/vault.service'

const store = useContentViewerStore()
const params = useTypedRouteParams()
const vaultService = useVaultService()

const contentData = ref<string>('')
const status = ref<'pending' | 'success' | 'error'>('pending')

watch(params, async () => {
  status.value = 'pending'
  try {
    const path = params.value.pwd.join('/')
    const content = await vaultService.getFileContent(params.value.vault, `content/${params.value.vault}/${path}.md`)
    
    if (content) {
      contentData.value = content
      status.value = 'success'
    } else {
      throw new Error('Not found')
    }
  } catch (e) {
    contentData.value = ''
    status.value = 'error'
  }
}, { immediate: true })
</script>

<template>
  <div class="page-wrapper">
    <div v-if="status === 'pending'" class="loading-state">
      <div class="loading-text">Загрузка...</div>
    </div>

    <template v-else-if="status === 'success' && contentData">
      <ContentViewer :content="contentData" image-base-path="" :vault="params.vault" />
      <ContentViewerFooter :vault="params.vault" :current-item-path="params.pwd.join('/')" :items="store.navItems" />
    </template>

    <div v-else class="empty-state">
      <div class="alert">
        <h3>Страница не найдена или недоступна</h3>
        <p>Возможно, вы находитесь офлайн и файл не скачан, либо страница была перемещена.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  width: 100%;
}
.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--fg-muted-color);
}
.empty-state {
  padding: 40px;
  display: flex;
  justify-content: center;
}
.alert {
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid var(--fg-accent-color);
}
</style>
