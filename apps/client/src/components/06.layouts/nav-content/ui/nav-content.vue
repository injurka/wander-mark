<script lang="ts" setup>
import { useEventListener, useSwipe } from '@vueuse/core'
import { useHead } from '@vueuse/head'
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { PageLoader } from '~/components/02.shared/page-loader'
import { PluginManagerDialog, PluginSlot } from '~/components/02.shared/plugins'
import { usePluginStore } from '~/components/02.shared/plugins/store'
import { ContentViewerHeader, ContentViewerNavigation, useContentViewerStore } from '~/components/05.modules/content-viewer'
import SearchModal from '~/components/05.modules/content-viewer/ui/search-modal.vue'
import { useConfirm } from '~/shared/composables/use-confirm'
import { useLocale } from '~/shared/composables/use-locale'
import { useToast } from '~/shared/composables/use-toast'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { isNative } from '~/shared/services/fs.client'
import { useVaultStore } from '~/shared/store/vault.store'

const params = useTypedRouteParams()
const contentViewerStore = useContentViewerStore()
const vaultStore = useVaultStore()
const route = useRoute()
const router = useRouter()

const pluginStore = usePluginStore()
const pluginsDialogOpen = ref(false)

const { showToast } = useToast()
const { confirm } = useConfirm()
const { t } = useI18n()
const { currentLocale } = useLocale()

const isSidebarEnabled = computed(() => !route.meta.hideSidebar)

const menu = ref(isSidebarEnabled.value && typeof window !== 'undefined' && window.innerWidth >= 768)
const searchOpen = ref(false)
const scrollableRef = ref<HTMLElement | null>(null)
const mainAreaRef = ref<HTMLElement | null>(null)
const isSwipingOnScrollable = ref(false)

const isHeaderVisible = ref(true)
const lastScrollTop = ref(0)
const scrollThreshold = 50
const status = ref<'pending' | 'success'>('pending')
const data = ref<{ nav: any, settings: any, backlinks: any, searchIndex: any }>({ nav: [], settings: null, backlinks: null, searchIndex: [] })

function handleScroll() {
  if (!scrollableRef.value)
    return

  const el = scrollableRef.value
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight
  const clientHeight = el.clientHeight

  if (contentViewerStore.pinHeaderEnabled) {
    isHeaderVisible.value = true
    lastScrollTop.value = scrollTop
    return
  }

  if (scrollTop <= 0) {
    isHeaderVisible.value = true
    lastScrollTop.value = 0
    return
  }

  if (scrollTop + clientHeight >= scrollHeight - 1) {
    lastScrollTop.value = scrollTop
    return
  }

  if (scrollTop < scrollThreshold)
    isHeaderVisible.value = true
  else if (scrollTop < lastScrollTop.value)
    isHeaderVisible.value = true
  else isHeaderVisible.value = false

  lastScrollTop.value = scrollTop
}

useSwipe(mainAreaRef, {
  passive: true,
  onSwipeStart: (e) => { isSwipingOnScrollable.value = !!(e.target as HTMLElement).closest('table') },
  onSwipeEnd: (_, direction) => {
    // Разрешаем свайп только если сайдбар разрешен
    if (!isSwipingOnScrollable.value && !menu.value && direction === 'right' && isSidebarEnabled.value)
      menu.value = true
  },
})

useEventListener(scrollableRef, 'scroll', handleScroll)

watch(() => route.path, () => {
  if (!isSidebarEnabled.value) {
    menu.value = false
  }
  else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    menu.value = true
  }
  scrollableRef.value?.scrollTo({ top: 0, behavior: 'instant' })
})

