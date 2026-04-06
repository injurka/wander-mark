<!-- eslint-disable unicorn/no-new-array -->
<script setup lang="ts">
import type { ToneGuesserData } from '../../../types'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: ToneGuesserData }>()
const { t } = usePluginI18n()

const currentIndex = ref(0)
const slideDir = ref('slide-left')

const currentExercise = computed(() => props.data.exercises[currentIndex.value])

const userAnswers = ref<number[]>([])
const sylStatuses = ref<('idle' | 'correct' | 'wrong')[]>([])
const isFullyCorrect = ref(false)
const showAnswerMode = ref(false)

const TONES = [
  { val: 1, sym: '—' },
  { val: 2, sym: '/' },
  { val: 3, sym: '∨' },
  { val: 4, sym: '\\' },
  { val: 5, sym: '·' },
]

function resetState() {
  const len = currentExercise.value.syllables.length
  userAnswers.value = new Array(len).fill(0)
  sylStatuses.value = new Array(len).fill('idle')
  isFullyCorrect.value = false
  showAnswerMode.value = false
}

watch(currentIndex, resetState)
watch(() => props.data, () => {
  currentIndex.value = 0
  resetState()
}, { immediate: true })

function selectTone(sylIndex: number, toneVal: number) {
  if (isFullyCorrect.value || showAnswerMode.value)
    return
  userAnswers.value[sylIndex] = toneVal
  sylStatuses.value[sylIndex] = 'idle' // Сброс статуса ошибки при изменении ответа
}

function checkAnswers() {
  let allCorrect = true
  const newStatuses: ('idle' | 'correct' | 'wrong')[] = []

  currentExercise.value.syllables.forEach((syl, i) => {
    if (userAnswers.value[i] === syl.correct_tone) {
      newStatuses[i] = 'correct'
    }
    else {
      newStatuses[i] = 'wrong'
      allCorrect = false
    }
  })

  sylStatuses.value = newStatuses

  if (allCorrect) {
    isFullyCorrect.value = true
  }
}

function revealAnswer() {
  currentExercise.value.syllables.forEach((syl, i) => {
    userAnswers.value[i] = syl.correct_tone
    sylStatuses.value[i] = 'correct'
  })
  showAnswerMode.value = true
  isFullyCorrect.value = true
}

function navigate(dir: number) {
  slideDir.value = dir > 0 ? 'slide-left' : 'slide-right'
  currentIndex.value = Math.max(0, Math.min(props.data.exercises.length - 1, currentIndex.value + dir))
}

function jumpTo(i: number) {
  if (i === currentIndex.value)
    return
  slideDir.value = i > currentIndex.value ? 'slide-left' : 'slide-right'
  currentIndex.value = i
}

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}
</script>

<template>
  <div class="tone-board">
    <!-- Прогресс -->
    <div class="tone-progress-header">
      <div class="tone-progress-label">
        {{ currentIndex + 1 }} / {{ data.exercises.length }}
      </div>
      <div class="tone-progress-track">
        <div class="tone-progress-fill" :style="{ width: `${((currentIndex + 1) / data.exercises.length) * 100}%` }" />
      </div>
      <div class="tone-progress-dots">
        <button
          v-for="(_, i) in data.exercises"
          :key="i"
          class="tone-dot"
          :class="{ active: i === currentIndex }"
          @click="jumpTo(i)"
        />
      </div>
    </div>

    <!-- Карточка -->
    <Transition :name="slideDir" mode="out-in">
      <div :key="currentIndex" class="tone-card">
        <div class="translation-box">
          <div class="label">
            {{ t('board.translation') }}
          </div>
          <div class="text">
            {{ currentExercise.translation }}
          </div>
        </div>

        <!-- Сетка слогов -->
        <div class="syllables-grid">
          <div
            v-for="(syl, i) in currentExercise.syllables"
            :key="i"
            class="syllable-block"
            :class="{
              'is-correct': sylStatuses[i] === 'correct',
              'is-wrong': sylStatuses[i] === 'wrong',
              'shake': sylStatuses[i] === 'wrong',
            }"
          >
            <!-- Иероглиф и Пиньинь -->
            <div class="syl-char">
              {{ syl.character }}
            </div>
            <div class="syl-pinyin">
              <span v-if="isFullyCorrect" class="full-pinyin">{{ syl.full_pinyin }}</span>
              <span v-else class="base-pinyin">{{ syl.base_pinyin }}</span>
            </div>

            <!-- Селектор тонов -->
            <div class="tone-selector">
              <button
                v-for="tBtn in TONES"
                :key="tBtn.val"
                class="tone-btn"
                :class="{ selected: userAnswers[i] === tBtn.val }"
                :disabled="isFullyCorrect"
                :title="`Tone ${tBtn.val}`"
                @click="selectTone(i, tBtn.val)"
              >
                {{ tBtn.sym }}
              </button>
            </div>
          </div>
        </div>

        <!-- Кнопки управления -->
        <div v-if="!isFullyCorrect" class="actions-row">
          <button class="reveal-link" @click="revealAnswer">
            {{ t('board.showAnswer') }}
          </button>
          <button
            class="check-btn"
            :disabled="userAnswers.includes(0)"
            @click="checkAnswers"
          >
            {{ t('board.check') }}
          </button>
        </div>

        <!-- Объяснение (Показывается при успехе или показе ответа) -->
        <Transition name="fade-down">
          <div v-if="isFullyCorrect" class="explanation-box">
            <div class="exp-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              {{ t('board.grammarNotes') }} / Sandhi
            </div>
            <div class="exp-content markdown-body" v-html="renderMarkdown(currentExercise.explanation)" />
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Навигация -->
    <div class="tone-navigation">
      <button class="nav-btn" :disabled="currentIndex === 0" @click="navigate(-1)">
        ← {{ t('board.prev') }}
      </button>
      <button class="nav-btn nav-btn-next" :disabled="currentIndex === data.exercises.length - 1" @click="navigate(1)">
        {{ t('board.next') }} →
      </button>
    </div>
  </div>
