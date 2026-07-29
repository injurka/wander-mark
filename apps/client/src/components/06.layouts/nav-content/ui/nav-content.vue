<script lang="ts" setup>
import type { ContentNavItem, VaultMetaSettings } from '~/components/05.modules/content-viewer'
import type { BacklinksMap, VaultMetaSearchIndexItem } from '~/shared/types/models'
import { Icon } from '@iconify/vue'
import { useEventListener, useSwipe } from '@vueuse/core'
import { useHead } from '@vueuse/head'
import { computed, nextTick, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { KitCheckbox, KitDialog } from '~/components/01.kit'
import AiSettingsDialog from '~/components/02.shared/global-dialogs/ui/ai-settings-dialog.vue'
import { PageLoader } from '~/components/02.shared/page-loader'
import { PluginManagerDialog, PluginSlot } from '~/components/02.shared/plugins'
import { usePluginStore } from '~/components/02.shared/plugins/store'
import { ContentViewerHeader, ContentViewerNavigation, useContentViewerStore } from '~/components/05.modules/content-viewer'
import SearchModal from '~/components/05.modules/content-viewer/ui/search-modal.vue'
import { ThemesVariant, useChangeTheme } from '~/shared/composables/use-change-theme'
import { useConfirm } from '~/shared/composables/use-confirm'
import { useLocale } from '~/shared/composables/use-locale'
import { useToast } from '~/shared/composables/use-toast'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'
import { useGlobalSettingsStore } from '~/shared/store/settings.store'
import { useVaultStore } from '~/shared/store/vault.store'

interface InititalData {
  nav: ContentNavItem[] | null
  settings: VaultMetaSettings | null
  backlinks: BacklinksMap | null
  searchIndex: VaultMetaSearchIndexItem[] | null
}

const params = useTypedRouteParams()
const contentViewerStore = useContentViewerStore()
const vaultStore = useVaultStore()
const route = useRoute()
const router = useRouter()

const pluginStore = usePluginStore()
const globalSettings = useGlobalSettingsStore()

const pluginsDialogOpen = ref(false)
const aiSettingsDialogOpen = ref(false)
const mobileSettingsOpen = ref(false) // Модалка настроек на мобилках

const { showToast } = useToast()
const { confirm } = useConfirm()
const { t } = useI18n()
const { currentLocale, cycleLanguage, languageNames } = useLocale()
const { theme, setTheme } = useChangeTheme()

const currentThemeIcon = computed(() => theme.value === ThemesVariant.Light ? 'mdi:weather-sunny' : 'mdi:weather-night')

function toggleTheme() {
  setTheme(theme.value === ThemesVariant.Light ? ThemesVariant.Dark : ThemesVariant.Light)
}

const isSidebarEnabled = computed(() => !route.meta.hideSidebar)

const menu = ref(isSidebarEnabled.value && typeof window !== 'undefined' && window.innerWidth >= 768)
const searchOpen = ref(false)
const scrollableRef = ref<HTMLElement | null>(null)
const mainAreaRef = ref<HTMLElement | null>(null)

// Флаг защиты от ложных открытий меню
const isSwipingOnScrollable = ref(false)

const isHeaderVisible = ref(true)
const lastScrollTop = ref(0)
const scrollThreshold = 50
const status = ref<'pending' | 'success'>('pending')
const data = ref<InititalData>({
  nav: null,
  settings: null,
  backlinks: null,
  searchIndex: null,
})

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

const ptrState = ref<'idle' | 'pulling' | 'refreshing'>('idle')
const ptrDistance = ref(0)
let touchStartY = -1

function onTouchStart(e: TouchEvent) {
  if (scrollableRef.value && scrollableRef.value.scrollTop <= 0) {
    touchStartY = e.touches[0].clientY
  }
  else {
    touchStartY = -1
  }
}

function onTouchMove(e: TouchEvent) {
  if (touchStartY > 0 && ptrState.value !== 'refreshing') {
    const y = e.touches[0].clientY
    const delta = y - touchStartY
    if (delta > 0) {
      ptrState.value = 'pulling'
      ptrDistance.value = Math.min(delta * 0.4, 80)
    }
    else {
      ptrState.value = 'idle'
      ptrDistance.value = 0
    }
  }
}

async function onTouchEnd() {
  if (ptrState.value === 'pulling') {
    if (ptrDistance.value >= 60) {
      ptrState.value = 'refreshing'
      ptrDistance.value = 50
      try {
        await vaultStore.syncVault(params.value.vault)
      }
      catch (e) {
        console.error('Pull to refresh failed:', e)
      }
      finally {
        ptrState.value = 'idle'
        ptrDistance.value = 0
      }
    }
    else {
      ptrState.value = 'idle'
      ptrDistance.value = 0
    }
  }
  touchStartY = -1
}

const ptrStyle = computed(() => {
  if (ptrState.value === 'refreshing')
    return { height: '50px', opacity: 1 }
  if (ptrState.value === 'idle')
    return { height: '0px', opacity: 0 }
  return { height: `${ptrDistance.value}px`, opacity: Math.min(1, ptrDistance.value / 50) }
})

useSwipe(mainAreaRef, {
  passive: true,
  onSwipeStart: (e) => {
    const target = e.target as HTMLElement
    const isScrollableElement = !!target.closest('table, pre, .mermaid, .shiki, .math, .table-container, .custom-scrollbar')

    let startX = 0
    if (typeof window !== 'undefined' && window.TouchEvent && e instanceof TouchEvent) {
      startX = e.touches[0].clientX
    }
    else if ('clientX' in e) {
      startX = (e as unknown as MouseEvent).clientX
    }

    const maxEdgeWidth = typeof window !== 'undefined' ? Math.max(150, window.innerWidth * 0.2) : 150
    const isComfortableSwipe = startX <= maxEdgeWidth

    isSwipingOnScrollable.value = isScrollableElement || !isComfortableSwipe
  },
  onSwipeEnd: (_, direction) => {
    if (!isSwipingOnScrollable.value && !menu.value && direction === 'right' && isSidebarEnabled.value)
      menu.value = true
  },
})

useEventListener(scrollableRef, 'scroll', handleScroll)

useEventListener(window, 'keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = true
  }
})

