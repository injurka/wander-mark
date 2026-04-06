<script setup lang="ts">
import type { PhrasalVerbsData } from '../../../types'
import { reactive, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: PhrasalVerbsData }>()

const { t } = usePluginI18n()

const isQuizMode = ref(false)

interface QuizState {
  selected: string | null
  answered: boolean
  disabled: string[]
}

const quizStates = reactive<Record<number, QuizState>>({})

function ensureState(index: number) {
  if (!quizStates[index]) {
    quizStates[index] = { selected: null, answered: false, disabled: [] }
  }
}

function selectParticle(cardIndex: number, option: string, correct: string) {
  ensureState(cardIndex)
  const state = quizStates[cardIndex]
  if (state.answered || state.disabled.includes(option))
    return

  state.selected = option

  if (option === correct) {
    state.answered = true
  }
  else {
    // Wrong — add to disabled after shake
    setTimeout(() => {
      if (!state.disabled.includes(option)) {
        state.disabled.push(option)
      }
      state.selected = null
    }, 700)
  }
}

function resetCard(cardIndex: number) {
  quizStates[cardIndex] = { selected: null, answered: false, disabled: [] }
}

function toggleMode() {
  isQuizMode.value = !isQuizMode.value
  // Reset all quiz states on mode switch
  if (isQuizMode.value && props.data?.variations) {
    props.data.variations.forEach((_, i) => {
      quizStates[i] = { selected: null, answered: false, disabled: [] }
    })
  }
}

// Highlight the particle in the phrasal verb text
function highlightParticle(phrasalVerb: string, particle: string): string {
  if (!particle || !phrasalVerb)
    return phrasalVerb || ''
  // Case-insensitive replace — only the particle portion
  const escaped = particle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'i')
  return phrasalVerb.replace(regex, '<span class="particle-highlight">$1</span>')
}

// Render ___ as styled blank
function renderBlank(sentence: string): string {
  if (!sentence)
    return ''
  return sentence.replace(/___/g, '<span class="quiz-blank">___</span>')
}

// Initialize quiz states when data is available
watch(
  () => props.data,
  (newData) => {
    if (newData?.variations) {
      newData.variations.forEach((_, i) => {
        if (!quizStates[i]) {
          quizStates[i] = { selected: null, answered: false, disabled: [] }
        }
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="phrasal-board">
    <div v-if="!data || !data.variations || data.variations.length === 0" class="empty-state">
      <span>{{ t('tb.emptyState') }}</span>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="board-header">
        <div class="header-left">
          <div class="base-verb-display">
            {{ data.base_verb }}
          </div>
          <div class="base-meaning-display">
            {{ data.base_meaning }}
          </div>
        </div>
        <button
          class="mode-toggle-btn"
          :class="{ 'quiz-active': isQuizMode }"
          @click="toggleMode"
        >
          <span class="mode-icon">{{ isQuizMode ? '📖' : '✏️' }}</span>
          <span>{{ isQuizMode ? t('board.studyMode') : t('board.quizMode') }}</span>
        </button>
      </div>

      <!-- Variations -->
      <div class="variations-list">
        <div
          v-for="(variation, vi) in data.variations"
          :key="vi"
          class="variation-card"
          :class="{ 'quiz-card': isQuizMode }"
        >
          <!-- Card Header: phrasal verb with highlighted particle -->
          <div class="card-header">
            <div class="phrasal-verb-display" v-html="highlightParticle(variation.phrasal_verb, variation.correct_particle)" />
            <div class="card-index">
              {{ vi + 1 }}
            </div>
          </div>

          <!-- STUDY MODE -->
          <template v-if="!isQuizMode">
            <div class="study-content">
              <div class="study-meaning">
                {{ variation.meaning }}
              </div>
              <div class="study-example">
                <div class="example-sentence">
                  {{ variation.example_sentence }}
                </div>
                <div class="example-translation">
                  {{ variation.example_translation }}
                </div>
              </div>
            </div>
          </template>

          <!-- QUIZ MODE -->
          <template v-else>
            <div class="quiz-content">
              <!-- Fill-in-blank sentence -->
              <div class="quiz-sentence" v-html="renderBlank(variation.fill_in_blank)" />

              <!-- Options -->
              <div v-if="!quizStates[vi]?.answered" class="quiz-options">
                <button
                  v-for="(opt, oi) in variation.particle_options"
                  :key="oi"
                  class="particle-btn"
                  :class="{
                    'particle-correct': quizStates[vi]?.selected === opt && opt === variation.correct_particle,
                    'particle-wrong': quizStates[vi]?.selected === opt && opt !== variation.correct_particle,
                    'particle-disabled': quizStates[vi]?.disabled?.includes(opt),
                  }"
                  :disabled="quizStates[vi]?.disabled?.includes(opt)"
                  @click="selectParticle(vi, opt, variation.correct_particle)"
                >
                  {{ opt }}
                </button>
              </div>

              <!-- Answered state: show options + reveal -->
              <div v-else>
                <div class="quiz-options">
                  <button
                    v-for="(opt, oi) in variation.particle_options"
                    :key="oi"
                    class="particle-btn"
                    :class="{
                      'particle-correct': opt === variation.correct_particle,
                      'particle-wrong': quizStates[vi]?.selected === opt && opt !== variation.correct_particle,
                      'particle-disabled': opt !== variation.correct_particle && !(quizStates[vi]?.selected === opt && opt !== variation.correct_particle),
                    }"
                    disabled
                  >
                    <span v-if="opt === variation.correct_particle" class="check-icon">✓</span>
                    <span v-else-if="quizStates[vi]?.selected === opt" class="cross-icon">✗</span>
                    {{ opt }}
                  </button>
                </div>

                <transition name="reveal">
                  <div v-if="quizStates[vi]?.answered" class="quiz-reveal">
                    <div class="reveal-label">
                      {{ t('board.meaning') }}
                    </div>
                    <div class="reveal-meaning">
                      {{ variation.meaning }}
                    </div>
                    <div class="reveal-full-sentence">
                      {{ variation.example_sentence }}
                    </div>
                    <div class="reveal-translation">
                      {{ variation.example_translation }}
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Reset -->
              <div v-if="quizStates[vi]?.answered" class="quiz-actions">
                <button class="reset-btn" @click="resetCard(vi)">
                  {{ t('board.check') }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.phrasal-board {
  font-family: var(--lang-font, inherit);
  color: var(--fg-primary-color);
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--fg-muted-color);
  font-size: 0.95rem;
}

/* Board Header */
.board-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 4px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.base-verb-display {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--fg-primary-color);
  line-height: 1;
  letter-spacing: -0.02em;
}

.base-meaning-display {
  font-size: 0.95rem;
  color: var(--fg-muted-color);
  font-weight: 500;
}

/* Mode Toggle */
.mode-toggle-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid var(--border-primary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-secondary-color);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-toggle-btn:hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
  color: var(--fg-primary-color);
}

.mode-toggle-btn.quiz-active {
  background: var(--bg-accent-overlay-color);
  border-color: var(--border-accent-color);
  color: var(--fg-accent-color);
}

.mode-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Variations List */
.variations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Variation Card */
.variation-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.variation-card.quiz-card {
  border-color: var(--border-accent-color);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--bg-tertiary-color);
  border-bottom: 1px solid var(--border-secondary-color);
}

