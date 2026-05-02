<script setup lang="ts">
import type { HanziData } from '../types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SettingsModal from '../components/settings-modal.vue'
import { deleteHanziFromDb } from '../services/db.service'
import { state } from '../store/hanzi-saver.store'

const hanziList = ref<HanziData[]>([])
const isLoading = ref(true)
const error = ref('')
let abortController: AbortController | null = null

// Базовые фильтры
const searchQuery = ref('')
const filterType = ref('all')
const showAdvancedFilters = ref(false)

// Расширенные фильтры
const filterHsk = ref('all')
const filterPoS = ref('all')
const sortBy = ref('default')

const expandedItems = ref<Set<string>>(new Set())

// Статические опции
const filterOptions = [
  { label: 'Все записи', value: 'all' },
  { label: 'Слова/Иероглифы', value: 'word' },
  { label: 'Предложения', value: 'sentence' },
]

const sortOptions = [
  { label: 'По умолчанию', value: 'default' },
  { label: 'Пиньинь (A-Z)', value: 'pinyin_asc' },
  { label: 'Черты (меньше → больше)', value: 'strokes_asc' },
  { label: 'Черты (больше → меньше)', value: 'strokes_desc' },
]

// Динамические опции на основе данных из БД
const availableHskLevels = computed(() => {
  const levels = new Set<string>()
  hanziList.value.forEach((item) => {
    if (item.type === 'word' && item.hsk && item.hsk !== 'None') {
      levels.add(item.hsk)
    }
  })
  return Array.from(levels).sort()
})

const hskOptions = computed(() => [
  { label: 'Любой уровень', value: 'all' },
  ...availableHskLevels.value.map(l => ({ label: l, value: l })),
])

const availablePoS = computed(() => {
  const pos = new Set<string>()
  hanziList.value.forEach((item) => {
    if (item.type === 'word' && item.part_of_speech) {
      pos.add(item.part_of_speech.toLowerCase().trim())
    }
  })
  return Array.from(pos).sort()
})

const posOptions = computed(() => [
  { label: 'Любая часть речи', value: 'all' },
  ...availablePoS.value.map(p => ({ label: p.charAt(0).toUpperCase() + p.slice(1), value: p })),
])

// Сброс нерелевантных фильтров при выборе "Предложений"
watch(filterType, (newType) => {
  if (newType === 'sentence') {
    filterHsk.value = 'all'
    filterPoS.value = 'all'
    if (sortBy.value.includes('strokes')) {
      sortBy.value = 'default'
    }
  }
})

// Подсчет активных расширенных фильтров для бейджика
const activeFiltersCount = computed(() => {
  let count = 0
  if (filterType.value !== 'all')
    count++
  if (filterHsk.value !== 'all')
    count++
  if (filterPoS.value !== 'all')
    count++
  if (sortBy.value !== 'default')
    count++
  return count
})

function resetFilters() {
  searchQuery.value = ''
  filterType.value = 'all'
  filterHsk.value = 'all'
  filterPoS.value = 'all'
  sortBy.value = 'default'
}