watch(() => route.path, () => {
  if (!isSidebarEnabled.value) {
    menu.value = false
  }
  else if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    menu.value = true
  }
  scrollableRef.value?.scrollTo({ top: 0, behavior: 'instant' })
})

// Автоматически раскрываем папки в дереве при навигации к любому файлу
watch(() => params.value.pwd, async (pwd) => {
  if (pwd && pwd.length > 0) {
    const folders = pwd.slice(0, -1)
    if (folders.length > 0) {
      const newOpen = new Set(contentViewerStore.openFolders)
      folders.forEach(f => newOpen.add(f))
      contentViewerStore.setOpenFolders(Array.from(newOpen))
    }

    await nextTick()
    setTimeout(() => {
      const activeItem = document.getElementById('active-tree-item')
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 150)
  }
}, { immediate: true })

// ФОНОВАЯ АВТОСИНХРОНИЗАЦИЯ
watch(() => params.value.vault, async (vault, _oldVault, onCleanup) => {
  if (!vault)
    return

  let isCancelled = false

  onCleanup(() => {
    isCancelled = true
  })

  status.value = 'pending'

  const vaultConfig = vaultStore.getVault(vault)
  if (vaultConfig && vaultConfig.isDownloaded && vaultConfig.syncStatus !== 'syncing') {
    const oneHour = 1000 * 60 * 60
    const timeSinceLastSync = Date.now() - (vaultConfig.lastSync || 0)
    if (timeSinceLastSync > oneHour && navigator.onLine) {
      vaultStore.syncVault(vault).catch(() => {})
    }
  }

  try {
    async function parseJson<T>(path: string) {
      const content = await vaultStore.getFileContent(vault, path)
      return content ? JSON.parse(content) as T : null
    }

    const [navRes, settingsRes, backlinksRes, searchRes] = await Promise.all([
      parseJson<ContentNavItem[]>(`content/${vault}/nav.json`),
      parseJson<VaultMetaSettings | null>(`meta/${vault}/settings.json`),
      parseJson<BacklinksMap | null>(`meta/${vault}/backlinks.json`),
      parseJson<VaultMetaSearchIndexItem[]>(`meta/${vault}/search.json`),
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
    const content = await vaultStore.getFileContent(vaultConfig.id, cleanPath)
    if (content) {
      const mimeType = cleanPath.endsWith('.css') ? 'text/css' : 'application/javascript'
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      appObjectUrls.add(url)
      return url
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

  if (!vault || status.value === 'pending') {
    return
  }
  if (pluginStore.currentVaultId !== vault) {
    const vaultConfig = vaultStore.getVault(vault)
    if (!vaultConfig)
      return

    await pluginStore.init(vault, {
      vaultId: vault,
      vaultUrl: vaultConfig.url || '',
      searchIndex: data.value.searchIndex,
      navItems: data.value.nav,
      router: router as any,
      getFileContent: (path: string) => vaultStore.getFileContent(vault, path),
      showToast,
      confirm,
      locale: currentLocale,
      t,
      storage: {
        async get<T>(key: string): Promise<T | null> {
          const raw = localStorage.getItem(`plugin::${vault}::${key}`)
          return raw ? JSON.parse(raw) as T : null
        },
        async set<T>(key: string, value: T) {
          localStorage.setItem(`plugin::${vault}::${key}`, JSON.stringify(value))
        },
      },
      ai: {
        getModel: () => globalSettings.aiModel,
        fetch: (endpoint: string, options: RequestInit = {}) => {
          if (!globalSettings.aiKey) {
            aiSettingsDialogOpen.value = true
            return Promise.reject(new Error('API ключ не настроен.'))
          }
          const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${globalSettings.aiKey}`,
          }

          const baseUrl = globalSettings.aiUrl || 'https://api.aihubmix.com/v1'
          const url = endpoint.startsWith('http')
            ? endpoint
            : `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

          return fetch(url, { ...options, headers })
        },
      },
    })
  }
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
          @open-ai-settings="aiSettingsDialogOpen = true"
        >
          <template #toolbar-extra>
            <PluginSlot name="toolbar" />
          </template>
        </ContentViewerHeader>

        <!-- Зона контента с обработчиками свайпов -->
        <div
          ref="scrollableRef"
          class="content-scrollable"
          :class="{ borderless: contentViewerStore.borderlessViewEnabled }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- Pull-to-refresh индикатор -->
          <div class="ptr-container" :class="ptrState" :style="ptrStyle">
            <Icon icon="mdi:refresh" class="ptr-spinner" :class="{ 'is-spinning': ptrState === 'refreshing' }" />
          </div>

          <PluginSlot name="content-before" />
          <router-view />
          <PluginSlot name="content-after" />
        </div>

        <!-- Полупрозрачный нижний тулбар для мобильных (Опции слева, Меню справа) -->
        <nav class="mobile-bottom-nav">
          <button class="bottom-nav-btn" :class="{ 'is-active': mobileSettingsOpen }" @click="mobileSettingsOpen = true">
            <Icon icon="mdi:cog-outline" />
            <span>Опции</span>
          </button>
          <button class="bottom-nav-btn" @click="searchOpen = true">
            <Icon icon="mdi:magnify" />
            <span>Поиск</span>
          </button>
          <button class="bottom-nav-btn" @click="router.push(`/${params.vault}`)">
            <Icon icon="mdi:home-outline" />
            <span>Главная</span>
          </button>
          <button class="bottom-nav-btn" :class="{ 'is-active': menu }" @click="menu = !menu">
            <Icon icon="mdi:menu" />
            <span>Меню</span>
          </button>
        </nav>
      </main>

      <SearchModal v-model="searchOpen" />

      <PluginSlot name="overlay" />

      <PluginManagerDialog v-model:visible="pluginsDialogOpen" />
      <AiSettingsDialog v-model:visible="aiSettingsDialogOpen" />

      <!-- Мобильные настройки (Модальное окно) -->
      <KitDialog v-model:visible="mobileSettingsOpen" :title="t('settings.interface')" icon="mdi:cog-outline" :max-width="400">
        <div class="mobile-settings-list">
          <div class="menu-item" @click="toggleTheme">
            <div class="item-label">
              <Icon :icon="currentThemeIcon" class="item-icon" />
              <span>{{ t('settings.theme') }}</span>
            </div>
            <span class="value-text">{{ theme === 'light' ? t('settings.themeLight') : t('settings.themeDark') }}</span>
          </div>
          <div class="menu-item" @click="cycleLanguage">
            <div class="item-label">
              <Icon icon="mdi:translate" class="item-icon" />
              <span>{{ t('settings.language') }}</span>
            </div>
            <span class="value-text">{{ languageNames[currentLocale] }}</span>
          </div>

          <div class="divider" />

          <div class="settings-group">
            <KitCheckbox v-model="contentViewerStore.pinHeaderEnabled" :label="t('settings.pinHeader')" />
            <KitCheckbox v-model="contentViewerStore.borderlessViewEnabled" :label="t('settings.borderless')" />
            <KitCheckbox v-model="contentViewerStore.coloredFoldersEnabled" :label="t('settings.coloredFolders')" />
            <KitCheckbox v-model="contentViewerStore.showIconsEnabled" :label="t('settings.showIcons')" />
            <KitCheckbox v-model="contentViewerStore.showOutlineEnabled" :label="t('settings.showOutline')" />
          </div>

          <div class="divider" />

          <div class="menu-item" @click="mobileSettingsOpen = false; pluginsDialogOpen = true">
            <div class="item-label">
              <Icon icon="mdi:puzzle-outline" class="item-icon" />
              <span>{{ t('settings.plugins') }}</span>
            </div>
          </div>
          <div class="menu-item" @click="mobileSettingsOpen = false; aiSettingsDialogOpen = true">
            <div class="item-label">
              <Icon icon="mdi:robot-outline" class="item-icon" />
              <span>{{ t('settings.aiSettings') }}</span>
            </div>
          </div>
        </div>
      </KitDialog>
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

  overscroll-behavior-y: none;

  @include media-down(md) {
    padding-bottom: calc(env(safe-area-inset-bottom, 0) + 70px);
  }

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

.ptr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  color: var(--fg-accent-color);
  width: 100%;

  &.idle {
    transition:
      height 0.3s cubic-bezier(0.2, 0, 0, 1),
      opacity 0.3s;
  }
  &.refreshing {
    transition: height 0.3s cubic-bezier(0.2, 0, 0, 1);
  }
}

.ptr-spinner {
  font-size: 1.8rem;
  opacity: 0.8;
  &.is-spinning {
    animation: spin 1s linear infinite;
    opacity: 1;
  }
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.mobile-bottom-nav {
  display: none;

  @include media-down(md) {
    display: flex;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(60px + env(safe-area-inset-bottom, 0));
    padding-bottom: env(safe-area-inset-bottom, 0);

    background-color: rgba(var(--bg-secondary-color-rgb), 0.65);
    backdrop-filter: blur(20px);

    border-top: 1px solid var(--border-secondary-color);
    z-index: 50;
    justify-content: space-around;
    align-items: center;
  }
}

.bottom-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--fg-secondary-color);
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  font-size: 1.4rem;
  gap: 4px;
  transition: color 0.2s;

  span {
    font-size: 0.65rem;
    font-weight: 500;
  }

  &.is-active,
  &:active {
    color: var(--fg-accent-color);
  }
}

.mobile-settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:active {
    background-color: var(--bg-hover-color);
    border-color: var(--fg-accent-color);
  }
}
.item-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  font-weight: 500;
}
.item-icon {
  font-size: 1.2rem;
  color: var(--fg-accent-color);
}
.value-text {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
}
.divider {
  height: 1px;
  background-color: var(--border-secondary-color);
  margin: 4px;
}
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 12px;
  background-color: var(--bg-secondary-color);
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
}
</style>
