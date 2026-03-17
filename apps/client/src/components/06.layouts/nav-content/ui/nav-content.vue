--- File: src/components/06.layouts/nav-content/ui/nav-content.vue ---

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
import { isNative } from '~/shared/services/fs.client'

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
      nav: navRes ||[],
      settings: settingsRes,
      backlinks: backlinksRes,
      searchIndex: searchRes ||[],
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

const localScripts = ref<any[]>([])
const localStyles = ref<any[]>([])

watch(() => data.value.settings, async (settings) => {
  if (!settings) {
    localScripts.value = []
    localStyles.value =[]
    return
  }
  const vault = vaultService.getVault(params.value.vault)
  if (!vault) return

  const resolveUrl = async (path: string) => {
    if (path.startsWith('http') || path.startsWith('data:')) return path
    
    if (vault.type === 'local' && vault.localPath) {
      return await vaultService.getMediaUrl(`${vault.localPath}/meta/${params.value.vault}/${path}`, true)
    }

    if (vault.isDownloaded) {
      if (isNative) {
        return await vaultService.getMediaUrl(`vaults/${params.value.vault}/meta/${params.value.vault}/${path}`)
      } else {
        const content = await vaultService.getFileContent(vault.id, `meta/${params.value.vault}/${path}`)
        if (content) {
          const mimeType = path.endsWith('.css') ? 'text/css' : 'application/javascript'
          const blob = new Blob([content], { type: mimeType })
          return URL.createObjectURL(blob)
        }
      }
    }

    return `${vault.url}/meta/${params.value.vault}/${path}`
  }

  localScripts.value = await Promise.all((settings.scripts ||[]).map(async (src: string) => ({
    src: await resolveUrl(src), defer: true
  })))
  localStyles.value = await Promise.all((settings.styles ||[]).map(async (href: string) => ({
    rel: 'stylesheet', href: await resolveUrl(href)
  })))
}, { immediate: true })

useHead(() => ({
  script: localScripts.value,
  link: localStyles.value
}))

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
