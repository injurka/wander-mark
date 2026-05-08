<script setup lang="ts">
import type { HanziData } from '../types'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { analyzeHanziWithAi } from '../services/ai.service'
import { checkHanziInDb, saveHanziToDb } from '../services/db.service'
import { openPopover, state } from '../store/hanzi-saver.store'
import HanziActionPopover from './hanzi-action-popover.vue'
import HzWordsCompact from './hz-words-compact.vue'

const emit = defineEmits(['close'])

const isOpen = ref(true)
const inputText = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

const resultData = ref<HanziData | null>(null)
const historyStack = ref<HanziData[]>([])
const wordDbStatus = ref<Record<string, boolean>>({})

const isWordsExpanded = ref(false)

let abortController: AbortController | null = null

onMounted(() => {
  if (state.manualInputTarget) {
    inputText.value = state.manualInputTarget
    state.manualInputTarget = ''
    analyze()
  }
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

watch(isOpen, (val) => {
  if (!val) {
    if (abortController) {
      abortController.abort()
    }
    setTimeout(() => {
      emit('close')
    }, 300)
  }
})

function handleClose() {
  isOpen.value = false
}

async function checkWordsDbStatus(signal?: AbortSignal) {
  if (resultData.value?.type !== 'sentence' || !resultData.value.words_breakdown)
    return

  for (const w of resultData.value.words_breakdown) {
    if (signal?.aborted)
      return
    try {
      const exists = await checkHanziInDb(w.word, signal)
      wordDbStatus.value[w.word] = !!exists
    }
    catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError')
        throw e
      wordDbStatus.value[w.word] = false
    }
  }
}

async function analyze() {
  if (!inputText.value.trim())
    return

  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  const signal = abortController.signal

  isLoading.value = true
  errorMsg.value = ''
  isWordsExpanded.value = false

  try {
    const aiResult = await analyzeHanziWithAi(inputText.value.trim(), signal)
    resultData.value = aiResult
    await checkWordsDbStatus(signal)
  }
  catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        return
      }
      errorMsg.value = e.message
    }
    else {
      errorMsg.value = 'Произошла неизвестная ошибка'
    }
  }
  finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
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
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    resultData.value = historyStack.value.pop()!
    inputText.value = resultData.value.char
    isWordsExpanded.value = false
    checkWordsDbStatus(abortController.signal)
  }
  else {
    resultData.value = null
  }
}

