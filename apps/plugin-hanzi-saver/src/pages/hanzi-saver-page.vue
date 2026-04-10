<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SettingsModal from '../components/settings-modal.vue' // Импортируем компонент настроек
import { state } from '../store/hanzi-saver.store'

const hanziList = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')

async function loadSavedHanzi() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch(`${state.backendUrl}/api/hanzi`)
    if (!res.ok)
      throw new Error(`HTTP: ${res.status}`)
    hanziList.value = await res.json()
  }
  catch (e: any) {
    error.value = `Не удалось загрузить базу: ${e.message}`
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSavedHanzi()
})
</script>

<template>
  <div class="hz-page custom-scrollbar">
    <header class="hz-page-header">
      <div class="hz-title-block">
        <h1>Мой Словарь</h1>
        <span class="hz-count">{{ hanziList.length }} слов</span>
      </div>

      <!-- Блок с кнопками действий -->
      <div class="hz-actions">
        <button class="hz-btn-action" :disabled="isLoading" @click="loadSavedHanzi">
          Обновить
        </button>
        <button class="hz-btn-action icon" title="Настройки" @click="state.isSettingsOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="hz-state">
      Загрузка...
    </div>
    <div v-else-if="error" class="hz-state hz-error">
      {{ error }}
    </div>
    <div v-else-if="hanziList.length === 0" class="hz-state">
      Словарь пуст. Выделите иероглиф в тексте, чтобы добавить!
    </div>

    <div v-else class="hz-grid">
      <div v-for="item in hanziList" :key="item.char" class="hz-card">
        <div class="hz-card-top">
          <div class="hz-card-char">
            {{ item.char }}
          </div>
          <div class="hz-card-info">
            <div class="hz-card-pinyin">
              {{ item.pinyin }}
            </div>
            <div class="hz-card-translation">
              {{ item.translation }}
            </div>
          </div>
        </div>

        <div class="hz-card-meta">
          <span v-if="item.hsk && item.hsk !== 'None'" class="hz-badge">{{ item.hsk }}</span>
          <span v-if="item.strokes" class="hz-badge">{{ item.strokes }} черт</span>
          <span v-if="item.part_of_speech" class="hz-badge pos">{{ item.part_of_speech }}</span>
        </div>

        <div v-if="item.components?.length" class="hz-card-components">
          <span v-for="c in item.components" :key="c" class="hz-comp">{{ c }}</span>
        </div>

        <div v-if="item.etymology" class="hz-card-etymology custom-scrollbar">
          {{ item.etymology }}
        </div>
      </div>
    </div>

    <!-- Модальное окно настроек -->
    <SettingsModal v-if="state.isSettingsOpen" @close="state.isSettingsOpen = false" />
  </div>
</template>

<style scoped>
/* Обновленные стили для pages/hanzi-saver-page.vue */
.hz-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  color: var(--fg-primary-color);
  font-family: inherit;
}
.hz-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 16px;
  margin-bottom: 32px;
}
.hz-title-block h1 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  letter-spacing: -0.5px;
}
.hz-count {
  color: var(--fg-accent-color);
  font-weight: 600;
  font-size: 0.95rem;
  background: rgba(var(--fg-accent-color-rgb), 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  margin-top: 8px;
  display: inline-block;
}

/* Кнопки действий */
.hz-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.hz-btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid transparent;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.hz-btn-action.icon {
  padding: 8px;
  border-radius: 8px;
}
.hz-btn-action:hover {
  background: var(--bg-hover-color);
  border-color: var(--border-primary-color);
  color: var(--fg-accent-color);
}

/* Сетка и Карточки */
.hz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.hz-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}
.hz-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--fg-accent-color), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.hz-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-primary-color);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}
.hz-card:hover::before {
  opacity: 1;
}

.hz-card-top {
  display: flex;
  gap: 20px;
  align-items: center;
}
.hz-card-char {
  font-size: 4rem;
  font-weight: 500;
  line-height: 1;
  color: var(--fg-accent-color);
  font-family: 'Maple Mono CN', sans-serif;
  text-shadow: 0 4px 12px rgba(var(--fg-accent-color-rgb), 0.2);
}
.hz-card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.hz-card-pinyin {
  font-size: 1.15rem;
  color: var(--fg-primary-color);
  font-weight: 700;
  letter-spacing: 0.5px;
}
.hz-card-translation {
  font-size: 0.95rem;
  color: var(--fg-secondary-color);
  line-height: 1.4;
}

.hz-card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.hz-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-tertiary-color);
  padding: 4px 10px;
  border-radius: 6px;
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-secondary-color);
}
.hz-badge.pos {
  color: var(--fg-accent-color);
  background: rgba(var(--fg-accent-color-rgb), 0.1);
  border-color: rgba(var(--fg-accent-color-rgb), 0.2);
}

.hz-card-components {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-secondary-color);
}
.hz-comp {
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.hz-card-etymology {
  font-size: 0.85rem;
  color: var(--fg-muted-color);
  line-height: 1.6;
  background: var(--bg-tertiary-color);
  padding: 12px;
  border-radius: 10px;
  max-height: 120px;
  overflow-y: auto;
  border-left: 3px solid var(--border-primary-color);
}
</style>
