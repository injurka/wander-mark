<script setup lang="ts">
import type { FuseResult } from 'fuse.js'
import type { SearchIndexItem } from '../models'
import { Icon } from '@iconify/vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import Fuse from 'fuse.js'
import { useContentViewerStore } from '../store'

const modelValue = defineModel<boolean>({ required: true })

const store = useContentViewerStore()
const query = ref('')
const selectedTags = ref<Set<string>>(new Set())
const activeIndex = ref(0)
const modalRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'tags', weight: 0.5 },
    { name: 'content', weight: 0.3 },
  ],
  includeMatches: true,
  minMatchCharLength: 2,
  threshold: 0.4,
  ignoreLocation: true,
  findAllMatches: true,
  useExtendedSearch: true,
}

let fuse: Fuse<SearchIndexItem> | null = null

watch(() => store.searchIndex, (newIndex) => {
  if (newIndex && newIndex.length > 0) {
    fuse = new Fuse(newIndex, fuseOptions)
  }
}, { immediate: true })

const availableTags = computed(() => {
  const map = new Map<string, number>()
  store.searchIndex?.forEach((item) => {
    item.tags?.forEach((tag) => {
      const cleanTag = tag.replace(/^#/, '')
      map.set(cleanTag, (map.get(cleanTag) || 0) + 1)
    })
  })
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
})

function toggleTag(tag: string) {
  if (selectedTags.value.has(tag)) {
    selectedTags.value.delete(tag)
  }
  else {
    selectedTags.value.add(tag)
  }
  activeIndex.value = 0
}

const filteredResults = computed(() => {
  const index = store.searchIndex || []
  let baseResults: { item: SearchIndexItem, matches?: readonly any[] }[] = []

  if (query.value && fuse) {
    baseResults = fuse.search(query.value)
  }
  else if (!query.value && selectedTags.value.size > 0) {
    baseResults = index.map(item => ({ item }))
  }
  else {
    return []
  }

  if (selectedTags.value.size > 0) {
    return baseResults.filter(({ item }) => {
      if (!item.tags)
        return false

      const itemTags = new Set(item.tags.map(t => t.replace(/^#/, '')))

      return Array.from(selectedTags.value).every(t => itemTags.has(t))
    })
  }

  return baseResults.slice(0, 50)
})

function close() {
  modelValue.value = false
  query.value = ''
  selectedTags.value.clear()
}

function navigate(url: string) {
  navigateTo(url)
  close()
}

onKeyStroke('ArrowDown', (e) => {
  if (!modelValue.value)
    return

  e.preventDefault()

  if (activeIndex.value < filteredResults.value.length - 1) {
    activeIndex.value++
    document.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
  }
})

onKeyStroke('ArrowUp', (e) => {
  if (!modelValue.value)
    return

  e.preventDefault()

  if (activeIndex.value > 0) {
    activeIndex.value--
    document.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' })
  }
})

onKeyStroke('Enter', (e) => {
  if (!modelValue.value || filteredResults.value.length === 0)
    return

  e.preventDefault()

  const result = filteredResults.value[activeIndex.value]

  if (result) {
    navigate(result.item.url)
  }
})

onKeyStroke('Escape', () => close())
onClickOutside(modalRef, () => close())

watch(modelValue, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
  }
})

function getHighlightedSnippet(result: FuseResult<SearchIndexItem>): string {
  if (!result.matches || result.matches.length === 0) {
    return `${result.item.content.slice(0, 100)}...`
  }

  const contentMatch = result.matches.find(m => m.key === 'content')
  if (!contentMatch || !contentMatch.value || !contentMatch.indices || contentMatch.indices.length === 0) {
    return `${result.item.content.slice(0, 100)}...`
  }

  const firstMatch = contentMatch.indices[0]
  const [start, end] = firstMatch!

  const text = contentMatch.value
  const snippetStart = Math.max(0, start - 40)
  const snippetEnd = Math.min(text.length, end + 60)

  let snippet = text.slice(snippetStart, snippetEnd)

  if (snippetStart > 0)
    snippet = `...${snippet}`
  if (snippetEnd < text.length)
    snippet = `${snippet}...`

  const matchedText = text.slice(start, end + 1)
  return snippet.split(matchedText).join(`<mark>${matchedText}</mark>`)
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="search-backdrop">
      <div ref="modalRef" class="search-modal">
        <div class="search-header">
          <Icon icon="mdi:magnify" class="search-icon" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Поиск по заметкам и тегам..."
            autocomplete="off"
            @input="activeIndex = 0"
          >
          <div class="search-hint">
            ESC
          </div>
        </div>

        <div v-if="availableTags.length > 0" class="tags-bar custom-scrollbar">
          <button
            v-for="tag in availableTags"
            :key="tag"
            class="tag-chip"
            :class="{ 'is-selected': selectedTags.has(tag) }"
            @click="toggleTag(tag)"
          >
            #{{ tag }}
          </button>
        </div>

        <div v-if="filteredResults.length > 0" class="search-results custom-scrollbar">
          <div
            v-for="(result, index) in filteredResults"
            :key="result.item.id"
            class="result-item"
            :class="{ 'is-active': index === activeIndex }"
            @click="navigate(result.item.url)"
            @mouseenter="activeIndex = index"
          >
            <div class="result-main">
              <div class="result-title">
                <Icon icon="mdi:file-document-outline" class="file-icon" />
                <span>{{ result.item.title }}</span>
              </div>
              <div
                class="result-snippet"
                v-html="getHighlightedSnippet(result as any)"
              />
            </div>

            <!-- Tags in result card -->
            <div v-if="result.item.tags && result.item.tags.length > 0" class="result-tags">
              <span v-for="tag in result.item.tags.slice(0, 3)" :key="tag" class="mini-tag">
                {{ tag }}
              </span>
              <span v-if="result.item.tags.length > 3" class="mini-tag-more">
                +{{ result.item.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="query || selectedTags.size > 0" class="no-results">
          <Icon icon="mdi:file-search-outline" size="48" class="no-results-icon" />
          <p>Ничего не найдено</p>
          <span v-if="selectedTags.size > 0" class="reset-link" @click="selectedTags.clear()">
            Сбросить фильтры
          </span>
        </div>

        <div v-else class="empty-state">
          <div class="empty-hint">
            <Icon icon="mdi:keyboard-return" />
            <span>для перехода</span>
          </div>
          <div class="empty-hint">
            <Icon icon="mdi:arrow-up-down" />
            <span>для навигации</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.search-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 10vh;
}

.search-modal {
  width: 100%;
  max-width: 650px;
  background-color: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 75vh;
  margin: 0 16px;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-secondary-color);
  gap: 14px;
  background-color: var(--bg-primary-color);
}

.search-icon {
  font-size: 1.6rem;
  color: var(--fg-accent-color);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--fg-primary-color);
  outline: none;
  min-width: 0;

  &::placeholder {
    color: var(--fg-muted-color);
    opacity: 0.6;
  }
}

.search-hint {
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: 600;
  user-select: none;
}

.tags-bar {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  overflow-x: auto;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-secondary-color);
  background-color: var(--bg-tertiary-color);
  flex-shrink: 0;
  align-items: center;

  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.tag-chip {
  appearance: none;
  border: 1px solid var(--border-primary-color);
  background-color: var(--bg-primary-color);
  color: var(--fg-secondary-color);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: var(--fg-accent-color);
    color: var(--fg-primary-color);
  }

  &.is-selected {
    background-color: var(--fg-accent-color);
    border-color: var(--fg-accent-color);
    color: var(--fg-inverted-color);
    box-shadow: 0 2px 8px rgba(var(--fg-accent-color-rgb), 0.3);
  }
}

.search-results {
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.is-active {
    background-color: var(--bg-hover-color);
    border-color: var(--border-primary-color);

    .file-icon {
      color: var(--fg-accent-color);
    }
  }
}

.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--fg-primary-color);
  margin-bottom: 6px;
  font-size: 1rem;

  .file-icon {
    color: var(--fg-muted-color);
    font-size: 1.2rem;
  }
}

.result-snippet {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  margin-left: 28px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  :deep(mark) {
    background-color: rgba(var(--fg-accent-color-rgb), 0.15);
    color: var(--fg-accent-color);
    border-radius: 3px;
    padding: 0 2px;
    font-weight: 600;
  }
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: 28px;
  margin-top: 4px;
}

.mini-tag {
  font-size: 0.75rem;
  color: var(--fg-accent-color);
  background-color: rgba(var(--fg-accent-color-rgb), 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Maple Mono CN', monospace;
}

.mini-tag-more {
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  padding: 2px 4px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--fg-muted-color);
  gap: 16px;

  .no-results-icon {
    opacity: 0.4;
  }

  .reset-link {
    color: var(--fg-accent-color);
    cursor: pointer;
    font-size: 0.9rem;
    &:hover {
      text-decoration: underline;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 20px;
  gap: 16px;
  background-color: var(--bg-tertiary-color);
  border-top: 1px solid var(--border-secondary-color);
}

.empty-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--fg-muted-color);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
  .search-modal {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .search-modal {
    transform: scale(0.96) translateY(-10px);
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-color);
    border-radius: 4px;
  }
}
</style>
