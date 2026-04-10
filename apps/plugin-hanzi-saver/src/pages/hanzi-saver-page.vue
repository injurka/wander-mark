<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
      <button class="hz-refresh-btn" :disabled="isLoading" @click="loadSavedHanzi">
        🔄 Обновить
      </button>
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
  </div>
</template>

<style scoped>
.hz-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  color: var(--fg-primary-color);
  font-family: var(--lang-font, inherit);
}
.hz-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid var(--border-secondary-color);
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.hz-title-block h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--fg-primary-color);
}
.hz-count {
  color: var(--fg-accent-color);
  font-weight: bold;
  font-size: 0.9rem;
}
.hz-refresh-btn {
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.hz-refresh-btn:hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
}

.hz-state {
  text-align: center;
  padding: 40px;
  color: var(--fg-muted-color);
  font-size: 1.1rem;
}
.hz-error {
  color: #ef4444;
}

.hz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.hz-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.hz-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-focus-color);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.hz-card-top {
  display: flex;
  gap: 16px;
  align-items: center;
}
.hz-card-char {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
}
.hz-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hz-card-pinyin {
  font-size: 1.1rem;
  color: var(--fg-accent-color);
  font-weight: 600;
}
.hz-card-translation {
  font-size: 1rem;
  color: var(--fg-secondary-color);
  line-height: 1.3;
}

.hz-card-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.hz-badge {
  font-size: 0.75rem;
  background: var(--bg-tertiary-color);
  padding: 2px 8px;
  border-radius: 12px;
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-secondary-color);
}
.hz-badge.pos {
  color: var(--fg-accent-color);
  border-color: rgba(var(--fg-accent-color-rgb), 0.3);
  background: rgba(var(--fg-accent-color-rgb), 0.1);
}

.hz-card-components {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-secondary-color);
}
.hz-comp {
  background: var(--bg-primary-color);
  border: 1px solid var(--border-primary-color);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.hz-card-etymology {
  font-size: 0.85rem;
  color: var(--fg-muted-color);
  line-height: 1.5;
  background: rgba(var(--bg-primary-color-rgb), 0.5);
  padding: 10px;
  border-radius: 8px;
  max-height: 100px;
  overflow-y: auto;
}
</style>
