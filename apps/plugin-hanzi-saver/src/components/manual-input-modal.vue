<script setup lang="ts">
import { ref } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { saveHanziToDb } from '../services/db.service'
import { state } from '../store/hanzi-saver.store'

const emit = defineEmits(['close'])

const inputText = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const resultData = ref<any>(null)

async function analyze() {
  if (!inputText.value.trim()) return
  isLoading.value = true
  errorMsg.value = ''
  resultData.value = null

  try {
    const aiResult = await analyzeHanziWithAi(inputText.value.trim())
    resultData.value = aiResult
  } catch (e: any) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function save() {
  if (!resultData.value) return
  isLoading.value = true
  try {
    await saveHanziToDb(resultData.value)
    state.showToast?.('Успешно сохранено!', { type: 'success' })
    emit('close')
  } catch (e: any) {
    errorMsg.value = `Ошибка сохранения: ${e.message}`
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="hz-modal-overlay" @mousedown.self="emit('close')">
    <div class="hz-modal-content custom-scrollbar">
      <div class="hz-modal-header">
        <h3>Анализ текста</h3>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div v-if="!resultData" class="hz-input-area">
        <textarea 
          v-model="inputText" 
          placeholder="Вставьте иероглиф, слово или целое предложение на китайском..." 
          class="hz-textarea custom-scrollbar"
        />
        <p v-if="errorMsg" class="hz-error">{{ errorMsg }}</p>
        <button class="hz-btn primary" :disabled="isLoading || !inputText.trim()" @click="analyze">
          {{ isLoading ? 'Анализируем...' : 'Сделать разбор (AI)' }}
        </button>
      </div>

      <div v-else class="hz-result-area">
        <div class="hz-preview">
          <div class="hz-char">{{ resultData.character || resultData.char }}</div>
          <div class="hz-pinyin">{{ resultData.pinyin }}</div>
          <div class="hz-translation">{{ resultData.translation }}</div>
        </div>

        <div v-if="resultData.type === 'sentence'" class="hz-sentence-details">
          <div class="hz-section-title">Словарь:</div>
          <div class="hz-words-grid">
            <div v-for="(w, i) in resultData.words_breakdown" :key="i" class="hz-word-item">
              <span class="w-char">{{ w.word }}</span>
              <span class="w-pinyin">{{ w.pinyin }}</span>
              <span class="w-trans">{{ w.translation }}</span>
            </div>
          </div>
          <div class="hz-section-title">Грамматика:</div>
          <p class="hz-grammar">{{ resultData.grammar_notes }}</p>
        </div>

        <p v-if="errorMsg" class="hz-error">{{ errorMsg }}</p>

        <div class="hz-actions">
          <button class="hz-btn secondary" @click="resultData = null">Назад</button>
          <button class="hz-btn success" :disabled="isLoading" @click="save">
            {{ isLoading ? 'Сохранение...' : 'Сохранить в словарь' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hz-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hz-modal-content {
  background: var(--bg-primary-color);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  border-radius: 12px;
  border: 1px solid var(--border-secondary-color);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.hz-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-secondary-color);
}
.hz-modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--fg-primary-color);
}
.close-btn {
  background: none;
  border: none;
  color: var(--fg-muted-color);
  cursor: pointer;
  font-size: 1.2rem;
}
.close-btn:hover { color: var(--fg-primary-color); }
.hz-input-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hz-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  padding: 12px;
  color: var(--fg-primary-color);
  font-family: inherit;
  outline: none;
}
.hz-textarea:focus { border-color: var(--fg-accent-color); }

.hz-result-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.hz-preview {
  text-align: center;
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 12px;
}
.hz-char {
  font-size: 2rem;
  font-family: 'Maple Mono CN', sans-serif;
  color: var(--fg-accent-color);
  font-weight: 700;
  margin-bottom: 8px;
}
.hz-pinyin { font-size: 1rem; color: var(--fg-secondary-color); font-weight: 600; margin-bottom: 4px; }
.hz-translation { font-size: 0.95rem; color: var(--fg-primary-color); }

.hz-section-title { font-weight: bold; font-size: 0.85rem; color: var(--fg-muted-color); margin-bottom: 8px; text-transform: uppercase; }
.hz-words-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.hz-word-item { display: grid; grid-template-columns: 80px 100px 1fr; gap: 10px; background: var(--bg-tertiary-color); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; align-items: center;}
.w-char { font-weight: bold; color: var(--fg-primary-color); font-family: 'Maple Mono CN', sans-serif; font-size: 1.1rem; }
.w-pinyin { color: var(--fg-accent-color); }
.w-trans { color: var(--fg-secondary-color); }
.hz-grammar { font-size: 0.9rem; line-height: 1.5; color: var(--fg-secondary-color); background: rgba(var(--border-accent-color-rgb), 0.05); padding: 12px; border-left: 3px solid var(--fg-accent-color); border-radius: 0 8px 8px 0; }

.hz-actions { display: flex; gap: 12px; justify-content: flex-end; }
.hz-btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
.hz-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.primary { background: var(--fg-accent-color); color: #fff; }
.secondary { background: var(--bg-tertiary-color); color: var(--fg-primary-color); }
.success { background: var(--bg-success-color, #2ea043); color: #fff; border: 1px solid var(--border-success-color); }
.hz-error { color: var(--fg-error-color); font-size: 0.85rem; }
</style>
