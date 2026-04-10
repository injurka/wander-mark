<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { checkHanziInDb, saveHanziToDb } from '../services/db.service'
import { pluginContext, state } from '../store/hanzi-saver.store'
import SettingsModal from './settings-modal.vue'

const props = defineProps<{ text: string }>()
const emit = defineEmits(['close'])

type Status = 'loading' | 'found' | 'not_found' | 'ai_loading' | 'analyzed' | 'error'
const status = ref<Status>('loading')
const data = ref<any>(null)
const errorMsg = ref('')

onMounted(async () => {
  try {
    const dbRecord = await checkHanziInDb(props.text)
    if (dbRecord) {
      data.value = dbRecord
      status.value = 'found'
    }
    else {
      status.value = 'not_found'
    }
  }
  catch (e: any) {
    errorMsg.value = `Ошибка БД: ${e.message}`
    status.value = 'error'
  }
})

async function runAnalysis() {
  status.value = 'ai_loading'
  try {
    const aiResult = await analyzeHanziWithAi(props.text)
    data.value = aiResult
    status.value = 'analyzed'
  }
  catch (e: any) {
    errorMsg.value = `Ошибка AI: ${e.message}`
    status.value = 'error'
  }
}

async function saveToDb() {
  try {
    await saveHanziToDb(data.value)
    pluginContext?.showToast('Иероглиф сохранен!', { type: 'success' })
    emit('close')
  }
  catch (e: any) {
    pluginContext?.showToast('Ошибка сохранения', { type: 'error' })
  }
}
</script>

<template>
  <div class="hz-tooltip-container">
    <!-- Header -->
    <div class="hz-header">
      <div class="hz-char">
        {{ text }}
      </div>
      <button class="hz-settings-btn" @click="state.isSettingsOpen = true">
        ⚙️
      </button>
    </div>

    <!-- State: Loading DB -->
    <div v-if="status === 'loading'" class="hz-center">
      <span class="spinner" /> Проверка БД...
    </div>

    <!-- State: Not Found -->
    <div v-else-if="status === 'not_found'" class="hz-center hz-col">
      <span class="hz-muted">Новое слово!</span>
      <button class="hz-btn primary" @click="runAnalysis">
        Сделать разбор (AI)
      </button>
    </div>

    <!-- State: AI Loading -->
    <div v-else-if="status === 'ai_loading'" class="hz-center">
      <span class="spinner" /> Нейронка думает...
    </div>

    <!-- State: Error -->
    <div v-else-if="status === 'error'" class="hz-error">
      {{ errorMsg }}
    </div>

    <!-- State: Found or Analyzed -->
    <div v-else-if="status === 'found' || status === 'analyzed'" class="hz-content">
      <div class="hz-pinyin">
        {{ data.pinyin }}
      </div>
      <div class="hz-translation">
        {{ data.translation }}
      </div>

      <div v-if="data.components?.length" class="hz-components">
        <span v-for="(comp, i) in data.components" :key="i" class="hz-tag">{{ comp }}</span>
      </div>

      <p v-if="data.etymology" class="hz-etymology">
        {{ data.etymology }}
      </p>

      <div class="hz-footer">
        <span v-if="status === 'found'" class="hz-badge-db">✓ В базе</span>
        <button v-if="status === 'analyzed'" class="hz-btn success" @click="saveToDb">
          💾 Сохранить
        </button>
      </div>
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-if="state.isSettingsOpen" @close="state.isSettingsOpen = false" />
  </div>
</template>

<style scoped>
.hz-tooltip-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
}
.hz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 4px;
}
.hz-char {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
}
.hz-settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
}
.hz-settings-btn:hover {
  opacity: 1;
}

.hz-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  color: var(--fg-secondary-color);
}
.hz-col {
  flex-direction: column;
  gap: 12px;
}

.hz-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hz-pinyin {
  color: var(--fg-accent-color);
  font-weight: 600;
}
.hz-translation {
  color: var(--fg-primary-color);
}
.hz-components {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.hz-tag {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}
.hz-etymology {
  font-size: 0.85em;
  color: var(--fg-muted-color);
  margin: 4px 0 0 0;
  max-height: 80px;
  overflow-y: auto;
}

.hz-footer {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.hz-badge-db {
  font-size: 0.8em;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.hz-btn {
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.hz-btn.primary {
  background: var(--bg-action-hover-color);
  color: #fff;
}
.hz-btn.success {
  background: #22c55e;
  color: #fff;
}

.hz-error {
  color: #ef4444;
  font-size: 0.85em;
  padding: 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--fg-primary-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
