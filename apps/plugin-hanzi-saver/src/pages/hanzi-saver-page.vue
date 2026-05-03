<script setup lang="ts">
import type { HanziData } from '../types'
import { computed, onUnmounted, ref, watch } from 'vue'
import HanziActionPopover from '../components/hanzi-action-popover.vue'
import HzWordsCompact from '../components/hz-words-compact.vue'
import SettingsModal from '../components/settings-modal.vue'
import { deleteHanziFromDb } from '../services/db.service'
import { openPopover, state } from '../store/hanzi-saver.store'

const hanziList = ref<HanziData[]>([])
const isLoading = ref(true)
const error = ref('')
let abortController: AbortController | null = null

// Состояния фильтров
const showAdvancedFilters = ref(false)
const searchQuery = ref('')
const filterType = ref('all')
const filterHsk = ref('all')
const filterPos = ref('all')

const expandedItems = ref<Set<string>>(new Set())
const expandedWordsItems = ref<Set<string>>(new Set())

// Нормализация и извлечение уровней HSK из данных базы
const availableHskLevels = computed(() => {
  const levels = new Set<string>()
  let hasNone = false

  hanziList.value.forEach((item) => {
    if (item.type !== 'word')
      return
    const hsk = item.hsk
    if (!hsk || hsk === 'None' || hsk.toLowerCase() === 'none') {
      hasNone = true
    }
    else {
      const numMatch = hsk.match(/\d+/)
      if (numMatch)
        levels.add(`HSK ${numMatch[0]}`)
      else levels.add(hsk.trim())
    }
  })

  const sorted = Array.from(levels).sort()
  if (hasNone)
    sorted.push('None')
  return sorted
})

// Динамическое извлечение частей речи
const posOptions = computed(() => {
  const pos = new Set<string>()
  hanziList.value.forEach((item) => {
    if (item.type === 'word' && item.part_of_speech) {
      let p = item.part_of_speech.trim().toLowerCase().replace(/[.,]/g, '')
      if (p)
        pos.add(p)
    }
  })

  const opts = [{ label: 'Любая', value: 'all' }]
  Array.from(pos).sort().forEach((p) => {
    opts.push({ label: p.charAt(0).toUpperCase() + p.slice(1), value: p })
  })
  return opts
})

// Подсчет активных фильтров для бейджа
const activeFiltersCount = computed(() => {
  let count = 0
  if (filterType.value !== 'all')
    count++
  if (filterType.value !== 'sentence') {
    if (filterHsk.value !== 'all')
      count++
    if (filterPos.value !== 'all')
      count++
  }
  return count
})

// Основной вычисляемый список с применением всех фильтров
const filteredList = computed(() => {
  return hanziList.value.filter((item) => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = item.char.toLowerCase().includes(q)
      || item.pinyin.toLowerCase().includes(q)
      || item.translation.toLowerCase().includes(q)

    const matchType = filterType.value === 'all' || item.type === filterType.value

    let matchHsk = true
    if (filterType.value !== 'sentence' && filterHsk.value !== 'all') {
      const hsk = item.hsk
      if (filterHsk.value === 'None') {
        matchHsk = !hsk || hsk === 'None' || hsk.toLowerCase() === 'none'
      }
      else {
        if (!hsk) {
          matchHsk = false
        }
        else {
          const numMatch = hsk.match(/\d+/)
          const normalizedItemHsk = numMatch ? `HSK ${numMatch[0]}` : hsk.trim()
          matchHsk = normalizedItemHsk === filterHsk.value
        }
      }
    }

    let matchPos = true
    if (filterType.value !== 'sentence' && filterPos.value !== 'all') {
      let itemPos = (item.part_of_speech || '').trim().toLowerCase().replace(/[.,]/g, '')
      matchPos = itemPos === filterPos.value
    }

    return matchSearch && matchType && matchHsk && matchPos
  })
})

async function loadSavedHanzi() {
  if (!state.backendUrl) {
    isLoading.value = false
    error.value = 'URL бэкенда не настроен'
    return
  }

  if (isLoading.value && abortController)
    abortController.abort()
  abortController = new AbortController()

  isLoading.value = true
  error.value = ''

  try {
    const res = await fetch(`${state.backendUrl}/api/hanzi`, { signal: abortController.signal })
    if (!res.ok)
      throw new Error(`HTTP: ${res.status}`)
    hanziList.value = await res.json()
  }
  catch (e: unknown) {
    if (e instanceof Error && e.name !== 'AbortError') {
      error.value = `Не удалось загрузить базу: ${e.message}`
    }
  }
  finally {
    isLoading.value = false
  }
}