</template>

<style scoped>
.tone-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
  max-width: 760px;
  margin: 0 auto;
  font-family: var(--lang-font, inherit);
}

/* Прогресс бар */
.tone-progress-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tone-progress-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--fg-accent-color);
  text-align: right;
}
.tone-progress-track {
  height: 6px;
  background: var(--bg-tertiary-color);
  border-radius: 99px;
  overflow: hidden;
}
.tone-progress-fill {
  height: 100%;
  background: var(--fg-accent-color);
  border-radius: 99px;
  transition: width 0.4s ease;
}
.tone-progress-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tone-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border-primary-color);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}
.tone-dot.active {
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
  transform: scale(1.2);
}

.tone-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.translation-box {
  text-align: center;
}
.translation-box .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--fg-muted-color);
  margin-bottom: 4px;
}
.translation-box .text {
  font-size: 1.15rem;
  color: var(--fg-primary-color);
  font-style: italic;
}

.syllables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.syllable-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-primary-color);
  border: 2px solid var(--border-secondary-color);
  border-radius: 12px;
  padding: 16px 12px;
  min-width: 90px;
  transition: all 0.3s;
}

.syllable-block.is-correct {
  border-color: var(--border-success-color);
  background: rgba(34, 197, 94, 0.05);
}
.syllable-block.is-wrong {
  border-color: var(--fg-error-color);
  background: rgba(239, 68, 68, 0.05);
}

.syl-char {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  line-height: 1;
  margin-bottom: 8px;
}
.syl-pinyin {
  font-size: 1.1rem;
  color: var(--fg-secondary-color);
  margin-bottom: 12px;
  height: 24px;
  display: flex;
  align-items: center;
}
.full-pinyin {
  color: var(--fg-accent-color);
  font-weight: bold;
}

.tone-selector {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary-color);
  padding: 4px;
  border-radius: 8px;
}
.tone-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--fg-secondary-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: monospace;
}
.tone-btn:hover:not(:disabled) {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}
.tone-btn.selected {
  background: var(--bg-accent-color);
  font-weight: bold;
}

.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-secondary-color);
  padding-top: 16px;
}
.reveal-link {
  background: transparent;
  border: none;
  color: var(--fg-muted-color);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}
.reveal-link:hover {
  color: var(--fg-secondary-color);
}
.check-btn {
  padding: 10px 24px;
  border-radius: 8px;
  background: var(--bg-action-hover-color);
  color: var(--fg-inverted-color);
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.check-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.explanation-box {
  background: rgba(var(--border-accent-color-rgb), 0.05);
  border-radius: 10px;
  padding: 16px;
  border-left: 4px solid var(--border-accent-color);
}
.exp-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--fg-accent-color);
  margin-bottom: 8px;
  text-transform: uppercase;
}
.exp-content {
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  line-height: 1.6;
}

.tone-navigation {
  display: flex;
  justify-content: space-between;
}
.nav-btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid var(--border-primary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-primary-color);
  transition: all 0.2s;
}
.nav-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.nav-btn-next {
  background: var(--bg-accent-overlay-color);
  color: var(--fg-accent-color);
  border-color: var(--border-accent-color);
}
.nav-btn-next:not(:disabled):hover {
  background: var(--fg-accent-color);
  color: var(--fg-inverted-color);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
.shake {
  animation: shake 0.4s ease;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-down-enter-active {
  transition: all 0.3s ease;
}
.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .syllables-grid {
    gap: 8px;
  }
  .syllable-block {
    min-width: 75px;
    padding: 12px 8px;
  }
  .syl-char {
    font-size: 2.2rem;
  }
  .tone-btn {
    width: 20px;
    height: 20px;
    font-size: 0.85rem;
  }
}
</style>
