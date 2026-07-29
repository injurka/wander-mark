<script setup lang="ts">
import type { SearchResultItem } from '~/shared/types/rpc'
import { Icon } from '@iconify/vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { dbRpc } from '~/shared/services/db.client'
import { useContentViewerStore } from '../store'

const modelValue = defineModel<boolean>({ required: true })

const store = useContentViewerStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const query = ref('')
const selectedTags = ref<Set<string>>(new Set())
const activeIndex = ref(0)
const modalRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

interface DisplayResult {
  id: string
  title: string
  url: string
  tags?: string[]
  snippet?: string
}

const searchMode = useLocalStorage<'all' | 'files'>('search_mode', 'all')

const ftsResults = ref<SearchResultItem[]>([])
let searchSeq = 0

// Полнотекстовый поиск выполняется SQLite FTS5 в воркере
watch([query, searchMode], async ([newQuery]) => {
  const seq = ++searchSeq
  if (!newQuery || newQuery.trim().length < 2) {
    ftsResults.value = []
    return
  }
  try {
    const results = await dbRpc.searchFTS(newQuery, String(route.params.vault))
    if (seq === searchSeq)
      ftsResults.value = results
  }
  catch (e) {
    console.error('Ошибка FTS-поиска:', e)
  }
})

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
  if (selectedTags.value.has(tag))
    selectedTags.value.delete(tag)
  else selectedTags.value.add(tag)
  activeIndex.value = 0
}

const filteredResults = computed<DisplayResult[]>(() => {
  let baseResults: DisplayResult[]

  if (query.value) {
    baseResults = ftsResults.value.map(r => ({
      id: r.path,
      title: r.title || r.path,
      url: r.path,
      tags: r.tags ? r.tags.split(/\s+/).filter(Boolean) : [],
      snippet: r.snippet,
    }))
  }
  else if (selectedTags.value.size > 0) {
    baseResults = (store.searchIndex || []).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      tags: item.tags,
      snippet: `${item.content.slice(0, 100)}...`,
    }))
  }
  else {
    return []
  }

  if (selectedTags.value.size > 0) {
    return baseResults.filter((item) => {
      if (!item.tags)
        return false
      const itemTags = new Set(item.tags.map((t: string) => t.replace(/^#/, '')))
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
  router.push(url)
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
    navigate(result.url)
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

function getFormattedPath(url: string) {
  const vaultPrefix = `/${route.params.vault}`
  if (url.startsWith(vaultPrefix)) {
    return url.slice(vaultPrefix.length).replace(/^\//, '')
  }
  return url.replace(/^\//, '')
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
            :placeholder="t('search.placeholder')"
            autocomplete="off"
            @input="activeIndex = 0"
          >
          <div class="search-hint">
            ESC
          </div>
        </div>

        <div class="search-modes-bar">
          <button
            class="mode-btn"
            :class="{ 'is-active': searchMode === 'all' }"
            @click="searchMode = 'all'"
          >
            <Icon icon="mdi:text-search" class="mode-icon" />
            <span>{{ t('search.modeAll') }}</span>
          </button>
          <button
            class="mode-btn"
            :class="{ 'is-active': searchMode === 'files' }"
            @click="searchMode = 'files'"
          >
            <Icon icon="mdi:file-document-outline" class="mode-icon" />
            <span>{{ t('search.modeFiles') }}</span>
          </button>
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
            :key="result.id"
            class="result-item"
            :class="{ 'is-active': index === activeIndex }"
            @click="navigate(result.url)"
            @mouseenter="activeIndex = index"
          >
            <div class="result-main">
              <div class="result-title">
                <Icon icon="mdi:file-document-outline" class="file-icon" />
                <span>{{ result.title }}</span>
              </div>
              <div
                v-if="searchMode === 'all'"
                class="result-snippet"
                v-html="result.snippet"
              />
              <div
                v-else
                class="result-path"
              >
                {{ getFormattedPath(result.url) }}
              </div>
            </div>

            <div v-if="result.tags && result.tags.length > 0" class="result-tags">
              <span v-for="tag in result.tags.slice(0, 3)" :key="tag" class="mini-tag">
                {{ tag }}
              </span>
              <span v-if="result.tags.length > 3" class="mini-tag-more">
                +{{ result.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="query || selectedTags.size > 0" class="no-results">
          <Icon icon="mdi:file-search-outline" size="48" class="no-results-icon" />
          <p>{{ t('search.noResults') }}</p>
          <span v-if="selectedTags.size > 0" class="reset-link" @click="selectedTags.clear()">
            {{ t('search.resetFilters') }}
          </span>
        </div>

        <div v-else class="empty-state">
          <div class="empty-hint">
            <Icon icon="mdi:keyboard-return" />
            <span>{{ t('search.toNavigate') }}</span>
          </div>
          <div class="empty-hint">
            <Icon icon="mdi:arrow-up-down" />
            <span>{{ t('search.toSelect') }}</span>
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
  max-width: 800px;
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

.search-modes-bar {
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  background-color: var(--bg-primary-color);
  border-bottom: 1px solid var(--border-secondary-color);
  flex-shrink: 0;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid transparent;
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    color: var(--fg-primary-color);
    background-color: var(--bg-hover-color);
  }

  &.is-active {
    color: var(--fg-accent-color);
    background-color: var(--bg-accent-color);
    border-color: rgba(var(--fg-accent-color-rgb), 0.2);
    font-weight: 600;
  }
}

.mode-icon {
  font-size: 1.1rem;
}

.result-path {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  opacity: 0.85;
  margin-left: 28px;
  margin-top: 2px;
  font-family: 'Maple Mono CN', monospace;
  word-break: break-all;
}
</style>