watch(() => state.backendUrl, (val) => {
  if (val)
    loadSavedHanzi()
}, { immediate: true })

watch(() => state.isManualInputOpen, (isOpen) => {
  if (!isOpen && state.backendUrl)
    loadSavedHanzi()
})

function toggleExpand(char: string) {
  if (expandedItems.value.has(char))
    expandedItems.value.delete(char)
  else expandedItems.value.add(char)
}

function speak(text: string) {
  if (!('speechSynthesis' in window))
    return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  window.speechSynthesis.speak(utterance)
}

async function removeHanzi(char: string) {
  const isConfirmed = await state.ctx?.confirm(`Удалить "${char}" из словаря?`)
  if (!isConfirmed)
    return

  try {
    await deleteHanziFromDb(char)
    hanziList.value = hanziList.value.filter(item => item.char !== char)
    state.ctx?.showToast?.('Успешно удалено', { type: 'success' })
  }
  catch (e: unknown) {
    if (e instanceof Error)
      state.ctx?.showToast?.(`Ошибка удаления: ${e.message}`, { type: 'error' })
  }
}

function isWordSaved(word: string) {
  return hanziList.value.some(h => h.char === word)
}

function addMissingWord(word: string) {
  state.manualInputTarget = word
  state.isManualInputOpen = true
}

function isWordsExpanded(char: string) {
  return expandedWordsItems.value.has(char)
}
function toggleWordsExpanded(char: string) {
  if (expandedWordsItems.value.has(char))
    expandedWordsItems.value.delete(char)
  else
    expandedWordsItems.value.add(char)
}

onUnmounted(() => {
  if (abortController)
    abortController.abort()
})
</script>

