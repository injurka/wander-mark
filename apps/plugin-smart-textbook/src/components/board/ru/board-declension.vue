<script setup lang="ts">
import type { DeclensionData } from '../../../types'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: DeclensionData }>()

const { t } = usePluginI18n()

const currentIndex = ref(0)
const selectedOption = ref<string | null>(null)
const answered = ref(false)
const tableOpen = ref(false)
const disabledOptions = ref<string[]>([])
const completedSet = ref<Set<number>>(new Set())

const exercise = computed(() => props.data.exercises[currentIndex.value])

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}

function renderSentence(sentence: string): string {
  // Replace ___ with a styled blank span
  return sentence.replace(/___/g, '<span class="sentence-blank">___</span>')
}

function selectOption(option: string) {
  if (answered.value || disabledOptions.value.includes(option))
    return
  selectedOption.value = option

  if (option === exercise.value.correct_form) {
    answered.value = true
    completedSet.value = new Set([...completedSet.value, currentIndex.value])
    tableOpen.value = false
  }
  else {
    // Wrong — disable this option after shake animation
    setTimeout(() => {
      if (!disabledOptions.value.includes(option)) {
        disabledOptions.value = [...disabledOptions.value, option]
      }
      selectedOption.value = null
    }, 700)
  }
}

function showAnswer() {
  selectedOption.value = null
  answered.value = true
  tableOpen.value = false
  completedSet.value = new Set([...completedSet.value, currentIndex.value])
}

function goTo(index: number) {
  if (index < 0 || index >= props.data.exercises.length)
    return
  currentIndex.value = index
}

// Reset state when navigating
watch(currentIndex, () => {
  selectedOption.value = null
  answered.value = false
  tableOpen.value = false
  disabledOptions.value = []
})
</script>

<template>
  <div class="declension-board">
    <div v-if="!data || !data.exercises || data.exercises.length === 0" class="empty-state">
      <span>{{ t('tb.emptyState') }}</span>
    </div>

    <template v-else>
      <!-- Progress Header -->
      <div class="progress-header">
        <div class="progress-info">
          <span class="progress-label">{{ t('board.progress') }}</span>
          <span class="progress-counter">{{ currentIndex + 1 }} / {{ data.exercises.length }}</span>
        </div>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: `${((currentIndex + 1) / data.exercises.length) * 100}%` }"
          />
        </div>
      </div>

      <!-- Card -->
      <div :key="currentIndex" class="exercise-card">
        <!-- Word Header -->
        <div class="word-header">
          <span class="base-form">{{ exercise.base_form }}</span>
          <span class="word-type-badge">{{ exercise.word_type }}</span>
        </div>

        <!-- Case Hint -->
        <div class="case-hint">
          <span class="case-hint-label">{{ t('board.targetCase') }}</span>
          <span class="case-hint-value">{{ exercise.target_case }}</span>
        </div>

        <!-- Context Sentence -->
        <div class="sentence-block">
          <div class="sentence-text" v-html="renderSentence(exercise.context_sentence)" />
        </div>

        <!-- Options -->
        <div v-if="!answered" class="options-grid">
          <button
            v-for="(option, i) in exercise.options"
            :key="i"
            class="option-btn"
            :class="{
              'option-correct': selectedOption === option && option === exercise.correct_form,
              'option-wrong': selectedOption === option && option !== exercise.correct_form,
              'option-disabled': disabledOptions.includes(option),
            }"
            :disabled="disabledOptions.includes(option)"
            @click="selectOption(option)"
          >
            <span v-if="selectedOption === option && option === exercise.correct_form" class="option-checkmark">✓</span>
            <span v-if="selectedOption === option && option !== exercise.correct_form" class="option-cross">✗</span>
            {{ option }}
          </button>
        </div>

        <!-- Correct answer revealed state -->
        <div v-else class="options-grid">
          <button
            v-for="(option, i) in exercise.options"
            :key="i"
            class="option-btn"
            :class="{
              'option-correct': option === exercise.correct_form,
              'option-wrong': selectedOption === option && option !== exercise.correct_form,
              'option-disabled': option !== exercise.correct_form && !(selectedOption === option && option !== exercise.correct_form),
            }"
            disabled
          >
            <span v-if="option === exercise.correct_form" class="option-checkmark">✓</span>
            <span v-if="selectedOption === option && option !== exercise.correct_form" class="option-cross">✗</span>
            {{ option }}
          </button>
        </div>

        <!-- Show Answer Button -->
        <div v-if="!answered" class="action-row">
          <button class="show-answer-btn" @click="showAnswer">
            {{ t('board.showAnswer') }}
          </button>
        </div>

        <!-- Explanation (post-answer) -->
        <transition name="slide-down">
          <div v-if="answered" class="answer-reveal">
            <!-- Explanation -->
            <div class="explanation-block">
              <div class="explanation-title">
                {{ t('board.grammarNotes') }}
              </div>
              <div class="explanation-body" v-html="renderMarkdown(exercise.explanation)" />
            </div>

            <!-- Declension Table -->
            <div v-if="exercise.declension_table && exercise.declension_table.length" class="declension-table-block">
              <button class="collapsible-toggle" @click="tableOpen = !tableOpen">
                <span>{{ t('board.fullTable') }}</span>
                <span class="toggle-icon" :class="{ open: tableOpen }">▾</span>
              </button>
              <transition name="collapse">
                <div v-if="tableOpen" class="declension-table-wrapper">
                  <table class="declension-table">
                    <thead>
                      <tr>
                        <th>{{ t('board.targetCase') }}</th>
                        <th>{{ t('board.correct') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, ri) in exercise.declension_table"
                        :key="ri"
                        :class="{ 'row-highlighted': row.case_name === exercise.target_case }"
                      >
                        <td>{{ row.case_name }}</td>
                        <td class="form-cell">
                          {{ row.form }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button class="nav-btn" :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">
          ← {{ t('board.prev') }}
        </button>
        <div class="dot-nav">
          <button
            v-for="(_, i) in data.exercises"
            :key="i"
            class="dot"
            :class="{
              'dot-active': i === currentIndex,
              'dot-done': completedSet.has(i),
            }"
            @click="goTo(i)"
          />
        </div>
        <button
          class="nav-btn nav-btn-next"
          :disabled="currentIndex === data.exercises.length - 1"
          @click="goTo(currentIndex + 1)"
        >
          {{ t('board.next') }} →
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.declension-board {
  font-family: var(--lang-font, inherit);
  color: var(--fg-primary-color);
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% - 78px);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--fg-muted-color);
  font-size: 0.95rem;
}

