<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { checkHanziInDb, saveHanziToDb } from '../services/db.service'
import { state } from '../store/hanzi-saver.store'

const props = defineProps<{ text: string }>()
const emit = defineEmits(['close'])

type Status = 'loading' | 'found' | 'not_found' | 'ai_loading' | 'analyzed' | 'error'
const status = ref<Status>('loading')
const data = ref<any>(null)
const errorMsg = ref('')

const abortController = new AbortController()

onUnmounted(() => {
  abortController.abort()
})

onMounted(async () => {
  try {
    const dbRecord = await checkHanziInDb(props.text, abortController.signal)
    if (dbRecord) {
      data.value = dbRecord
      status.value = 'found'
    }
    else {
      status.value = 'not_found'
    }
  }
  catch (e: any) {
    if (e.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.log('DB check aborted.')
      return
    }
    errorMsg.value = `Ошибка БД: ${e.message}`
    status.value = 'error'
  }
})

async function runAnalysis() {
  status.value = 'ai_loading'
  try {
    const aiResult = await analyzeHanziWithAi(props.text, abortController.signal)
    data.value = aiResult
    status.value = 'analyzed'
  }
  catch (e: any) {
    if (e.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.log('AI analysis aborted.')
      return
    }
    errorMsg.value = `Ошибка AI: ${e.message}`
    status.value = 'error'
  }
}

async function saveToDb() {
  try {
    await saveHanziToDb(data.value, abortController.signal)
    state?.showToast('Иероглиф сохранен!', { type: 'success' })
    emit('close')
  }
  catch (e: any) {
    if (e.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.log('Save to DB aborted.')
      return
    }
    state?.showToast('Ошибка сохранения', { type: 'error' })
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
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hz-tooltip-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 240px;
  font-family: inherit;
}
.hz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed var(--border-secondary-color);
  padding-bottom: 8px;
}
.hz-char {
  font-size: 2.2rem;
  font-weight: 600;
  color: var(--fg-accent-color);
  font-family: 'Maple Mono CN', sans-serif;
  line-height: 1;
}

.hz-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
}
.hz-col {
  flex-direction: column;
  gap: 12px;
}

.hz-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hz-pinyin {
  color: var(--fg-primary-color);
  font-weight: 700;
  font-size: 1.1rem;
}
.hz-translation {
  color: var(--fg-secondary-color);
  font-size: 0.95rem;
  line-height: 1.4;
}
.hz-components {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.hz-tag {
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.hz-etymology {
  font-size: 0.85rem;
  color: var(--fg-muted-color);
  margin: 6px 0 0 0;
  max-height: 100px;
  overflow-y: auto;
  background: rgba(var(--bg-primary-color-rgb), 0.5);
  padding: 8px;
  border-radius: 6px;
}

.hz-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.hz-badge-db {
  font-size: 0.8rem;
  color: var(--fg-success-color);
  background: rgba(var(--bg-success-color-rgb), 0.3);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.hz-btn {
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}
.hz-btn.primary {
  background: var(--fg-accent-color);
  color: var(--bg-primary-color);
}
.hz-btn.success {
  background: var(--fg-success-color);
  color: #fff;
}
.hz-btn:hover {
  opacity: 0.9;
}

.hz-error {
  color: var(--fg-error-color);
  font-size: 0.85rem;
  padding: 10px;
  background: rgba(var(--bg-error-color-rgb), 0.3);
  border: 1px solid var(--border-error-color);
  border-radius: 6px;
}
</style>