<template>
  <div class="hz-page custom-scrollbar">
    <header class="hz-page-header">
      <div class="hz-title-block">
        <h1>Словарь</h1>
        <span class="hz-count">{{ filteredList.length }} записей</span>
      </div>

      <div class="hz-actions">
        <KitBtn icon="mdi:plus" variant="tonal" color="primary" title="Добавить слово/фразу" @click="state.isManualInputOpen = true" />
        <KitBtn icon="mdi:refresh" variant="tonal" color="secondary" :disabled="isLoading" title="Обновить базу" @click="loadSavedHanzi" />
        <KitBtn icon="mdi:cog" variant="tonal" color="secondary" title="Настройки" @click="state.isSettingsOpen = true" />
      </div>
    </header>

    <!-- Продвинутая панель фильтров -->
    <div class="hz-advanced-filters">
      <div class="filter-top-row">
        <div class="filter-search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input v-model="searchQuery" class="filter-search-input" placeholder="Поиск по иероглифу, пиньиню или переводу...">
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <button
          class="advanced-filter-toggle"
          :class="{ active: showAdvancedFilters || activeFiltersCount > 0 }"
          title="Расширенные фильтры"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
        </button>
      </div>

      <Transition name="expand-filters">
        <div v-show="showAdvancedFilters" class="filter-controls-wrapper">
          <div class="filter-controls">
            <div class="filter-group">
              <span class="filter-label">Показ:</span>
              <div class="chip-group">
                <button class="chip" :class="{ active: filterType === 'all' }" @click="filterType = 'all'">
                  Все
                </button>
                <button class="chip" :class="{ active: filterType === 'word' }" @click="filterType = 'word'">
                  Слова
                </button>
                <button class="chip" :class="{ active: filterType === 'sentence' }" @click="filterType = 'sentence'">
                  Фразы
                </button>
              </div>
            </div>

            <Transition name="fade">
              <div v-if="filterType !== 'sentence' && availableHskLevels.length > 0" class="filter-group">
                <span class="filter-label">HSK:</span>
                <div class="chip-group hsk-chips custom-scrollbar">
                  <button class="chip" :class="{ active: filterHsk === 'all' }" @click="filterHsk = 'all'">
                    Любой
                  </button>
                  <button
                    v-for="level in availableHskLevels"
                    :key="level"
                    class="chip"
                    :class="{ active: filterHsk === level }"
                    @click="filterHsk = level"
                  >
                    {{ level === 'None' ? 'Вне HSK' : level.replace('HSK ', '') }}
                  </button>
                </div>
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="filterType !== 'sentence' && posOptions.length > 1" class="filter-group select-group">
                <span class="filter-label">Часть речи:</span>
                <KitSelect v-model="filterPos" :options="posOptions" />
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Отображение состояния загрузки (Skeleton) -->
    <div v-if="isLoading" class="hz-list">
      <div v-for="n in 5" :key="n" class="hz-list-item skeleton-item">
        <div class="item-main-row">
          <div class="item-content skeleton-content">
            <!-- Скелетон иероглифа -->
            <KitSkeleton width="80px" height="34px" border-radius="6px" />
            <!-- Скелетон перевода и пиньиня -->
            <div class="skeleton-text-group">
              <KitSkeleton width="60px" height="16px" border-radius="4px" />
              <KitSkeleton width="180px" height="16px" border-radius="4px" />
            </div>
          </div>
          <div class="item-right-actions">
            <!-- Скелетон бейджа -->
            <KitSkeleton width="48px" height="20px" border-radius="12px" />
            <!-- Скелетон шеврона -->
            <KitSkeleton width="20px" height="20px" border-radius="4px" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="hz-state hz-error">
      {{ error }}
    </div>
    <div v-else-if="filteredList.length === 0" class="hz-state">
      Ничего не найдено.
    </div>

    <div v-else class="hz-list">
      <div v-for="item in filteredList" :key="item.char" class="hz-list-item" :class="{ 'is-expanded': expandedItems.has(item.char) }">
        <div class="item-main-row" @click="toggleExpand(item.char)">
          <div class="item-content">
            <div
              class="item-char"
              :class="{ 'is-sentence': item.type === 'sentence' }"
            >
              {{ item.char }}
            </div>
            <div class="item-text-info">
              <span class="item-pinyin">{{ item.pinyin }}</span>
              <span v-if="item.pinyin && item.translation" class="item-sep">•</span>
              <span class="item-translation">{{ item.translation }}</span>
            </div>
          </div>

          <div class="item-right-actions">
            <span v-if="item.type === 'sentence'" class="badge type-badge">Фраза</span>
            <span v-else-if="item.hsk && item.hsk !== 'None'" class="badge hsk-badge">{{ item.hsk }}</span>
            <svg class="chevron" :class="{ rotated: expandedItems.has(item.char) }" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedItems.has(item.char)" class="item-details">
            <div class="details-action-bar">
              <KitBtn icon="mdi:volume-high" variant="tonal" color="secondary" size="sm" @click.stop="speak(item.char)">
                Озвучить
              </KitBtn>

              <button class="hz-delete-action" title="Удалить" @click.stop="removeHanzi(item.char)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>

            <!-- Рендер слова -->
            <template v-if="item.type === 'word' || !item.type">
              <div v-if="item.components?.length" class="detail-block">
                <strong>Ключи:</strong>
                <div class="comp-list">
                  <span v-for="c in item.components" :key="c" class="comp-tag">{{ c }}</span>
                </div>
              </div>
              <div v-if="item.etymology" class="detail-block">
                <strong>Этимология:</strong>
                <p>{{ item.etymology }}</p>
              </div>
              <div class="detail-block">
                <strong>Мета:</strong>
                <span class="meta-info">Черт: {{ item.strokes || '?' }} | Часть речи: {{ item.part_of_speech || '?' }}</span>
              </div>
            </template>

            <!-- Рендер фразы -->
            <template v-else-if="item.type === 'sentence'">
              <div v-if="item.words_breakdown?.length" class="hz-section">
                <div class="hz-section-title">
                  Составные слова
                </div>

                <HzWordsCompact
                  :words="item.words_breakdown"
                  :expanded="isWordsExpanded(item.char)"
                  @toggle="toggleWordsExpanded(item.char)"
                  @word-click="addMissingWord"
                >
                  <template #expanded>
                    <div class="hz-words-grid">
                      <div v-for="(w, i) in item.words_breakdown" :key="i" class="hz-word-item">
                        <div class="w-info">
                          <span class="w-char interactive-text" title="Действия" @click.stop="openPopover($event, w.word)">{{ w.word }}</span>
                          <span class="w-pinyin">{{ w.pinyin }}</span>
                        </div>
                        <span class="w-trans">{{ w.translation }}</span>

                        <button
                          v-if="!isWordSaved(w.word)"
                          class="hz-sub-action add-btn"
                          title="Анализировать / Добавить"
                          @click.stop="addMissingWord(w.word)"
                        >
                          +
                        </button>
                        <span v-else class="hz-sub-action added-mark" title="Уже в словаре">✓</span>
                      </div>
                      <button class="hz-collapse-btn" @click.stop="toggleWordsExpanded(item.char)">
                        Свернуть
                      </button>
                    </div>
                  </template>
                </HzWordsCompact>
              </div>

              <div v-if="item.words_breakdown?.length" class="hz-section">
                <div class="hz-section-title">
                  Разбор предложения
                </div>
                <div class="hz-syntax-list">
                  <div v-for="(w, i) in item.words_breakdown" :key="`sa-${i}`" class="sa-item">
                    <div class="sa-bullet" />
                    <div class="sa-content">
                      <div class="sa-head">
                        <span class="sa-char interactive-text" title="Действия" @click.stop="openPopover($event, w.word)">{{ w.word }}</span>
                        <span class="sa-pinyin">({{ w.pinyin }})</span>
                        <span class="sa-dash">—</span>
                        <span class="sa-trans">{{ w.translation }}</span>
                        <span v-if="w.grammar_role" class="sa-role">[{{ w.grammar_role }}]</span>
                      </div>
                      <div v-if="w.explanation" class="sa-desc">
                        {{ w.explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="item.grammar_notes" class="hz-section">
                <div class="hz-section-title">
                  Общая грамматика
                </div>
                <p class="hz-grammar">
                  {{ item.grammar_notes }}
                </p>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <SettingsModal v-if="state.isSettingsOpen" @close="state.isSettingsOpen = false" />
    <HanziActionPopover />
  </div>
</template>

<style scoped>
.interactive-text {
  cursor: pointer;
  transition:
    color 0.2s,
    opacity 0.2s;
}
.interactive-text:hover {
  color: var(--fg-accent-color);
  opacity: 0.8;
}

.hz-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 8px;
  font-family: inherit;
  width: 100%;
}
.hz-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.hz-title-block h1 {
  margin: 0 0 6px 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--fg-primary-color);
}
.hz-count {
  color: var(--fg-muted-color);
  font-size: 0.9rem;
  font-weight: 500;
}
.hz-actions {
  display: flex;
  gap: 8px;
}

