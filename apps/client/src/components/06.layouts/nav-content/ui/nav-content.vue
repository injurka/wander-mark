<script lang="ts" setup>
import { ref, watchEffect, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useEventListener, useSwipe } from '@vueuse/core'
import { PageLoader } from '~/components/02.shared/page-loader'
import { ContentViewerHeader, ContentViewerNavigation, useContentViewerStore } from '~/components/05.modules/content-viewer'
import SearchModal from '~/components/05.modules/content-viewer/ui/search-modal.vue'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { useVaultService } from '~/shared/services/vault.service'
import { isNative } from '~/shared/services/fs.client'

import { PluginSlot, PluginManagerDialog } from '~/components/02.shared/plugins'
import { usePluginStore } from '~/components/02.shared/plugins/store'
import { useToast } from '~/shared/composables/use-toast'
import { useConfirm } from '~/shared/composables/use-confirm'

const params = useTypedRouteParams()
const contentViewerStore = useContentViewerStore()
const vaultService = useVaultService()
const route = useRoute()
const router = useRouter()

const pluginStore = usePluginStore()
const pluginsDialogOpen = ref(false)

const { showToast } = useToast()
const { confirm } = useConfirm()

// Если мы заходим сразу на страницу хранилища, скрываем меню
const menu = ref(route.name !== 'VaultIndex')
const searchOpen = ref(false)
const scrollableRef = ref<HTMLElement | null>(null)
const mainAreaRef = ref<HTMLElement | null>(null)
const isSwipingOnScrollable = ref(false)

// Следим за роутом: скрываем на главной, раскрываем при переходе в документы (на десктопах)
watch(() => route.name, (newName, oldName) => {
  if (newName === 'VaultIndex') {
    menu.value = false
  } else if (oldName === 'VaultIndex' && typeof window !== 'undefined' && window.innerWidth >= 768) {
    menu.value = true
  }
})

const isHeaderVisible = ref(true)
const lastScrollTop = ref(0)
const scrollThreshold = 50
const status = ref<'pending' | 'success'>('pending')
const data = ref<{nav: any, settings: any, backlinks: any, searchIndex: any}>({ nav:[], settings: null, backlinks: null, searchIndex:[] })

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

    const[navRes, settingsRes, backlinksRes, searchRes] = await Promise.all([
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

const resolveAppUrl = async (vaultConfig: any, path: string) => {
  if (path.startsWith('http') || path.startsWith('data:')) return path
  
  const cleanPath = path.replace(/^\//, '')

  if (vaultConfig.type === 'local' && vaultConfig.localPath) {
    return await vaultService.getMediaUrl(`${vaultConfig.localPath}/${cleanPath}`, true)
  }

  if (vaultConfig.isDownloaded) {
    if (isNative) {
      return await vaultService.getMediaUrl(`vaults/${params.value.vault}/${cleanPath}`)
    } else {
      const content = await vaultService.getFileContent(vaultConfig.id, cleanPath)
      if (content) {
        const mimeType = cleanPath.endsWith('.css') ? 'text/css' : 'application/javascript'
        const blob = new Blob([content], { type: mimeType })
        return URL.createObjectURL(blob)
      }
    }
  }

  return `${vaultConfig.url}/${cleanPath}`
}

watch(() => data.value.settings, async (settings) => {
  if (!settings) {
    localScripts.value =[]
    localStyles.value =[]
    return
  }
  const vault = vaultService.getVault(params.value.vault)
  if (!vault) return

  localScripts.value = await Promise.all((settings.scripts ||[]).map(async (src: string) => ({
    src: await resolveAppUrl(vault, `meta/${params.value.vault}/${src}`), defer: true
  })))
  localStyles.value = await Promise.all((settings.styles ||[]).map(async (href: string) => ({
    rel: 'stylesheet', href: await resolveAppUrl(vault, `meta/${params.value.vault}/${href}`)
  })))
}, { immediate: true })

useHead(() => ({
  script: localScripts.value,
  link: localStyles.value
}))

watch(() => route.path, () => scrollableRef.value?.scrollTo({ top: 0, behavior: 'instant' }))

watch(() =>[params.value.vault, data.value.settings] as const, async ([vault, settings]) => {
  if (!vault || status.value === 'pending') return

  const vaultConfig = vaultService.getVault(vault)
  if (!vaultConfig) return

  await pluginStore.init(vault, {
    vaultId: vault,
    vaultUrl: vaultConfig.url || '',
    searchIndex: data.value.searchIndex,
    navItems: data.value.nav,
    router,
    getFileContent: (path: string) => vaultService.getFileContent(vault, path),
    showToast,
    confirm,
  })

  if (settings?.plugins && Array.isArray(settings.plugins)) {
    for (const p of settings.plugins) {
      const pId = typeof p === 'string' ? p : p.id;
      const pUrl = typeof p === 'string' ? p : p.url;
      const enabledByDefault = typeof p === 'string' ? true : (p.enabledByDefault ?? true);

      if (!pUrl) continue;

      const pluginUrl = await resolveAppUrl(vaultConfig, pUrl);

      const alreadyInstalled = pluginStore.plugins.some(
        installed => installed.id === pId || installed.sourceUrl === pluginUrl
      );

      if (!alreadyInstalled) {
        try {
          await pluginStore.install(pluginUrl, enabledByDefault);
        } catch (e) {
          console.warn(`[nav-content] Failed to auto-install plugin "${pId || pUrl}":`, e);
        }
      }
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="layout-container">
    <PageLoader v-if="status === 'pending'" />
    <div v-else class="layout-content">
      <ContentViewerNavigation v-model:menu="menu" :items="data.nav" />
      <main ref="mainAreaRef" class="main-area">
        <ContentViewerHeader 
          :menu="menu" 
          :visible="isHeaderVisible" 
          @update:menu="menu = $event" 
          @open-search="searchOpen = true"
          @open-plugins="pluginsDialogOpen = true"
        >
          <template #toolbar-extra>
            <PluginSlot name="toolbar" />
          </template>
        </ContentViewerHeader>
        <div ref="scrollableRef" class="content-scrollable" :class="{ borderless: contentViewerStore.borderlessViewEnabled }">
          <PluginSlot name="content-before" />
          <router-view />
          <PluginSlot name="content-after" />
        </div>
      </main>
      <SearchModal v-model="searchOpen" />

      <PluginSlot name="overlay" />

      <PluginManagerDialog v-model:visible="pluginsDialogOpen" />
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
    @include media-down(md) {
      padding: 0;
    }
  }
}
</style>