watch(() => params.value.vault, async (vault, _oldVault, onCleanup) => {
  if (!vault)
    return

  let isCancelled = false
  onCleanup(() => {
    isCancelled = true
  })

  status.value = 'pending'
  try {
    const parseJson = async (path: string) => {
      const content = await vaultStore.getFileContent(vault, path)
      return content ? JSON.parse(content) : null
    }

    const [navRes, settingsRes, backlinksRes, searchRes] = await Promise.all([
      parseJson(`content/${vault}/nav.json`),
      parseJson(`meta/${vault}/settings.json`),
      parseJson(`meta/${vault}/backlinks.json`),
      parseJson(`meta/${vault}/search.json`),
    ])

    if (isCancelled)
      return

    data.value = {
      nav: navRes || [],
      settings: settingsRes,
      backlinks: backlinksRes,
      searchIndex: searchRes || [],
    }
  }
  finally {
    if (!isCancelled) {
      status.value = 'success'
    }
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
const appObjectUrls = new Set<string>()

function clearAppObjectUrls() {
  appObjectUrls.forEach(url => URL.revokeObjectURL(url))
  appObjectUrls.clear()
}

onBeforeUnmount(() => {
  clearAppObjectUrls()
})

async function resolveAppUrl(vaultConfig: any, path: string) {
  if (path.startsWith('http') || path.startsWith('data:'))
    return path

  const cleanPath = path.replace(/^\//, '')

  if (vaultConfig.type === 'local' && vaultConfig.localPath) {
    return await vaultStore.getMediaUrl(`${vaultConfig.localPath}/${cleanPath}`, true)
  }

  if (vaultConfig.isDownloaded) {
    if (isNative) {
      return await vaultStore.getMediaUrl(`vaults/${params.value.vault}/${cleanPath}`)
    }
    else {
      const content = await vaultStore.getFileContent(vaultConfig.id, cleanPath)
      if (content) {
        const mimeType = cleanPath.endsWith('.css') ? 'text/css' : 'application/javascript'
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        appObjectUrls.add(url)
        return url
      }
    }
  }

  return `${vaultConfig.url}/${cleanPath}`
}

watch(() => data.value.settings, async (settings, _oldSettings, onCleanup) => {
  let isCancelled = false
  onCleanup(() => {
    isCancelled = true
  })

  clearAppObjectUrls()

  if (!settings) {
    localScripts.value = []
    localStyles.value = []
    return
  }
  const vault = vaultStore.getVault(params.value.vault)
  if (!vault)
    return

  const scripts = await Promise.all((settings.scripts || []).map(async (src: string) => ({
    src: await resolveAppUrl(vault, `meta/${params.value.vault}/${src}`),
    defer: true,
  })))

  const styles = await Promise.all((settings.styles || []).map(async (href: string) => ({
    rel: 'stylesheet',
    href: await resolveAppUrl(vault, `meta/${params.value.vault}/${href}`),
  })))

  if (isCancelled)
    return

  localScripts.value = scripts
  localStyles.value = styles
}, { immediate: true })

useHead(() => ({
  script: localScripts.value,
  link: localStyles.value,
}))

watch(() => [params.value.vault, data.value.settings] as const, async ([vault, settings], _oldVal, onCleanup) => {
  let isCancelled = false
  onCleanup(() => {
    isCancelled = true
  })

  if (!vault || status.value === 'pending')
    return

  const vaultConfig = vaultStore.getVault(vault)
  if (!vaultConfig)
    return

  await pluginStore.init(vault, {
    vaultId: vault,
    vaultUrl: vaultConfig.url || '',
    searchIndex: data.value.searchIndex,
    navItems: data.value.nav,
    router,
    getFileContent: (path: string) => vaultStore.getFileContent(vault, path),
    showToast,
    confirm,
    locale: currentLocale,
    t,
  })

  if (isCancelled)
    return

  const configPluginIds = new Set<string>()

  if (settings?.plugins && Array.isArray(settings.plugins)) {
    for (const p of settings.plugins) {
      if (isCancelled)
        return

      const pId = typeof p === 'string' ? p : p.id
      const pUrl = typeof p === 'string' ? p : p.url
      const enabledByDefault = typeof p === 'string' ? true : (p.enabledByDefault ?? true)

      if (!pUrl)
        continue

      if (isCancelled)
        return

      const alreadyInstalled = pluginStore.plugins.find(
        installed => installed.id === pId || installed.sourceUrl === pUrl,
      )

      if (!alreadyInstalled) {
        try {
          const newPlugin = await pluginStore.install(pUrl, enabledByDefault, false)
          configPluginIds.add(newPlugin.id)
        }
        catch (e) {
          console.warn(`[nav-content] Failed to auto-install plugin "${pId || pUrl}":`, e)
        }
      }
      else {
        configPluginIds.add(alreadyInstalled.id)
        if (alreadyInstalled.removable !== false) {
          pluginStore.setRemovable(alreadyInstalled.id, false)
        }
      }
    }
  }

  if (isCancelled)
    return

  for (const plugin of pluginStore.plugins) {
    if (plugin.removable === false && !configPluginIds.has(plugin.id)) {
      pluginStore.setRemovable(plugin.id, true)
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="layout-container">
    <PageLoader v-if="status === 'pending'" />
    <div v-else class="layout-content">
      <ContentViewerNavigation v-if="isSidebarEnabled" v-model:menu="menu" :items="data.nav" />
      <main ref="mainAreaRef" class="main-area">
        <ContentViewerHeader
          :menu="menu"
          :visible="isHeaderVisible"
          :show-menu-toggle="isSidebarEnabled"
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
  height: 100dvh;
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
  min-height: 0;
  overflow-y: auto;
  padding: 50px 0 env(safe-area-inset-bottom, 0) 0;
  -webkit-overflow-scrolling: touch;

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