/* Расширенные фильтры */
.hz-advanced-filters {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.filter-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: var(--fg-muted-color);
  pointer-events: none;
}
.filter-search-input {
  width: 100%;
  height: 44px;
  padding: 0 40px;
  border-radius: 8px;
  border: 1px solid var(--border-primary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.filter-search-input:focus {
  outline: none;
  border-color: var(--fg-accent-color);
}
.clear-search-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--fg-muted-color);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition:
    color 0.2s,
    background 0.2s;
}
.clear-search-btn:hover {
  color: var(--fg-primary-color);
  background: var(--bg-tertiary-color);
}

.advanced-filter-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid var(--border-primary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-secondary-color);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.advanced-filter-toggle:hover {
  border-color: var(--fg-accent-color);
  color: var(--fg-accent-color);
}
.advanced-filter-toggle.active {
  color: var(--fg-accent-color);
  border-color: var(--fg-accent-color);
  background: rgba(var(--bg-accent-color-rgb), 0.1);
}
.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.filter-controls-wrapper {
  overflow: hidden;
}
.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px dashed var(--border-secondary-color);
  margin-top: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
  white-space: nowrap;
}

.chip-group {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}
.hsk-chips {
  overflow-x: auto;
  padding-bottom: 2px;
}

.chip {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  color: var(--fg-secondary-color);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.chip:hover {
  border-color: var(--fg-accent-color);
  color: var(--fg-accent-color);
}
.chip.active {
  background: var(--fg-accent-color);
  border-color: var(--fg-accent-color);
  color: var(--bg-primary-color);
  box-shadow: 0 2px 6px rgba(var(--fg-accent-color-rgb), 0.2);
}

.select-group {
  min-width: 140px;
}

/* Анимации фильтров */
.expand-filters-enter-active,
.expand-filters-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  opacity: 1;
}
.expand-filters-enter-from,
.expand-filters-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  border-top-color: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
/* Конец фильтров */

.hz-state {
  padding: 40px;
  text-align: center;
  color: var(--fg-secondary-color);
  background: var(--bg-primary-color);
  border-radius: 12px;
  border: 1px dashed var(--border-secondary-color);
}
.hz-error {
  color: var(--fg-error-color);
  border-color: rgba(var(--bg-error-color-rgb), 0.3);
  background: rgba(var(--bg-error-color-rgb), 0.05);
}

