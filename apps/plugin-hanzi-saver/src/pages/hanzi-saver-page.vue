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

const searchQuery = ref('')
const filterType = ref('all')
const expandedItems = ref<Set<string>>(new Set())

const filterOptions = [
  { label: 'Все записи', value: 'all' },
  { label: 'Только слова', value: 'word' },
  { label: 'Только предложения', value: 'sentence' },
]

async function loadSavedHanzi() {
  if (isLoading.value && abortController)
    abortController.abort()
  abortController = new AbortController()

  isLoading.value = true
  error.value = ''

  console.log('state.backendUrl}/api/hanzi', `${state.backendUrl}/api/hanzi`)

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
  return hanziList.value.filter((item) => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = item.char.toLowerCase().includes(q)
      || item.pinyin.toLowerCase().includes(q)
      || item.translation.toLowerCase().includes(q)
    const matchType = filterType.value === 'all' || item.type === filterType.value

    return matchSearch && matchType
  })
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
  if (!confirm(`Удалить "${char}" из словаря?`))
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

    <div class="hz-filters">
      <div class="filter-search">
        <KitInput v-model="searchQuery" placeholder="Поиск по иероглифу, пиньиню или переводу..." />
      </div>
      <div class="filter-type">
        <KitSelect v-model="filterType" :options="filterOptions" />
      </div>
    </div>

    <div v-if="isLoading" class="hz-state">
      Загрузка...
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
              <div class="detail-block">
                <strong>Мета:</strong>
                <span class="meta-info">Черт: {{ item.strokes || '?' }} | Часть речи: {{ item.part_of_speech || '?' }}</span>
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
  width: 100%;
}
.hz-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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
.hz-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.filter-search {
  flex: 1;
}
.filter-type {
  flex: 0 0 200px;
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
  font-weight: 700;
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

/* Изменено: Убрано жесткое обрезание, текст будет переноситься как абзац */
.item-text-info {
  font-size: 0.95rem;
  line-height: 1.4;
  opacity: 0.85;
  word-break: break-word; /* Позволяет переносить длинные слова на новую строку */
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

.hz-delete-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-primary-color);
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
  background: var(--fg-error-color);
  color: #fff;
  border-color: var(--fg-error-color);
  transform: translateY(-2px);
}

.details-action-bar {
  margin-bottom: 4px;
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

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding-right: 36px;
}
.wg-item {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 8px 12px;
  border-radius: 8px;
  gap: 4px;
}
.wg-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wg-char {
  font-weight: 700;
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.1rem;
  color: var(--fg-primary-color);
}
.wg-pinyin {
  color: var(--fg-accent-color);
  font-size: 0.85rem;
}
.wg-trans {
  color: var(--fg-secondary-color);
  font-size: 0.85rem;
  line-height: 1.2;
}

.wg-add-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  color: var(--fg-accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.wg-add-btn:hover {
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
  border-color: var(--fg-accent-color);
}

.grammar-text {
  background: rgba(var(--border-accent-color-rgb), 0.05);
  padding: 12px;
  border-left: 3px solid var(--fg-accent-color);
  border-radius: 0 8px 8px 0;
  padding-right: 48px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 800px;
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
  .hz-filters {
    flex-direction: column;
  }
  .filter-type {
    width: 100%;
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

  /* Мобильная версия: Пиньинь сверху, перевод снизу без точки-разделителя */
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
