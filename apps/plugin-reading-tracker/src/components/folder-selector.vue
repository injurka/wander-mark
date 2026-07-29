<script setup lang="ts">
import type { WanderMarkPluginContext } from '@injurkx/plugin-api'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { trackerState } from '../store/tracker.store'

interface FolderInfo {
  path: string
  name: string
  articlesCount: number
  depth: number
}

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

type NavItem = NonNullable<WanderMarkPluginContext['navItems']>[number]

function countFiles(item: NavItem): number {
  if (item.type === 'file')
    return 1
  if (item.type === 'directory' && Array.isArray(item.children)) {
    return item.children.reduce((acc: number, child: NavItem) => acc + countFiles(child), 0)
  }
  return 0
}

function traverseNav(items: NavItem[], currentPath = '', depth = 0): FolderInfo[] {
  let folders: FolderInfo[] = []
  for (const item of items) {
    if (item.type === 'directory') {
      const folderPath = currentPath ? `${currentPath}/${item.sysname}` : item.sysname
      const fileCount = countFiles(item)
      folders.push({
        path: folderPath,
        name: item.title || item.sysname,
        articlesCount: fileCount,
        depth,
      })
      if (Array.isArray(item.children)) {
        folders = folders.concat(traverseNav(item.children, folderPath, depth + 1))
      }
    }
  }
  return folders
}

const availableFolders = computed<FolderInfo[]>(() => {
  const navFolders = traverseNav(trackerState.navItems || [])

  // Также соберем папки из имеющихся логов на случай, если структура не полная
  const logFoldersMap = new Map<string, number>()
  trackerState.logs.forEach((log) => {
    const parts = log.path.split('/')
    if (parts.length > 1) {
      parts.pop()
      const folder = parts.join('/')
      logFoldersMap.set(folder, (logFoldersMap.get(folder) || 0) + 1)
    }
  })

  const navFolderPaths = new Set(navFolders.map(f => f.path))

  logFoldersMap.forEach((count, path) => {
    if (!navFolderPaths.has(path)) {
      const depth = path.split('/').length - 1
      const name = path.split('/').pop() || path
      navFolders.push({
        path,
        name,
        articlesCount: count,
        depth,
      })
    }
  })

  return navFolders
})

const selectedFolderInfo = computed(() => {
  if (!trackerState.scope)
    return null
  return availableFolders.value.find(f => f.path === trackerState.scope) || {
    path: trackerState.scope,
    name: trackerState.scope,
    articlesCount: 0,
    depth: 0,
  }
})

function selectFolder(path: string) {
  trackerState.scope = path
  isOpen.value = false
}
</script>

<template>
  <div ref="dropdownRef" class="rt-folder-selector">
    <button class="rt-selector-btn" :class="{ 'is-active': isOpen }" @click="isOpen = !isOpen">
      <div class="rt-btn-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-folder-icon">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>

        <span v-if="!selectedFolderInfo" class="rt-placeholder">Всё приложение (Все папки)</span>
        <span v-else class="rt-selected-label">
          {{ selectedFolderInfo.path }}
        </span>
      </div>

      <span v-if="selectedFolderInfo" class="rt-chip rt-chip-accent">
        {{ selectedFolderInfo.articlesCount }} материалов
      </span>

      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-arrow-icon" :class="{ 'is-open': isOpen }">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="isOpen" class="rt-dropdown-menu">
      <div
        class="rt-dropdown-item"
        :class="{ 'is-selected': !trackerState.scope }"
        @click="selectFolder('')"
      >
        <div class="rt-item-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-item-icon">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span class="rt-item-title">Все папки</span>
        </div>
      </div>

      <div class="rt-dropdown-divider" />

      <div
        v-for="folder in availableFolders"
        :key="folder.path"
        class="rt-dropdown-item"
        :class="{ 'is-selected': trackerState.scope === folder.path }"
        :style="{ paddingLeft: `${12 + folder.depth * 14}px` }"
        @click="selectFolder(folder.path)"
      >
        <div class="rt-item-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rt-item-icon">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <div class="rt-folder-names">
            <span class="rt-item-title">{{ folder.name }}</span>
            <span class="rt-item-path">{{ folder.path }}</span>
          </div>
        </div>

        <span class="rt-chip">
          {{ folder.articlesCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-folder-selector {
  position: relative;
  min-width: 260px;
}

.rt-selector-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 14px;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  color: var(--fg-primary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.rt-selector-btn:hover,
.rt-selector-btn.is-active {
  border-color: var(--fg-accent-color);
  background: var(--bg-hover-color);
}

.rt-btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.rt-folder-icon {
  color: var(--fg-accent-color);
  flex-shrink: 0;
}

.rt-placeholder {
  color: var(--fg-muted-color);
}

.rt-selected-label {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt-chip {
  background: var(--bg-tertiary-color);
  color: var(--fg-secondary-color);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
  font-weight: 500;
}

.rt-chip-accent {
  background: rgba(var(--fg-accent-color-rgb, 59, 130, 246), 0.15);
  color: var(--fg-accent-color);
}

.rt-arrow-icon {
  color: var(--fg-secondary-color);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.rt-arrow-icon.is-open {
  transform: rotate(180deg);
}

.rt-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rt-dropdown-divider {
  height: 1px;
  background: var(--border-secondary-color);
  margin: 4px 0;
}

.rt-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.rt-dropdown-item:hover {
  background: var(--bg-hover-color);
}

.rt-dropdown-item.is-selected {
  background: rgba(var(--fg-accent-color-rgb, 59, 130, 246), 0.12);
}

.rt-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.rt-item-icon {
  color: var(--fg-secondary-color);
  flex-shrink: 0;
}

.rt-folder-names {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rt-item-title {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--fg-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt-item-path {
  font-size: 0.72rem;
  color: var(--fg-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