.hz-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hz-list-item {
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 10px;
  overflow: hidden;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.hz-list-item:hover {
  border-color: var(--border-primary-color);
}
.hz-list-item.is-expanded {
  border-color: var(--border-focus-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Стили скелетона */
.skeleton-item {
  pointer-events: none;
}
.skeleton-content {
  gap: 8px;
}
.skeleton-text-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 2px;
}

.item-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
  cursor: pointer;
  user-select: none;
}
.item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.item-char {
  font-size: 1.7rem;
  font-weight: 400;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.item-char.is-sentence {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-text-info {
  font-size: 0.95rem;
  line-height: 1.4;
  opacity: 0.85;
  word-break: break-word;
}
.item-pinyin {
  font-weight: 600;
  color: var(--fg-accent-color);
}
.item-sep {
  color: var(--fg-muted-color);
  font-size: 0.8rem;
  margin: 0 6px;
  display: inline-block;
  vertical-align: middle;
}
.item-translation {
  color: var(--fg-secondary-color);
}

.item-right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}
.hsk-badge {
  background: rgba(var(--fg-accent-color-rgb), 0.1);
  color: var(--fg-accent-color);
  border: 1px solid rgba(var(--fg-accent-color-rgb), 0.3);
}
.type-badge {
  background: var(--bg-tertiary-color);
  color: var(--fg-muted-color);
  border: 1px solid var(--border-secondary-color);
}
.chevron {
  color: var(--fg-muted-color);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.chevron.rotated {
  transform: rotate(180deg);
  color: var(--fg-primary-color);
}

.item-details {
  position: relative;
  padding: 0 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px dashed var(--border-secondary-color);
  margin-top: -4px;
  padding-top: 16px;
}

.details-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.hz-delete-action {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--fg-error-color);
  border: 1px solid transparent;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.hz-delete-action:hover {
  background: rgba(var(--bg-error-color-rgb), 0.1);
  border-color: rgba(var(--bg-error-color-rgb), 0.2);
}

.detail-block strong {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--fg-muted-color);
  margin-bottom: 6px;
}
.detail-block p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--fg-secondary-color);
  line-height: 1.5;
}

.comp-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.comp-tag {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--fg-primary-color);
}
.meta-info {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
}

.hz-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hz-section-title {
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--fg-primary-color);
  text-transform: uppercase;
  opacity: 0.7;
}

.hz-collapse-btn {
  background: none;
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  align-self: flex-start;
}
.hz-collapse-btn:hover {
  text-decoration: underline;
}

.hz-words-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hz-word-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-tertiary-color);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}
.hz-word-item:hover {
  border-color: var(--border-primary-color);
}

.w-info {
  display: flex;
  flex-direction: column;
  min-width: 80px;
}
.w-char {
  font-weight: bold;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.15rem;
  line-height: 1.2;
}
.w-pinyin {
  color: var(--fg-accent-color);
  font-size: 0.8rem;
}
.w-trans {
  flex: 1;
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
  line-height: 1.3;
}

.hz-sub-action {
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  white-space: nowrap;
}
.add-btn {
  background: var(--bg-primary-color);
  color: var(--fg-accent-color);
  border: 1px solid var(--fg-accent-color);
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover {
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
}
.added-mark {
  background: rgba(var(--bg-success-color-rgb), 0.1);
  color: var(--fg-success-color);
  border: 1px solid transparent;
}

.hz-syntax-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-tertiary-color);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
}
.sa-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.sa-bullet {
  width: 6px;
  height: 6px;
  background-color: var(--fg-accent-color);
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}
.sa-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sa-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 0.95rem;
}
.sa-char {
  font-weight: 700;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.1rem;
}
.sa-pinyin {
  font-weight: 600;
  color: var(--fg-primary-color);
}
.sa-dash {
  color: var(--fg-muted-color);
}
.sa-trans {
  color: var(--fg-secondary-color);
}
.sa-role {
  font-size: 0.75rem;
  color: var(--fg-accent-color);
  background: rgba(var(--bg-accent-color-rgb), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 4px;
}
.sa-desc {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  line-height: 1.4;
  opacity: 0.9;
}

.hz-grammar {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--fg-secondary-color);
  background: rgba(var(--border-accent-color-rgb), 0.05);
  padding: 12px;
  border-left: 3px solid var(--fg-accent-color);
  border-radius: 0 8px 8px 0;
  margin: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 1500px;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  .chip-group {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .item-main-row {
    padding: 12px;
    gap: 10px;
    align-items: flex-start;
  }
  .item-char {
    font-size: 1.4rem;
  }
  .item-badges {
    display: none;
  }

  .item-text-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .item-sep {
    display: none;
  }
}
</style>
