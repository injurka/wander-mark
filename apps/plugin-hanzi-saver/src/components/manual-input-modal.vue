<script setup lang="ts">
import type { HanziData } from '../types'
import { onMounted, ref, watch } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { checkHanziInDb, saveHanziToDb } from '../services/db.service'
import { state } from '../store/hanzi-saver.store'

const emit = defineEmits(['close'])

const isOpen = ref(true)
const inputText = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const resultData = ref<HanziData | null>(null)
const historyStack = ref<HanziData[]>([])
const wordDbStatus = ref<Record<string, boolean>>({})

onMounted(() => {
  if (state.manualInputTarget) {
    inputText.value = state.manualInputTarget
    state.manualInputTarget = ''
    analyze()
  }
})

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

async function checkWordsDbStatus() {
  if (resultData.value?.type !== 'sentence' || !resultData.value.words_breakdown)
    return

  for (const w of resultData.value.words_breakdown) {
    try {
      const exists = await checkHanziInDb(w.word)
      wordDbStatus.value[w.word] = !!exists
    }
    catch {
      wordDbStatus.value[w.word] = false
    }
  }
}

async function analyze() {
  if (!inputText.value.trim())
    return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const aiResult = await analyzeHanziWithAi(inputText.value.trim())
    resultData.value = aiResult
    await checkWordsDbStatus()
  }
  catch (e: unknown) {
    if (e instanceof Error)
      errorMsg.value = e.message
    else errorMsg.value = 'Произошла неизвестная ошибка'
  }
  finally {
    isLoading.value = false
  }
}

function analyzeSubWord(word: string) {
  if (!resultData.value)
    return
  historyStack.value.push(resultData.value)
  inputText.value = word
  resultData.value = null
  analyze()
}

function goBack() {
  if (historyStack.value.length > 0) {
    resultData.value = historyStack.value.pop()!
    inputText.value = resultData.value.char
    checkWordsDbStatus()
  }
  else {
    resultData.value = null
  }
}

async function save() {
  if (!resultData.value)
    return

  isLoading.value = true
  try {
    await saveHanziToDb(resultData.value)

    if (historyStack.value.length > 0) {
      state.ctx?.showToast?.('Слово добавлено в словарь!', { type: 'success' })
      const parent = historyStack.value.pop()!
      resultData.value = parent
      inputText.value = parent.char
      await checkWordsDbStatus()
    }
    else {
      state.ctx?.showToast?.('Успешно сохранено!', { type: 'success' })
      handleClose()
    }
  }
  catch (e: unknown) {
    if (e instanceof Error)
      errorMsg.value = `Ошибка сохранения: ${e.message}`
    else errorMsg.value = 'Неизвестная ошибка сохранения'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <KitDialog
    v-model:visible="isOpen"
    :title="historyStack.length > 0 ? 'Разбор составного слова' : 'Анализ текста'"
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
          {{ resultData.char }}
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
          Слова из фразы:
        </div>
        <div class="hz-words-grid">
          <div v-for="(w, i) in resultData.words_breakdown" :key="i" class="hz-word-item">
            <div class="w-info">
              <span class="w-char">{{ w.word }}</span>
              <span class="w-pinyin">{{ w.pinyin }}</span>
            </div>
            <span class="w-trans">{{ w.translation }}</span>

            <button
              v-if="!wordDbStatus[w.word]"
              class="hz-sub-action add-btn"
              title="Добавить в словарь"
              @click="analyzeSubWord(w.word)"
            >
              +
            </button>
            <span v-else class="hz-sub-action added-mark" title="Уже в словаре">
              ✓
            </span>
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
        <KitBtn v-if="historyStack.length > 0" variant="tonal" color="secondary" :disabled="isLoading" @click="goBack">
          Отмена
        </KitBtn>
        <KitBtn color="primary" :disabled="isLoading || !inputText.trim()" @click="analyze">
          {{ isLoading ? 'Анализируем...' : 'Сделать разбор (AI)' }}
        </KitBtn>
      </template>

      <template v-else>
        <KitBtn variant="tonal" color="secondary" :disabled="isLoading" @click="goBack">
          {{ historyStack.length > 0 ? 'Назад к фразе' : 'Новый поиск' }}
        </KitBtn>
        <KitBtn color="success" :disabled="isLoading" @click="save">
          {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
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