/* Progress Header */
.progress-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-muted-color);
}

.progress-counter {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--fg-accent-color);
}

.progress-bar-track {
  height: 4px;
  background: var(--bg-tertiary-color);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--fg-accent-color);
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Exercise Card */
.exercise-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Word Header */
.word-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.base-form {
  font-size: 2rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.word-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--bg-accent-overlay-color);
  color: var(--fg-accent-color);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border-accent-color);
  white-space: nowrap;
}

/* Case Hint */
.case-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary-color);
  border-radius: 8px;
  border-left: 3px solid var(--fg-accent-color);
}

.case-hint-label {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-weight: 500;
}

.case-hint-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--fg-accent-color);
}

/* Sentence Block */
.sentence-block {
  padding: 16px;
  background: var(--bg-primary-color);
  border-radius: 10px;
  border: 1px solid var(--border-secondary-color);
}

.sentence-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--fg-primary-color);
}

:deep(.sentence-blank) {
  display: inline-block;
  min-width: 80px;
  border-bottom: 2.5px solid var(--fg-accent-color);
  color: var(--fg-accent-color);
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0 4px;
  margin: 0 2px;
}

/* Options Grid */
.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option-btn {
  flex: 1 1 auto;
  min-width: 100px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
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
  justify-content: center;
  gap: 6px;
  font-family: var(--lang-font, inherit);
}

.option-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  border-color: var(--border-focus-color);
  transform: translateY(-1px);
}

.option-btn:not(:disabled):active {
  transform: translateY(0);
}

