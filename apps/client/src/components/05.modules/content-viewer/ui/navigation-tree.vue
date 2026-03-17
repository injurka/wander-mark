<script setup lang="ts">
import type { ContentNavItem } from '../models'
import { Icon } from '@iconify/vue'
import { ContentNavItemType } from '../models'
import { useContentViewerStore } from '../store'

interface Props {
  items: ContentNavItem[]
  level?: number
  searchQuery?: string
  rootIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  searchQuery: '',
  rootIndex: undefined,
})

const emit = defineEmits(['select'])
const store = useContentViewerStore()
const openFolders = ref<Set<string>>(new Set())

function toggleFolder(sysname: string) {
  if (openFolders.value.has(sysname))
    openFolders.value.delete(sysname)
  else openFolders.value.add(sysname)
}

const filteredItems = computed(() => {
  if (!props.searchQuery)
    return props.items
  const query = props.searchQuery.toLowerCase()

  function filter(items: ContentNavItem[]): ContentNavItem[] {
    return items.reduce((acc, item) => {
      const matches = item.title.toLowerCase().includes(query)
      if (item.type === ContentNavItemType.File && matches) {
        acc.push(item)
      }
      else if (item.type === ContentNavItemType.Directory) {
        const children = item.children ? filter(item.children) : []
        if (matches || children.length > 0) {
          acc.push({ ...item, children })
          if (children.length > 0)
            openFolders.value.add(item.sysname)
        }
      }
      return acc
    }, [] as ContentNavItem[])
  }
  return filter(props.items)
})

function getColorClass(index: number) {
  if (!store.coloredFoldersEnabled)
    return ''
  const colorIndex = props.rootIndex !== undefined ? props.rootIndex : index
  return `row-color-${(colorIndex % 6) + 1}`
}

function getNextRootIndex(currentIndex: number) {
  return props.rootIndex !== undefined ? props.rootIndex : currentIndex
}
</script>

<template>
  <ul class="nav-tree" :class="{ 'is-root': level === 0 }">
    <li v-for="(item, index) in filteredItems" :key="item.sysname" class="nav-tree-item">
      <!-- Папка -->
      <div
        v-if="item.type === ContentNavItemType.Directory"
        class="tree-row folder-row"
        :class="[getColorClass(index)]"
        :style="{ paddingLeft: `${level * 16 + 2}px` }"
        @click.stop="toggleFolder(item.sysname)"
      >
        <span class="tree-toggle-icon">
          <Icon
            :icon="openFolders.has(item.sysname) ? 'mdi:chevron-down' : 'mdi:chevron-right'"
            size="16"
          />
        </span>
        <span v-if="store.showIconsEnabled" class="tree-icon flex-shrink-0">
          <Icon
            :icon="openFolders.has(item.sysname) ? 'mdi:folder-open' : 'mdi:folder'"
            class="folder-icon"
          />
        </span>
        <span class="tree-label" :title="item.title">{{ item.title }}</span>
      </div>

      <!-- Файл -->
      <div
        v-else
        class="tree-row file-row"
        :class="[getColorClass(index)]"
        :style="{ paddingLeft: `${level * 16 + 22}px` }"
        @click.stop="emit('select', item)"
      >
        <span v-if="store.showIconsEnabled" class="tree-icon flex-shrink-0">
          <Icon icon="mdi:language-markdown" size="16" />
        </span>
        <span class="tree-label" :title="item.title">{{ item.title }}</span>
      </div>

      <!-- Рекурсия (Дети) -->
      <div v-if="item.type === ContentNavItemType.Directory && openFolders.has(item.sysname)" class="tree-children">
        <div
          v-if="store.showOutlineEnabled"
          class="outline-guide"
          :style="{ left: `${(level * 16) + 15}px` }"
        />

        <NavigationTree
          v-if="item.children"
          :items="item.children"
          :level="level + 1"
          :search-query="searchQuery"
          :root-index="getNextRootIndex(index)"
          @select="emit('select', $event)"
        />
      </div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.nav-tree {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.nav-tree-item {
  position: relative;
}

.tree-row {
  display: flex;
  align-items: center;
  padding: 4px 0px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  margin: 2px 4px;
  transition: all 0.1s ease-in-out;
  color: var(--fg-secondary-color);
  max-width: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;

  &:hover {
    background-color: var(--bg-hover-color);
    color: var(--fg-primary-color);
  }
}

.tree-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  min-width: 16px;
  margin-right: 4px;
  opacity: 0.7;
}

.tree-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.tree-label {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.tree-children {
  position: relative;
}

.outline-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--border-primary-color);
  opacity: 0.4;
  z-index: 0;
  pointer-events: none;
}

$c-blue: 66, 165, 245;
$c-red: 239, 83, 80;
$c-green: 102, 187, 106;
$c-orange: 255, 167, 38;
$c-purple: 171, 71, 188;
$c-brown: 141, 110, 99;

.row-color-1 {
  --row-rgb: #{$c-orange};
}
.row-color-2 {
  --row-rgb: #{$c-purple};
}
.row-color-3 {
  --row-rgb: #{$c-green};
}
.row-color-4 {
  --row-rgb: #{$c-blue};
}
.row-color-5 {
  --row-rgb: #{$c-red};
}
.row-color-6 {
  --row-rgb: #{$c-brown};
}

[class*='row-color-'] {
  color: rgb(var(--row-rgb));
  background-color: rgba(var(--row-rgb), 0.08);

  .tree-icon,
  .tree-toggle-icon {
    color: rgb(var(--row-rgb));
  }

  &:hover {
    background-color: rgba(var(--row-rgb), 0.16);
    color: rgb(var(--row-rgb));
  }
}
</style>
