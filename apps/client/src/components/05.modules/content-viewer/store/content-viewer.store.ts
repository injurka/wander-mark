import type { BacklinkItem, BacklinksMap, ContentNavItem, SearchIndexItem, VaultMetaSettings } from '../models'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { findItemByPath } from '../lib/navigation'

const COOKIE_BORDERLESS_VIEW = 'ui_borderlessViewEnabled'
const COOKIE_COLORED_FOLDERS = 'ui_coloredFoldersEnabled'
const COOKIE_SHOW_ICONS = 'ui_showIconsEnabled'
const COOKIE_SHOW_OUTLINE = 'ui_showOutlineEnabled'
const COOKIE_PIN_HEADER = 'ui_pinHeaderEnabled'

export const useContentViewerStore = defineStore('contentViewer', () => {
  const route = useRoute()

  const navItems = ref<ContentNavItem[] | null>(null)
  const vaultSettings = ref<VaultMetaSettings | null>(null)
  const backlinks = ref<BacklinksMap | null>(null)
  const searchIndex = ref<SearchIndexItem[] | null>(null)

  const borderlessViewEnabled = useLocalStorage<boolean>(COOKIE_BORDERLESS_VIEW, true)
  const coloredFoldersEnabled = useLocalStorage<boolean>(COOKIE_COLORED_FOLDERS, false)
  const showIconsEnabled = useLocalStorage<boolean>(COOKIE_SHOW_ICONS, true)
  const showOutlineEnabled = useLocalStorage<boolean>(COOKIE_SHOW_OUTLINE, true)
  const pinHeaderEnabled = useLocalStorage<boolean>(COOKIE_PIN_HEADER, false)

  const activeItem = computed(() => {
    if (!navItems.value)
      return null
    const rawPwd = route.params.pwd
    const pathSegments = Array.isArray(rawPwd) ? rawPwd : [rawPwd].filter(Boolean) as string[]
    if (pathSegments.length === 0)
      return null
    return findItemByPath(navItems.value, pathSegments)
  })

  const currentBacklinks = computed<BacklinkItem[]>(() => {
    if (!backlinks.value)
      return []
    const currentPath = decodeURIComponent(route.path)
    return backlinks.value[currentPath] || backlinks.value[currentPath.replace(/\/$/, '')] || []
  })

  return {
    navItems,
    vaultSettings,
    backlinks,
    activeItem,
    currentBacklinks,
    searchIndex,
    borderlessViewEnabled,
    pinHeaderEnabled,
    coloredFoldersEnabled,
    showIconsEnabled,
    showOutlineEnabled,
  }
})
