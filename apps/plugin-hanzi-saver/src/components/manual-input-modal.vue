<script setup lang="ts">
import { ref, watch } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { saveHanziToDb } from '../services/db.service'
import { state } from '../store/hanzi-saver.store'

const emit = defineEmits(['close'])

const isOpen = ref(true)
const inputText = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const resultData = ref<any>(null)

watch(isOpen, (val) => {
  if (!val) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
})

function handleClose() {
  isOpen.value = false
}

async function analyze() {
  if (!inputText.value.trim())
    return
  isLoading.value = true
  errorMsg.value = ''
  resultData.value = null

  try {
    const aiResult = await analyzeHanziWithAi(inputText.value.trim())
    resultData.value = aiResult
  }
  catch (e: any) {
    errorMsg.value = e.message
  }
  finally {
    isLoading.value = false
  }
}

async function save() {
  if (!resultData.value)
    return
  isLoading.value = true
  try {
    await saveHanziToDb(resultData.value)
    state.showToast?.('Успешно сохранено!', { type: 'success' })
    handleClose() 
  }
  catch (e: any) {
    errorMsg.value = `Ошибка сохранения: ${e.message}`
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <KitDialog
    v-model:visible="isOpen"
    title="Анализ текста"
    icon="mdi:translate"
    :max-width="500"
  >
    <div v-if="!resultData" class="hz-input-area">
      <textarea
        v-model="inputText"
        placeholder="Вставьте иероглиф, слово или целое предложение на китайском..."
        class="hz-textarea custom-scrollbar"
      />
      <p v-if="errorMsg" class="hz-error">
        {{ errorMsg }}
      </p>
    </div>

    <div v-else class="hz-result-area">
      <div class="hz-preview">
        <div class="hz-char">
          {{ resultData.character || resultData.char }}
        </div>
        <div class="hz-pinyin">
          {{ resultData.pinyin }}
        </div>
        <div class="hz-translation">
          {{ resultData.translation }}
        </div>
      </div>

      <div v-if="resultData.type === 'sentence'" class="hz-sentence-details">
        <div class="hz-section-title">
          Словарь:
        </div>
        <div class="hz-words-grid">
          <div v-for="(w, i) in resultData.words_breakdown" :key="i" class="hz-word-item">
            <span class="w-char">{{ w.word }}</span>
            <span class="w-pinyin">{{ w.pinyin }}</span>
            <span class="w-trans">{{ w.translation }}</span>
          </div>
        </div>
        <div class="hz-section-title">
          Грамматика:
        </div>
        <p class="hz-grammar">
          {{ resultData.grammar_notes }}
        </p>
      </div>

      <p v-if="errorMsg" class="hz-error">
        {{ errorMsg }}
      </p>
    </div>

    <template #footer>
      <template v-if="!resultData">
        <KitBtn
          color="primary"
          :disabled="isLoading || !inputText.trim()"
          @click="analyze"
        >
          {{ isLoading ? 'Анализируем...' : 'Сделать разбор (AI)' }}
        </KitBtn>
      </template>

      <template v-else>
        <KitBtn
          variant="tonal"
          color="secondary"
          :disabled="isLoading"
          @click="resultData = null"
        >
          Назад
        </KitBtn>
        <KitBtn
          color="success"
          :disabled="isLoading"
          @click="save"
        >
          {{ isLoading ? 'Сохранение...' : 'Сохранить в словарь' }}
        </KitBtn>
      </template>
    </template>
  </KitDialog>
</template>

<style scoped>

.hz-input-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px; 
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

.hz-textarea:focus {
  border-color: var(--fg-accent-color);
}

.hz-result-area {
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

.hz-pinyin {
  font-size: 1rem;
  color: var(--fg-secondary-color);
  font-weight: 600;
  margin-bottom: 4px;
}

.hz-translation {
  font-size: 0.95rem;
  color: var(--fg-primary-color);
}

.hz-section-title {
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--fg-muted-color);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.hz-words-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.hz-word-item {
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  gap: 10px;
  background: var(--bg-tertiary-color);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  align-items: center;
}

.w-char {
  font-weight: bold;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.1rem;
}

.w-pinyin {
  color: var(--fg-accent-color);
}
.w-trans {
  color: var(--fg-secondary-color);
}

.hz-grammar {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--fg-secondary-color);
  background: rgba(var(--border-accent-color-rgb), 0.05);
  padding: 12px;
  border-left: 3px solid var(--fg-accent-color);
  border-radius: 0 8px 8px 0;
}

.hz-error {
  color: var(--fg-error-color);
  font-size: 0.85rem;
}
</style>