.phrasal-verb-display {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  letter-spacing: -0.01em;
}

:deep(.particle-highlight) {
  color: var(--fg-accent-color);
  background: var(--bg-accent-overlay-color);
  border-radius: 4px;
  padding: 0 3px;
  font-weight: 900;
  border-bottom: 2px solid var(--fg-accent-color);
}

.card-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-primary-color);
  color: var(--fg-muted-color);
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border-secondary-color);
}

/* Study Content */
.study-content {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.study-meaning {
  font-size: 0.95rem;
  color: var(--fg-secondary-color);
  font-weight: 500;
  line-height: 1.4;
}

.study-example {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--bg-primary-color);
  border-radius: 10px;
  border: 1px solid var(--border-secondary-color);
}

.example-sentence {
  font-size: 0.92rem;
  color: var(--fg-primary-color);
  line-height: 1.55;
}

.example-translation {
  font-size: 0.82rem;
  color: var(--fg-muted-color);
  font-style: italic;
}

/* Quiz Content */
.quiz-content {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quiz-sentence {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--fg-primary-color);
}

:deep(.quiz-blank) {
  display: inline-block;
  min-width: 60px;
  border-bottom: 2.5px solid var(--fg-accent-color);
  color: var(--fg-accent-color);
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 0 4px;
  margin: 0 2px;
  text-align: center;
}

/* Particle Options */
.quiz-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.particle-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid var(--border-primary-color);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s,
    box-shadow 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--lang-font, inherit);
}

.particle-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
  transform: translateY(-1px);
}

.particle-btn:not(:disabled):active {
  transform: translateY(0);
}

.particle-btn.particle-correct {
  background: var(--bg-success-color, #1a3d1f);
  border-color: var(--border-success-color, #2d9e3f);
  color: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
  animation: pulse-correct 0.4s ease;
}

.particle-btn.particle-wrong {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: var(--fg-error-color, #ef4444);
  animation: shake 0.5s ease;
}

.particle-btn.particle-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.check-icon {
  font-size: 0.85rem;
  color: #4ade80;
}

.cross-icon {
  font-size: 0.85rem;
  color: var(--fg-error-color, #ef4444);
}

/* Reveal Section */
.quiz-reveal {
  padding: 14px;
  background: var(--bg-tertiary-color);
  border-radius: 10px;
  border: 1px solid var(--border-success-color, rgba(74, 222, 128, 0.3));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reveal-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fg-muted-color);
}

.reveal-meaning {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg-primary-color);
}

.reveal-full-sentence {
  font-size: 0.88rem;
  color: var(--fg-secondary-color);
  line-height: 1.5;
  padding-top: 4px;
  border-top: 1px solid var(--border-secondary-color);
  margin-top: 2px;
}

.reveal-translation {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-style: italic;
}

/* Quiz Actions */
.quiz-actions {
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-secondary-color);
  background: transparent;
  color: var(--fg-muted-color);
  transition:
    background 0.15s,
    color 0.15s;
}

.reset-btn:hover {
  background: var(--bg-action-hover-color);
  color: var(--fg-primary-color);
}

/* Animations */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(-6px);
  }
  30% {
    transform: translateX(6px);
  }
  45% {
    transform: translateX(-4px);
  }
  60% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-2px);
  }
  90% {
    transform: translateX(2px);
  }
}

@keyframes pulse-correct {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

.reveal-enter-active {
  animation: reveal-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes reveal-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .phrasal-board {
    padding: 12px;
    gap: 12px;
  }

  .board-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .base-verb-display {
    font-size: 1.9rem;
  }

  .mode-toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    padding: 12px 14px;
  }

  .phrasal-verb-display {
    font-size: 1.2rem;
  }

  .study-content,
  .quiz-content {
    padding: 12px 14px;
    gap: 10px;
  }

  .quiz-options {
    gap: 6px;
  }

  .particle-btn {
    font-size: 0.88rem;
    padding: 7px 12px;
  }

  .quiz-sentence {
    font-size: 0.95rem;
  }
}
</style>