async function loadSavedHanzi() {
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

watch(() => state.isManualInputOpen, (isOpen) => {
  if (!isOpen)
    loadSavedHanzi()
})

const filteredList = computed(() => {
  let result = hanziList.value.filter((item) => {
    // Поиск
    const q = searchQuery.value.toLowerCase()
    const matchSearch = item.char.toLowerCase().includes(q)
      || item.pinyin.toLowerCase().includes(q)
      || item.translation.toLowerCase().includes(q)

    // Тип записи
    const matchType = filterType.value === 'all' || item.type === filterType.value

    // HSK
    const matchHsk = filterHsk.value === 'all' || item.hsk === filterHsk.value

    // Часть речи
    const matchPoS = filterPoS.value === 'all'
      || (item.part_of_speech && item.part_of_speech.toLowerCase().trim() === filterPoS.value)

    return matchSearch && matchType && matchHsk && matchPoS
  })

  // Сортировка
  if (sortBy.value === 'pinyin_asc') {
    result.sort((a, b) => a.pinyin.localeCompare(b.pinyin))
  }
  else if (sortBy.value === 'strokes_asc') {
    result.sort((a, b) => (a.strokes || 0) - (b.strokes || 0))
  }
  else if (sortBy.value === 'strokes_desc') {
    result.sort((a, b) => (b.strokes || 0) - (a.strokes || 0))
  }

  return result
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

onMounted(() => loadSavedHanzi())
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

    <div class="hz-filter-section">
      <div class="hz-search-row">
        <div class="hz-search-input">
          <KitInput v-model="searchQuery" placeholder="Поиск по иероглифу, пиньиню или переводу..." />
        </div>
        <button
          class="hz-filter-toggle-btn"
          :class="{ 'is-active': showAdvancedFilters || activeFiltersCount > 0 }"
          title="Расширенные фильтры"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
        </button>
      </div>

      <Transition name="slide-down">
        <div v-if="showAdvancedFilters" class="hz-advanced-filters">
          <div class="filter-grid">
            <div class="filter-group">
              <label>Тип записи</label>
              <KitSelect v-model="filterType" :options="filterOptions" />
            </div>

            <div class="filter-group">
              <label>Сортировка</label>
              <KitSelect v-model="sortBy" :options="sortOptions" />
            </div>

            <template v-if="filterType !== 'sentence'">
              <div class="filter-group">
                <label>Уровень HSK</label>
                <KitSelect v-model="filterHsk" :options="hskOptions" />
              </div>

              <div class="filter-group">
                <label>Часть речи</label>
                <KitSelect v-model="filterPoS" :options="posOptions" />
              </div>
            </template>
          </div>

          <div v-if="activeFiltersCount > 0" class="hz-filter-actions">
            <span class="reset-link" @click="resetFilters">Сбросить все фильтры</span>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="isLoading" class="hz-state">
      <span class="spinner" /> Загрузка базы...
    </div>
    <div v-else-if="error" class="hz-state hz-error">
      {{ error }}
    </div>
    <div v-else-if="filteredList.length === 0" class="hz-state empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
      <p>Ничего не найдено по текущим фильтрам.</p>
      <button v-if="activeFiltersCount > 0 || searchQuery" class="hz-btn text-primary" @click="resetFilters">
        Сбросить поиск
      </button>
    </div>

    <div v-else class="hz-list">
      <div v-for="item in filteredList" :key="item.char" class="hz-list-item" :class="{ 'is-expanded': expandedItems.has(item.char) }">
        <div class="item-main-row" @click="toggleExpand(item.char)">
          <div class="item-content">
            <div class="item-char" :class="{ 'is-sentence': item.type === 'sentence' }">
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
            <span v-if="item.type === 'word' && item.part_of_speech" class="badge pos-badge">{{ item.part_of_speech }}</span>
            <svg class="chevron" :class="{ rotated: expandedItems.has(item.char) }" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedItems.has(item.char)" class="item-details">
            <button class="hz-delete-btn" title="Удалить запись" @click.stop="removeHanzi(item.char)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>

            <div class="details-action-bar">
              <KitBtn icon="mdi:volume-high" variant="tonal" color="secondary" size="sm" @click.stop="speak(item.char)">
                Озвучить
              </KitBtn>
            </div>

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
              <div class="detail-block meta-block">
                <div class="meta-item">
                  <span class="meta-label">Кол-во черт:</span>
                  <span class="meta-value">{{ item.strokes || '?' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Уровень HSK:</span>
                  <span class="meta-value">{{ item.hsk && item.hsk !== 'None' ? item.hsk : 'Не указан' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Часть речи:</span>
                  <span class="meta-value">{{ item.part_of_speech || 'Неизвестно' }}</span>
                </div>
              </div>
            </template>

            <template v-else-if="item.type === 'sentence'">
              <div v-if="item.words_breakdown?.length" class="detail-block">
                <strong>Составные слова:</strong>
                <div class="words-grid">
                  <div v-for="(w, i) in item.words_breakdown" :key="i" class="wg-item">
                    <div class="wg-left">
                      <span class="wg-char">{{ w.word }}</span>
                      <span class="wg-pinyin">{{ w.pinyin }}</span>
                    </div>
                    <span class="wg-trans">{{ w.translation }}</span>

                    <button v-if="!isWordSaved(w.word)" class="wg-add-btn" title="Добавить слово" @click.stop="addMissingWord(w.word)">
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="item.grammar_notes" class="detail-block">
                <strong>Грамматика:</strong>
                <p class="grammar-text">
                  {{ item.grammar_notes }}
                </p>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <SettingsModal v-if="state.isSettingsOpen" @close="state.isSettingsOpen = false" />
  </div>
</template>

<style scoped>
.hz-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: inherit;
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

/* Фильтры */
.hz-filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 12px;
}

.hz-search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.hz-search-input {
  flex: 1;
}

.hz-filter-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-secondary-color);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.hz-filter-toggle-btn:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-primary-color);
}
.hz-filter-toggle-btn.is-active {
  background: rgba(var(--bg-accent-color-rgb), 0.1);
  color: var(--fg-accent-color);
  border-color: var(--fg-accent-color);
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hz-advanced-filters {
  border-top: 1px dashed var(--border-secondary-color);
  padding-top: 16px;
  margin-top: 4px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--fg-muted-color);
  text-transform: uppercase;
}

.hz-filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.reset-link {
  font-size: 0.85rem;
  color: var(--fg-error-color);
  cursor: pointer;
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.reset-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 400px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  margin-top: 0;
  border-top-color: transparent;
}

/* Состояния */
.hz-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--fg-secondary-color);
  font-size: 1rem;
  gap: 12px;
}
.hz-error {
  color: var(--fg-error-color);
}
.empty-state .empty-icon {
  color: var(--border-primary-color);
  margin-bottom: 8px;
}
.hz-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}
.text-primary {
  color: var(--fg-accent-color);
}
.text-primary:hover {
  text-decoration: underline;
}

