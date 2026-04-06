<script setup lang="ts">
import type { MeasureWordsData } from '../../../types'
import { computed, reactive, ref } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: MeasureWordsData }>()

const { t } = usePluginI18n()

const currentIndex = ref(0)
const slideDir = ref('slide-left')

const answeredMap = reactive<Record<number, boolean>>({})
const disabledSets = reactive<Record<number, Set<number>>>({})
const shakingOption = ref<number | null>(null)

const ex = computed(() => props.data.exercises[currentIndex.value])

const correctIndex = computed(() => {
  const exercise = ex.value
  return exercise.options.findIndex(o => o.text === exercise.correct_measure)
})

const isAnswered = computed(() => answeredMap[currentIndex.value] === true)

const disabledOptions = computed(() => {
  return disabledSets[currentIndex.value] || new Set<number>()
})

const correctCount = computed(() =>
  Object.values(answeredMap).filter(v => v === true).length,
)

function optionClass(oi: number): string[] {
  const classes: string[] = []
  const answered = answeredMap[currentIndex.value]
  const disabled = disabledOptions.value.has(oi)

  if (answered === true) {
    if (oi === correctIndex.value)
      classes.push('correct')
    else if (disabled)
      classes.push('wrong-used')
    else classes.push('neutral-used')
  }
  else if (disabled) {
    classes.push('wrong-flash')
  }
  if (shakingOption.value === oi) {
    classes.push('shake')
  }
  return classes
}

function selectOption(oi: number) {
  if (isAnswered.value)
    return
  if (disabledOptions.value.has(oi))
    return

  if (oi === correctIndex.value) {
    answeredMap[currentIndex.value] = true
  }
  else {
    // Wrong: shake, disable
    if (!disabledSets[currentIndex.value]) {
      disabledSets[currentIndex.value] = new Set()
    }
    disabledSets[currentIndex.value].add(oi)
    shakingOption.value = oi
    setTimeout(() => { shakingOption.value = null }, 600)
  }
}

function revealAnswer() {
  answeredMap[currentIndex.value] = true
}

function navigate(dir: number) {
  slideDir.value = dir > 0 ? 'slide-left' : 'slide-right'
  currentIndex.value = Math.max(0, Math.min(props.data.exercises.length - 1, currentIndex.value + dir))
}

function jumpTo(i: number) {
  slideDir.value = i > currentIndex.value ? 'slide-left' : 'slide-right'
  currentIndex.value = i
}
</script>

<template>
  <div class="mw-board">
    <div class="mw-progress-header">
      <div class="mw-progress-label">
        {{ currentIndex + 1 }} / {{ data.exercises.length }}
      </div>
      <div class="mw-progress-track" role="progressbar" :aria-valuenow="currentIndex + 1" :aria-valuemax="data.exercises.length">
        <div
          class="mw-progress-fill"
          :style="{ width: `${((currentIndex + 1) / data.exercises.length) * 100}%` }"
        />
      </div>
      <div class="mw-progress-dots">
        <button
          v-for="(_, i) in data.exercises"
          :key="i"
          class="mw-dot"
          :class="{
            active: i === currentIndex,
            answered: answeredMap[i] !== undefined,
            correct: answeredMap[i] === true,
            wrong: answeredMap[i] === false,
          }"
          :aria-label="`${t('board.progress')} ${i + 1}`"
          @click="jumpTo(i)"
        />
      </div>
    </div>

    <Transition :name="slideDir" mode="out-in">
      <div :key="currentIndex" class="mw-card">
        <div class="mw-noun-section">
          <div class="mw-noun-character">
            {{ ex.noun }}
          </div>
          <div class="mw-noun-pinyin">
            {{ ex.noun_pinyin }}
          </div>
          <div class="mw-noun-meaning">
            {{ ex.noun_meaning }}
          </div>
        </div>

        <div class="mw-prompt">
          {{ t('board.chooseMeasureWord') }}
        </div>

        <div class="mw-options">
          <button
            v-for="(opt, oi) in ex.options"
            :key="oi"
            class="mw-option"
            :class="optionClass(oi)"
            :disabled="isAnswered || disabledOptions.has(oi)"
            @click="selectOption(oi)"
          >
            <span class="mw-option-text">{{ opt.text }}</span>
            <span class="mw-option-pinyin">{{ opt.pinyin }}</span>
            <span v-if="isAnswered && oi === correctIndex" class="mw-option-icon correct-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9.5L7.5 13L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span v-else-if="disabledOptions.has(oi) && oi !== correctIndex" class="mw-option-icon wrong-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M5 5L13 13M13 5L5 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
          </button>
        </div>

        <div v-if="!isAnswered" class="mw-reveal-row">
          <button class="mw-reveal-btn" @click="revealAnswer">
            {{ t('board.showAnswer') }}
          </button>
        </div>

        <Transition name="result-fade">
          <div v-if="isAnswered" class="mw-result">
            <div class="mw-result-sentence">
              <div class="mw-example-chinese">
                {{ ex.example_sentence }}
              </div>
              <div class="mw-example-pinyin">
                {{ ex.example_pinyin }}
              </div>
              <div class="mw-example-translation">
                {{ ex.example_translation }}
              </div>
            </div>
            <div class="mw-explanation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" />
                <path d="M7 6v4M7 4v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
              {{ ex.explanation }}
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <div class="mw-navigation">
      <button
        class="mw-nav-btn"
        :disabled="currentIndex === 0"
        :aria-label="t('board.prev')"
        @click="navigate(-1)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L7 9L11 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ t('board.prev') }}
      </button>

      <div v-if="Object.keys(answeredMap).length > 0" class="mw-score">
        <span class="score-correct">{{ correctCount }}</span>
        <span class="score-sep">/</span>
        <span class="score-total">{{ Object.keys(answeredMap).length }}</span>
      </div>

      <button
        class="mw-nav-btn next"
        :disabled="currentIndex === data.exercises.length - 1"
        :aria-label="t('board.next')"
        @click="navigate(1)"
      >
        {{ t('board.next') }}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7 4L11 9L7 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mw-board {
  font-family: var(--lang-font, system-ui, sans-serif);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
}

