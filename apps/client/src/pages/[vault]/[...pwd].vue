<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContentViewer, ContentViewerFooter, useContentViewerStore } from '~/components/05.modules/content-viewer'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { useVaultStore } from '~/shared/store/vault.store'

const store = useContentViewerStore()
const params = useTypedRouteParams()
const vaultStore = useVaultStore()
const { t } = useI18n()

const contentData = ref<string>('')
const status = ref<'pending' | 'success' | 'error'>('pending')
const isReady = ref(false)

watch(params, async (newParams, _oldParams, onCleanup) => {
  let isCancelled = false
  onCleanup(() => {
    isCancelled = true
  })

  status.value = 'pending'
  isReady.value = false

  try {
    const path = newParams.pwd.join('/')
    const content = await vaultStore.getFileContent(newParams.vault, `content/${newParams.vault}/${path}.md`)

    if (isCancelled)
      return

    if (content) {
      contentData.value = content
      status.value = 'success'
    }
    else {
      throw new Error('Not found')
    }
  }
  catch {
    if (isCancelled)
      return
    contentData.value = ''
    status.value = 'error'
  }
}, { immediate: true })
</script>

<template>
  <div class="page-wrapper">
    <Transition name="fade" mode="out-in">
      <div v-if="status === 'pending'" class="loading-state">
        <div class="loading-text">
          {{ t('page.loading') }}
        </div>
      </div>

      <div v-else-if="status === 'success' && contentData" class="content-success">
        <ContentViewer
          :content="contentData"
          image-base-path=""
          :vault="params.vault"
          @ready="isReady = true"
        />

        <Transition name="content-appear">
          <ContentViewerFooter
            v-if="isReady"
            :vault="params.vault"
            :current-item-path="params.pwd.join('/')"
            :items="store.navItems"
          />
        </Transition>
      </div>

      <div v-else class="empty-state">
        <div class="alert">
          <h3>{{ t('page.notFound') }}</h3>
          <p>{{ t('page.notFoundDesc') }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page-wrapper {
  width: 100%;
  min-height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
}

.content-success {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