/* Список */
.hz-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  font-size: 1.8rem;
  font-weight: 400;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.item-char.is-sentence {
  font-size: 1.15rem;
  font-weight: 500;
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
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
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
.pos-badge {
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  border: 1px dashed var(--border-primary-color);
}

.chevron {
  color: var(--fg-muted-color);
  transition: transform 0.2s;
  flex-shrink: 0;
  margin-left: 4px;
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

.hz-delete-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-secondary-color);
  color: var(--fg-muted-color);
  border: 1px solid var(--border-secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}
.hz-delete-btn:hover {
  background: rgba(var(--bg-error-color-rgb), 0.1);
  color: var(--fg-error-color);
  border-color: rgba(var(--bg-error-color-rgb), 0.3);
}

.details-action-bar {
  margin-bottom: 4px;
}
.detail-block strong {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--fg-muted-color);
  margin-bottom: 8px;
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
  gap: 8px;
}
.comp-tag {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--fg-primary-color);
}

.meta-block {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  background: var(--bg-secondary-color);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label {
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  text-transform: uppercase;
}
.meta-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--fg-primary-color);
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.wg-item {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 10px 12px;
  border-radius: 8px;
  gap: 6px;
}
.wg-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wg-char {
  font-weight: 700;
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.15rem;
  color: var(--fg-primary-color);
}
.wg-pinyin {
  color: var(--fg-accent-color);
  font-size: 0.85rem;
}
.wg-trans {
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
  line-height: 1.3;
}

.wg-add-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  color: var(--fg-accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}
.wg-add-btn:hover {
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  border-color: var(--fg-accent-color);
}

.grammar-text {
  background: rgba(var(--bg-accent-color-rgb), 0.05);
  padding: 14px;
  border-left: 3px solid var(--fg-accent-color);
  border-radius: 0 8px 8px 0;
  padding-right: 48px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 1000px;
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
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .item-main-row {
    padding: 12px;
    gap: 10px;
    align-items: flex-start;
  }
  .item-char {
    font-size: 1.4rem;
  }
  .item-right-actions .badge {
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
