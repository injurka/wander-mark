<script lang="ts" setup>
import { ref, watchEffect, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useEventListener, useSwipe } from '@vueuse/core'
import { PageLoader } from '~/components/02.shared/page-loader'
import { ContentViewerHeader, ContentViewerNavigation, useContentViewerStore } from '~/components/05.modules/content-viewer'
import SearchModal from '~/components/05.modules/content-viewer/ui/search-modal.vue'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { useVaultService } from '~/shared/services/vault.service'

const params = useTypedRouteParams()
const contentViewerStore = useContentViewerStore()
const vaultService = useVaultService()
const route = useRoute()

const menu = ref(true)
const searchOpen = ref(false)
const scrollableRef = ref<HTMLElement | null>(null)
const mainAreaRef = ref<HTMLElement | null>(null)
const isSwipingOnScrollable = ref(false)

const isHeaderVisible = ref(true)
const lastScrollTop = ref(0)
const scrollThreshold = 50
const status = ref<'pending' | 'success'>('pending')
const data = ref<{nav: any, settings: any, backlinks: any, searchIndex: any}>({ nav: [], settings: null, backlinks: null, searchIndex:[] })

function handleScroll() {
  if (!scrollableRef.value) return
  const scrollTop = scrollableRef.value.scrollTop
  if (scrollTop < scrollThreshold) isHeaderVisible.value = true
  else if (scrollTop < lastScrollTop.value) isHeaderVisible.value = true
  else isHeaderVisible.value = false
  lastScrollTop.value = scrollTop <= 0 ? 0 : scrollTop
}

useSwipe(mainAreaRef, {
  passive: true,
  onSwipeStart: (e) => { isSwipingOnScrollable.value = !!(e.target as HTMLElement).closest('table') },
  onSwipeEnd: (_, direction) => { if (!isSwipingOnScrollable.value && !menu.value && direction === 'right') menu.value = true },
})

useEventListener(scrollableRef, 'scroll', handleScroll)

watch(() => params.value.vault, async (vault) => {
  if (!vault) return
  status.value = 'pending'
  try {
    const parseJson = async (path: string) => {
        const content = await vaultService.getFileContent(vault, path)
        return content ? JSON.parse(content) : null
    }

    const [navRes, settingsRes, backlinksRes, searchRes] = await Promise.all([
        parseJson(`content/${vault}/nav.json`),
        parseJson(`meta/${vault}/settings.json`),
        parseJson(`meta/${vault}/backlinks.json`),
        parseJson(`meta/${vault}/search.json`),
    ])
    
    data.value = {
      nav: navRes || [],
      settings: settingsRes,
      backlinks: backlinksRes,
      searchIndex: searchRes || [],
    }
  } finally {
    status.value = 'success'
  }
}, { immediate: true })

watchEffect(() => {
  contentViewerStore.$patch({
    navItems: data.value.nav,
    vaultSettings: data.value.settings,
    backlinks: data.value.backlinks,
    searchIndex: data.value.searchIndex,
  })
})

useHead(() => {
  const settings = data.value.settings
  if (!settings) return {}

  const vault = vaultService.getVault(params.value.vault)
  if (!vault) return {}

  const vaultBaseUrl = vault.type === 'remote' ? `${vault.url}/meta/${params.value.vault}/` : ''

  return {
    script: (settings.scripts ||[]).map((src: string) => ({
      src: src.startsWith('http') || vault.type === 'local' ? src : `${vaultBaseUrl}${src}`, defer: true
    })),
    link: (settings.styles ||[]).map((href: string) => ({
      rel: 'stylesheet', href: href.startsWith('http') || vault.type === 'local' ? href : `${vaultBaseUrl}${href}`
    }))
  }
})

watch(() => route.path, () => scrollableRef.value?.scrollTo({ top: 0, behavior: 'instant' }))
</script>

<template>
  <div class="layout-container">
    <PageLoader v-if="status === 'pending'" />
    <div v-else class="layout-content">
      <ContentViewerNavigation v-model:menu="menu" :items="data.nav" />
      <main ref="mainAreaRef" class="main-area">
        <ContentViewerHeader :menu="menu" :visible="isHeaderVisible" @update:menu="menu = $event" @open-search="searchOpen = true" />
        <div ref="scrollableRef" class="content-scrollable" :class="{ borderless: contentViewerStore.borderlessViewEnabled }">
          <router-view />
        </div>
      </main>
      <SearchModal v-model="searchOpen" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary-color);
  overflow: hidden;
}

.layout-content {
  display: flex;
  height: 100%;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.content-scrollable {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 50px 0 0 0;

  &.borderless :deep(.content-viewer) {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 40px;
    padding-right: 40px;

    @include mobile {
      padding: 0;
    }
  }
}
</style>
