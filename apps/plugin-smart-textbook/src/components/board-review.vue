<script setup lang="ts">
import type { ReviewData } from '../types'
import { marked } from 'marked'
import { ref } from 'vue'
import { usePluginI18n } from '../i18n'

defineProps<{ data: ReviewData }>()
const { t } = usePluginI18n()

const cardStates = ref(new Map<number, { flipped: boolean, showHint: boolean }>())

function getCardState(index: number) {
  if (!cardStates.value.has(index)) {
    cardStates.value.set(index, { flipped: false, showHint: false })
  }
  return cardStates.value.get(index)!
}

function flipCard(index: number) {
  const state = getCardState(index)
  state.flipped = !state.flipped
}

function showHint(index: number) {
  getCardState(index).showHint = true
}

function parseMarkdown(text: string) {
  return marked.parse(text)
}
</script>

<template>
  <div class="review-board">
    <div v-for="(card, index) in data.cards" :key="index" class="flashcard-container">
      <div class="flashcard" :class="{ 'is-flipped': getCardState(index).flipped }">
        <!-- Лицевая сторона -->
        <div class="card-face card-front">
          <div class="card-content">
            <p class="context">
              {{ card.context_with_blank }}
            </p>

            <div class="hint-area">
              <button v-if="!getCardState(index).showHint" class="btn-hint" @click.stop="showHint(index)">
                👁 {{ t('board.hint') }}
              </button>
              <p v-else class="pinyin-hint">
                {{ card.pinyin_hint }}
              </p>
            </div>
          </div>
          <button class="btn-flip" @click="flipCard(index)">
            ↺ {{ t('board.flipCard') }}
          </button>
        </div>

        <!-- Обратная сторона -->
        <div class="card-face card-back">
          <div class="card-content">
            <h3 class="answer">
              {{ card.answer }}
            </h3>
            <p class="pinyin-answer">
              {{ card.pinyin_hint }}
            </p>
            <div class="explanation markdown-body" v-html="parseMarkdown(card.explanation)" />
          </div>
          <button class="btn-flip" @click="flipCard(index)">
            ↺ Назад
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-board {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}
.flashcard-container {
  width: 100%;
  max-width: 500px;
  height: 300px;
  perspective: 1000px;
}
.flashcard {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flashcard.is-flipped {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: var(--bg-tertiary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.card-back {
  transform: rotateY(180deg);
  background: var(--bg-accent-overlay-color);
  border-color: var(--border-accent-color);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.context {
  font-size: 1.5em;
  color: var(--fg-primary-color);
  margin-bottom: 24px;
}
.hint-area {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-hint {
  color: var(--fg-accent-color);
  background: transparent;
  border: 1px dashed var(--border-accent-color);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
}
.btn-hint:hover {
  background: var(--bg-accent-color);
}
.pinyin-hint {
  color: var(--fg-secondary-color);
  font-family: monospace;
  font-size: 1.2em;
}

.answer {
  font-size: 3em;
  color: var(--fg-primary-color);
  margin: 0;
  font-family: 'Maple Mono CN';
}
.pinyin-answer {
  color: var(--fg-accent-color);
  margin-bottom: 16px;
}
.explanation {
  font-size: 0.9em;
  color: var(--fg-secondary-color);
  text-align: left;
  width: 100%;
  overflow-y: auto;
  max-height: 120px;
  padding: 8px;
  background: var(--bg-primary-color);
  border-radius: 8px;
}

.btn-flip {
  width: 100%;
  padding: 12px;
  background: var(--bg-secondary-color);
  border: none;
  border-radius: 8px;
  color: var(--fg-primary-color);
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-flip:hover {
  background: var(--bg-hover-color);
}

/* Адаптив карточек */
@media (max-width: 768px) {
  .flashcard-container {
    height: 350px; /* Больше высоты для текста на узком экране */
  }
  .context {
    font-size: 1.2em;
  }
  .answer {
    font-size: 2.2em;
  }
  .card-face {
    padding: 16px;
  }
}
</style>
