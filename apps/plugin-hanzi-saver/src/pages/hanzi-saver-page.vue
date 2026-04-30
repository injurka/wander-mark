<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SettingsModal from '../components/settings-modal.vue'
import { state } from '../store/hanzi-saver.store'

const hanziList = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')
let abortController: AbortController | null = null

// Состояния фильтров
const searchQuery = ref('')
const filterType = ref('all')
const expandedItems = ref<Set<string>>(new Set())

onUnmounted(() => {
  if (abortController)
    abortController.abort()
})

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
  catch (e: any) {
    if (e.name !== 'AbortError')
      error.value = `Не удалось загрузить базу: ${e.message}`
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => loadSavedHanzi())

const filteredList = computed(() => {
  return hanziList.value.filter((item) => {
    // Поиск
    const q = searchQuery.value.toLowerCase()
    const matchSearch = item.char.toLowerCase().includes(q)
      || item.pinyin.toLowerCase().includes(q)
      || item.translation.toLowerCase().includes(q)
    // Тип
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
</script>

<template>
  <div class="hz-page custom-scrollbar">
    <header class="hz-page-header">
      <div class="hz-title-block">
        <h1>Словарь</h1>
        <span class="hz-count">{{ filteredList.length }} записей</span>
      </div>

      <div class="hz-actions">
        <button class="hz-btn-action" :disabled="isLoading" @click="loadSavedHanzi">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
        </button>
        <button class="hz-btn-action" title="Настройки" @click="state.isSettingsOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
      </div>
    </header>

    <div class="hz-filters">
      <input v-model="searchQuery" type="text" class="hz-input" placeholder="Поиск по иероглифу, пиньиню или переводу...">
      <select v-model="filterType" class="hz-input select">
        <option value="all">
          Все записи
        </option>
        <option value="word">
          Только слова
        </option>
        <option value="sentence">
          Только предложения
        </option>
      </select>
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
          <button class="tts-btn" title="Озвучить" @click.stop="speak(item.char)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
          </button>

          <div class="item-char" :class="{ 'is-sentence': item.type === 'sentence' }">
            {{ item.char }}
          </div>

          <div class="item-text-info">
            <span class="item-pinyin">{{ item.pinyin }}</span>
            <span class="item-translation">{{ item.translation }}</span>
          </div>

          <div class="item-badges">
            <span v-if="item.type === 'sentence'" class="badge type-badge">Фраза</span>
            <span v-else-if="item.hsk && item.hsk !== 'None'" class="badge hsk-badge">{{ item.hsk }}</span>
          </div>

          <svg class="chevron" :class="{ rotated: expandedItems.has(item.char) }" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
        </div>

        <Transition name="expand">
          <div v-if="expandedItems.has(item.char)" class="item-details">
            <!-- ДЕТАЛИ ДЛЯ СЛОВА -->
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

            <!-- ДЕТАЛИ ДЛЯ ПРЕДЛОЖЕНИЯ -->
            <template v-else-if="item.type === 'sentence'">
              <div v-if="item.words_breakdown?.length" class="detail-block">
                <strong>Словарь:</strong>
                <div class="words-breakdown">
                  <div v-for="(w, i) in item.words_breakdown" :key="i" class="wb-item">
                    <span class="wb-char">{{ w.word }}</span>
                    <span class="wb-pinyin">{{ w.pinyin }}</span>
                    <span class="wb-trans">{{ w.translation }}</span>
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
.hz-btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.hz-btn-action:hover {
  background: var(--bg-hover-color);
  color: var(--fg-accent-color);
  border-color: var(--border-focus-color);
}

.hz-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.hz-input {
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  color: var(--fg-primary-color);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}
.hz-input:focus {
  border-color: var(--fg-accent-color);
}
.hz-input.select {
  flex: 0 0 200px;
  cursor: pointer;
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
  transition: border-color 0.2s;
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
  align-items: center;
  padding: 14px 16px;
  gap: 16px;
  cursor: pointer;
  user-select: none;
}
.tts-btn {
  background: var(--bg-tertiary-color);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-secondary-color);
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}
.tts-btn:hover {
  background: var(--fg-accent-color);
  color: #fff;
  transform: scale(1.05);
}

.item-char {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  white-space: nowrap;
}
.item-char.is-sentence {
  font-size: 1.2rem;
  font-weight: 500;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 300px;
}

.item-text-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.item-pinyin {
  font-weight: 600;
  color: var(--fg-accent-color);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-translation {
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badges {
  display: flex;
  gap: 6px;
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
  padding: 0 16px 16px 64px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px dashed var(--border-secondary-color);
  margin-top: -4px;
  padding-top: 16px;
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
  font-size: 0.9rem;
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

.words-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wb-item {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
}
.wb-char {
  font-weight: 700;
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1rem;
  color: var(--fg-primary-color);
}
.wb-pinyin {
  color: var(--fg-accent-color);
  font-size: 0.8rem;
}
.wb-trans {
  color: var(--fg-secondary-color);
  font-size: 0.8rem;
}
.grammar-text {
  background: rgba(var(--border-accent-color-rgb), 0.05);
  padding: 12px;
  border-left: 3px solid var(--border-accent-color);
  border-radius: 0 8px 8px 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 500px;
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
  .hz-input.select {
    flex: none;
    width: 100%;
  }
  .item-main-row {
    padding: 12px;
    gap: 10px;
    flex-wrap: wrap;
  }
  .item-char {
    font-size: 1.5rem;
  }
  .item-details {
    padding-left: 16px;
  }
  .item-badges {
    display: none;
  }
}
</style>