async function save() {
  if (!resultData.value)
    return

  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  const signal = abortController.signal

  isLoading.value = true
  try {
    await saveHanziToDb(resultData.value, signal)

    if (historyStack.value.length > 0) {
      state.ctx?.showToast?.('Слово добавлено в словарь!', { type: 'success' })
      const parent = historyStack.value.pop()!
      resultData.value = parent
      inputText.value = parent.char
      isWordsExpanded.value = false
      await checkWordsDbStatus(signal)
    }
    else {
      state.ctx?.showToast?.('Успешно сохранено!', { type: 'success' })
      handleClose()
    }
  }
  catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'AbortError')
        return
      errorMsg.value = `Ошибка сохранения: ${e.message}`
    }
    else {
      errorMsg.value = 'Неизвестная ошибка сохранения'
    }
  }
  finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <KitDialog
    v-model:visible="isOpen"
    :title="historyStack.length > 0 ? 'Разбор составного слова' : 'Анализ текста'"
    icon="mdi:translate"
    :max-width="600"
  >
    <div v-if="!resultData" class="hz-input-area">
      <textarea
        v-model="inputText"
        :disabled="isLoading"
        placeholder="Вставьте иероглиф, слово или целое предложение на китайском..."
        class="hz-textarea custom-scrollbar"
      />
      <p v-if="errorMsg" class="hz-error">
        {{ errorMsg }}
      </p>
    </div>

    <div v-else class="hz-result-area custom-scrollbar">
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
        <div class="hz-section-header">
          <div class="hz-section-title">
            Составные слова
          </div>
        </div>

        <HzWordsCompact
          v-if="resultData.words_breakdown"
          :words="resultData.words_breakdown"
          :expanded="isWordsExpanded"
          @toggle="isWordsExpanded = true"
          @word-click="analyzeSubWord"
        >
          <template #expanded>
            <div class="hz-words-grid">
              <div v-for="(w, i) in resultData.words_breakdown" :key="i" class="hz-word-item">
                <div class="w-info">
                  <span class="w-char interactive-text" title="Действия" @click.stop="openPopover($event, w.word)">{{ w.word }}</span>
                  <span class="w-pinyin">{{ w.pinyin }}</span>
                </div>
                <span class="w-trans">{{ w.translation }}</span>

                <button
                  v-if="!wordDbStatus[w.word]"
                  class="hz-sub-action add-btn"
                  title="Анализировать / Добавить"
                  @click="analyzeSubWord(w.word)"
                >
                  +
                </button>
                <span v-else class="hz-sub-action added-mark" title="Уже в словаре">
                  ✓
                </span>
              </div>
              <button class="hz-collapse-btn" @click="isWordsExpanded = false">
                Свернуть
              </button>
            </div>
          </template>
        </HzWordsCompact>

        <div class="hz-section-header mt-4">
          <div class="hz-section-title">
            Разбор предложения
          </div>
        </div>

        <div class="hz-syntax-list">
          <div v-for="(w, i) in resultData.words_breakdown" :key="`sa-${i}`" class="sa-item">
            <div class="sa-bullet" />
            <div class="sa-content">
              <div class="sa-head">
                <span class="sa-char interactive-text" title="Действия" @click.stop="openPopover($event, w.word)">{{ w.word }}</span>
                <span class="sa-pinyin">({{ w.pinyin }})</span>
                <span class="sa-dash">—</span>
                <span class="sa-trans">{{ w.translation }}</span>
                <span v-if="w.grammar_role" class="sa-role">[{{ w.grammar_role }}]</span>
              </div>
              <div v-if="w.explanation" class="sa-desc">
                {{ w.explanation }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="resultData.grammar_notes" class="mt-4">
          <div class="hz-section-title">
            Общая грамматика
          </div>
          <p class="hz-grammar">
            {{ resultData.grammar_notes }}
          </p>
        </div>
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

    <HanziActionPopover />
  </KitDialog>
</template>

<style scoped>
.interactive-text {
  cursor: pointer;
  transition:
    color 0.2s,
    opacity 0.2s;
}
.interactive-text:hover {
  color: var(--fg-accent-color);
  opacity: 0.8;
}

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
  transition: all 0.2s ease;
}
.hz-textarea:focus {
  border-color: var(--fg-accent-color);
}
.hz-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary-color);
}

.hz-result-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.hz-preview {
  text-align: center;
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 12px;
  flex-shrink: 0;
}

.hz-char {
  font-size: 2rem;
  font-family: 'Maple Mono CN', sans-serif;
  color: var(--fg-accent-color);
  font-weight: 700;
  margin-bottom: 8px;
  display: inline-block;
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

.hz-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-secondary-color);
  padding-bottom: 6px;
  margin-bottom: 12px;
}
.mt-4 {
  margin-top: 24px;
}

.hz-section-title {
  font-weight: bold;
  font-size: 0.9rem;
  color: var(--fg-primary-color);
}

.hz-collapse-btn {
  background: none;
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  align-self: flex-start;
}
.hz-collapse-btn:hover {
  text-decoration: underline;
}

.hz-words-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.hz-syntax-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-tertiary-color);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary-color);
}
.sa-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.sa-bullet {
  width: 6px;
  height: 6px;
  background-color: var(--fg-accent-color);
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}
.sa-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sa-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 0.95rem;
}
.sa-char {
  font-weight: 700;
  color: var(--fg-primary-color);
  font-family: 'Maple Mono CN', sans-serif;
  font-size: 1.1rem;
}
.sa-pinyin {
  font-weight: 600;
  color: var(--fg-primary-color);
}
.sa-dash {
  color: var(--fg-muted-color);
}
.sa-trans {
  color: var(--fg-secondary-color);
}
.sa-role {
  font-size: 0.75rem;
  color: var(--fg-accent-color);
  background: rgba(var(--bg-accent-color-rgb), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 4px;
}
.sa-desc {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  line-height: 1.4;
  opacity: 0.9;
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
