<script setup lang="ts">
import type { QuizData } from '../../../types'
import { marked } from 'marked'
import { computed, reactive, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: QuizData }>()
const { t } = usePluginI18n()

const currentIndex = ref(0)
const slideDir = ref('slide-left')

// Храним состояние каждого вопроса
interface QuestionState {
  selected: string | null
  answered: boolean
  disabled: string[]
}
const qStates = reactive<Record<number, QuestionState>>({})

function ensureState(index: number) {
  if (!qStates[index]) {
    qStates[index] = { selected: null, answered: false, disabled: [] }
  }
}

const currentQuestion = computed(() => props.data.questions[currentIndex.value])
const isAnswered = computed(() => qStates[currentIndex.value]?.answered || false)
const correctCount = computed(() => {
  return Object.values(qStates).filter(s => s.answered && s.selected === props.data.questions[Object.keys(qStates).findIndex(k => qStates[k as any] === s)].correct_answer).length
})

watch(() => props.data, (newData) => {
  currentIndex.value = 0
  Object.keys(qStates).forEach(k => delete qStates[k as any])
  if (newData && newData.questions) {
    newData.questions.forEach((_: unknown, i: number) => ensureState(i))
  }
}, { immediate: true })

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}

function selectOption(option: string) {
  ensureState(currentIndex.value)
  const state = qStates[currentIndex.value]

  if (state.answered || state.disabled.includes(option))
    return

  state.selected = option

  if (option === currentQuestion.value.correct_answer) {
    state.answered = true
  }
  else {
    setTimeout(() => {
      if (!state.disabled.includes(option)) {
        state.disabled.push(option)
      }
      state.selected = null
    }, 600)
  }
}

function showAnswer() {
  ensureState(currentIndex.value)
  qStates[currentIndex.value].answered = true
  qStates[currentIndex.value].selected = currentQuestion.value.correct_answer
}

function navigate(dir: number) {
  slideDir.value = dir > 0 ? 'slide-left' : 'slide-right'
  currentIndex.value = Math.max(0, Math.min(props.data.questions.length - 1, currentIndex.value + dir))
}

function jumpTo(i: number) {
  if (i === currentIndex.value)
    return
  slideDir.value = i > currentIndex.value ? 'slide-left' : 'slide-right'
  currentIndex.value = i
}
</script>

<template>
  <div class="quiz-board">
    <div v-if="data.title" class="quiz-title-box">
      <h3>{{ data.title }}</h3>
    </div>

    <div class="quiz-progress-header">
      <div class="quiz-progress-label">
        {{ currentIndex + 1 }} / {{ data.questions.length }}
      </div>
      <div class="quiz-progress-track">
        <div
          class="quiz-progress-fill"
          :style="{ width: `${((currentIndex + 1) / data.questions.length) * 100}%` }"
        />
      </div>
      <div class="quiz-progress-dots">
        <button
          v-for="(_, i) in data.questions"
          :key="i"
          class="quiz-dot"
          :class="{
            active: i === currentIndex,
            answered: qStates[i]?.answered,
            correct: qStates[i]?.answered && qStates[i]?.selected === data.questions[i].correct_answer,
          }"
          @click="jumpTo(i)"
        />
      </div>
    </div>

    <Transition :name="slideDir" mode="out-in">
      <div :key="currentIndex" class="quiz-card">
        <div class="question-header">
          <span class="q-type-badge">{{ currentQuestion.type }}</span>
        </div>

        <div class="question-text">
          {{ currentQuestion.question }}
        </div>

        <div v-if="currentQuestion.phonetic_hint" class="question-hint">
          {{ currentQuestion.phonetic_hint }}
        </div>

        <div class="options-grid">
          <button
            v-for="(opt, oi) in currentQuestion.options"
            :key="oi"
            class="option-btn"
            :class="{
              'option-correct': isAnswered && opt === currentQuestion.correct_answer,
              'option-wrong': qStates[currentIndex]?.selected === opt && opt !== currentQuestion.correct_answer,
              'option-disabled': qStates[currentIndex]?.disabled.includes(opt) || (isAnswered && opt !== currentQuestion.correct_answer),
            }"
            :disabled="isAnswered || qStates[currentIndex]?.disabled.includes(opt)"
            @click="selectOption(opt)"
          >
            <span class="opt-text">{{ opt }}</span>
            <span v-if="isAnswered && opt === currentQuestion.correct_answer" class="opt-icon check">✓</span>
            <span v-else-if="qStates[currentIndex]?.selected === opt && opt !== currentQuestion.correct_answer" class="opt-icon cross">✗</span>
          </button>
        </div>

        <div v-if="!isAnswered" class="action-row">
          <button class="show-answer-btn" @click="showAnswer">
            {{ t('board.showAnswer') }}
          </button>
        </div>

        <Transition name="fade-down">
          <div v-if="isAnswered" class="explanation-box">
            <div class="exp-title">
              💡 {{ t('board.explanation') || 'Объяснение' }}
            </div>
            <div class="exp-content markdown-body" v-html="renderMarkdown(currentQuestion.explanation)" />
          </div>
        </Transition>
      </div>
    </Transition>

    <div class="quiz-navigation">
      <button class="nav-btn" :disabled="currentIndex === 0" @click="navigate(-1)">
        ← {{ t('board.prev') }}
      </button>

      <div class="score-display">
        <span class="score-correct">{{ correctCount }}</span>
        <span class="score-sep">/</span>
        <span class="score-total">{{ data.questions.length }}</span>
      </div>

      <button class="nav-btn nav-btn-next" :disabled="currentIndex === data.questions.length - 1" @click="navigate(1)">
        {{ t('board.next') }} →
      </button>
    </div>
  </div>