.mw-progress-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mw-progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--fg-muted-color);
  text-align: right;
}

.mw-progress-track {
  height: 6px;
  background: var(--bg-tertiary-color);
  border-radius: 99px;
  overflow: hidden;
}

.mw-progress-fill {
  height: 100%;
  background: var(--bg-accent-color);
  border-radius: 99px;
  transition: width 0.35s ease;
}

.mw-progress-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mw-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border-primary-color);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.15s;
}

.mw-dot.active {
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
  transform: scale(1.2);
}

.mw-dot.correct {
  background: var(--bg-success-color);
  border-color: var(--border-success-color);
}

.mw-dot.wrong {
  background: var(--bg-warning-color);
  border-color: var(--border-warning-color);
}

.mw-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 14px;
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 260px;
}

.mw-noun-section {
  text-align: center;
}

.mw-noun-character {
  font-size: 3.2rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  line-height: 1;
  margin-bottom: 6px;
}

.mw-noun-pinyin {
  font-size: 1rem;
  color: var(--fg-secondary-color);
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.mw-noun-meaning {
  font-size: 0.88rem;
  color: var(--fg-muted-color);
  font-style: italic;
}

.mw-prompt {
  text-align: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mw-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.mw-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 18px 10px;
  min-width: 70px;
  background: var(--bg-tertiary-color);
  border: 2px solid var(--border-primary-color);
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s,
    transform 0.15s;
  color: var(--fg-primary-color);
}

.mw-option:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-accent-color);
  transform: translateY(-2px);
}

.mw-option:disabled {
  cursor: default;
}

.mw-option.correct {
  background: rgba(34, 197, 94, 0.15);
  border-color: var(--border-success-color);
  color: var(--fg-primary-color);
}

.mw-option.wrong-flash {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.5);
  opacity: 0.6;
}

.mw-option.wrong-used {
  opacity: 0.45;
  border-color: var(--border-primary-color);
}

.mw-option.neutral-used {
  opacity: 0.55;
}

.mw-option-text {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1;
}

.mw-option-pinyin {
  font-size: 0.7rem;
  color: var(--fg-secondary-color);
}

.mw-option-icon {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  align-items: center;
}

.correct-icon {
  color: var(--bg-success-color, #22c55e);
}

.wrong-icon {
  color: var(--fg-error-color, #ef4444);
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

.mw-option.shake {
  animation: shake 0.5s ease;
}

.mw-reveal-row {
  text-align: center;
}

.mw-reveal-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--fg-muted-color);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
  font-family: inherit;
}

.mw-reveal-btn:hover {
  color: var(--fg-secondary-color);
}

.mw-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--bg-primary-color);
  border-radius: 10px;
  border: 1px solid var(--border-success-color, rgba(34, 197, 94, 0.4));
}

.mw-result-sentence {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mw-example-chinese {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  letter-spacing: 0.04em;
}

.mw-example-pinyin {
  font-size: 0.82rem;
  color: var(--fg-secondary-color);
}

.mw-example-translation {
  font-size: 0.85rem;
  color: var(--fg-accent-color);
  font-style: italic;
}

.mw-explanation {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  line-height: 1.6;
}

.mw-explanation svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--fg-accent-color);
}

.result-fade-enter-active,
.result-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.result-fade-enter-from,
.result-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.mw-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mw-nav-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background: var(--bg-secondary-color);
  border: 1.5px solid var(--border-primary-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  font-family: inherit;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.12s;
}

.mw-nav-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-accent-color);
  transform: translateY(-1px);
}

.mw-nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.mw-nav-btn.next {
  background: var(--bg-accent-overlay-color);
  border-color: var(--border-accent-color);
  color: var(--fg-accent-color);
}

.mw-score {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--fg-secondary-color);
  display: flex;
  align-items: center;
  gap: 2px;
}

.score-correct {
  color: var(--bg-success-color, #22c55e);
}

.score-sep {
  color: var(--fg-muted-color);
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
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

@media (max-width: 768px) {
  .mw-board {
    padding: 14px;
    gap: 12px;
  }

  .mw-card {
    padding: 20px 16px;
  }

  .mw-noun-character {
    font-size: 2.5rem;
  }

  .mw-option {
    min-width: 60px;
    padding: 8px 12px;
  }

  .mw-option-text {
    font-size: 1.1rem;
  }

  .mw-nav-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}
</style>