.option-btn.option-correct {
  background: var(--bg-success-color, #1a3d1f);
  border-color: var(--border-success-color, #2d9e3f);
  color: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
  animation: pulse-success 0.4s ease;
}

.option-btn.option-wrong {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  color: var(--fg-error-color, #ef4444);
  animation: shake 0.5s ease;
}

.option-btn.option-disabled {
  opacity: 0.38;
  cursor: not-allowed;
  pointer-events: none;
}

.option-checkmark {
  font-size: 0.9rem;
  color: #4ade80;
}

.option-cross {
  font-size: 0.9rem;
  color: var(--fg-error-color, #ef4444);
}

/* Action Row */
.action-row {
  display: flex;
  justify-content: flex-end;
}

.show-answer-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-secondary-color);
  background: transparent;
  color: var(--fg-muted-color);
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.show-answer-btn:hover {
  background: var(--bg-action-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-primary-color);
}

/* Answer Reveal */
.answer-reveal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.explanation-block {
  padding: 16px;
  background: var(--bg-tertiary-color);
  border-radius: 10px;
  border: 1px solid var(--border-secondary-color);
}

.explanation-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fg-muted-color);
  margin-bottom: 8px;
}

.explanation-body {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--fg-secondary-color);
}

:deep(.explanation-body p) {
  margin: 0 0 8px;
}
:deep(.explanation-body p:last-child) {
  margin-bottom: 0;
}
:deep(.explanation-body strong) {
  color: var(--fg-primary-color);
  font-weight: 700;
}
:deep(.explanation-body em) {
  color: var(--fg-accent-color);
  font-style: italic;
}

/* Declension Table */
.declension-table-block {
  border-radius: 10px;
  border: 1px solid var(--border-secondary-color);
  overflow: hidden;
}

.collapsible-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary-color);
  border: none;
  cursor: pointer;
  color: var(--fg-primary-color);
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s;
}

.collapsible-toggle:hover {
  background: var(--bg-hover-color);
}

.toggle-icon {
  font-size: 1.1rem;
  transition: transform 0.25s ease;
  color: var(--fg-muted-color);
}

.toggle-icon.open {
  transform: rotate(180deg);
}

.declension-table-wrapper {
  overflow-x: auto;
}

.declension-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.declension-table thead tr {
  background: var(--bg-primary-color);
}

.declension-table th {
  padding: 8px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-muted-color);
  border-bottom: 1px solid var(--border-primary-color);
}

.declension-table td {
  padding: 9px 16px;
  border-bottom: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
}

.declension-table tbody tr:last-child td {
  border-bottom: none;
}

.declension-table tbody tr {
  background: var(--bg-primary-color);
  transition: background 0.12s;
}

.declension-table tbody tr:hover {
  background: var(--bg-hover-color);
}

.declension-table tr.row-highlighted {
  background: var(--bg-accent-overlay-color) !important;
}

.declension-table tr.row-highlighted td {
  color: var(--fg-accent-color);
  font-weight: 700;
}

.form-cell {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--fg-primary-color) !important;
}

.declension-table tr.row-highlighted .form-cell {
  color: var(--fg-accent-color) !important;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nav-btn {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-primary-color);
  background: var(--bg-secondary-color);
  color: var(--fg-secondary-color);
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s,
    transform 0.1s;
  white-space: nowrap;
}

.nav-btn:not(:disabled):hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
  border-color: var(--border-focus-color);
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.35;
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

.dot-nav {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--border-primary-color);
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s;
  padding: 0;
}

.dot:hover {
  background: var(--fg-muted-color);
  transform: scale(1.2);
}

.dot.dot-active {
  background: var(--fg-accent-color);
  transform: scale(1.3);
}

.dot.dot-done {
  background: var(--bg-success-color, #2d9e3f);
}

.dot.dot-active.dot-done {
  background: var(--fg-accent-color);
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

@keyframes pulse-success {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}

.slide-down-enter-active {
  animation: slide-down-in 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-down-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition:
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s;
  max-height: 600px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Mobile */
@media (max-width: 768px) {
  .declension-board {
    padding: 12px;
    gap: 12px;
  }

  .exercise-card {
    padding: 16px;
    gap: 16px;
    border-radius: 12px;
  }

  .base-form {
    font-size: 1.6rem;
  }

  .sentence-text {
    font-size: 1rem;
  }

  .options-grid {
    gap: 8px;
  }

  .option-btn {
    font-size: 0.9rem;
    padding: 9px 12px;
    min-width: 80px;
  }

  .pagination {
    gap: 8px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .dot {
    width: 7px;
    height: 7px;
  }

  .declension-table th,
  .declension-table td {
    padding: 7px 12px;
    font-size: 0.82rem;
  }
}
</style>