</template>

<style scoped>
.quiz-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
  max-width: 680px;
  margin: 0 auto;
  font-family: var(--lang-font, inherit);
}

.quiz-title-box {
  text-align: center;
  color: var(--fg-secondary-color);
  margin-bottom: -8px;
}
.quiz-title-box h3 {
  margin: 0;
  font-size: 1.1em;
}

.quiz-progress-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quiz-progress-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--fg-accent-color);
  text-align: right;
}
.quiz-progress-track {
  height: 6px;
  background: var(--bg-tertiary-color);
  border-radius: 99px;
  overflow: hidden;
}
.quiz-progress-fill {
  height: 100%;
  background: var(--fg-accent-color);
  border-radius: 99px;
  transition: width 0.4s ease;
}
.quiz-progress-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.quiz-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border-primary-color);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}
.quiz-dot.active {
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
  transform: scale(1.2);
}
.quiz-dot.answered.correct {
  background: var(--bg-success-color, #22c55e);
  border-color: var(--border-success-color, #16a34a);
}

.quiz-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 300px;
}

.question-header {
  display: flex;
  justify-content: flex-start;
}
.q-type-badge {
  background: var(--bg-accent-overlay-color);
  color: var(--fg-accent-color);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--border-accent-color);
}

.question-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  line-height: 1.4;
  text-align: center;
}
.question-hint {
  text-align: center;
  font-family: monospace;
  color: var(--fg-secondary-color);
  font-size: 0.95rem;
  margin-top: -12px;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.option-btn {
  position: relative;
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid var(--border-primary-color);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  text-align: left;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: inherit;
}
.option-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
  transform: translateY(-2px);
}
.option-btn.option-correct {
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
  color: #22c55e;
}
.option-btn.option-wrong {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: #ef4444;
  animation: shake 0.5s ease;
}
.option-btn.option-disabled {
  opacity: 0.5;
  cursor: default;
}
.opt-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

.action-row {
  display: flex;
  justify-content: flex-end;
}
.show-answer-btn {
  background: transparent;
  border: none;
  color: var(--fg-muted-color);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}
.show-answer-btn:hover {
  color: var(--fg-secondary-color);
}

.explanation-box {
  background: var(--bg-tertiary-color);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--border-secondary-color);
  border-left: 4px solid var(--border-accent-color);
}
.exp-title {
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  margin-bottom: 8px;
}
.exp-content {
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  line-height: 1.5;
}

/* Навигация */
.quiz-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.score-display {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--fg-secondary-color);
}
.score-correct {
  color: #22c55e;
}
.score-sep {
  color: var(--fg-muted-color);
  margin: 0 4px;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
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
</style>
