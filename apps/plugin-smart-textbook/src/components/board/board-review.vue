<script setup lang="ts">
import type { ReviewData } from '../../types'
import { marked } from 'marked'
import { ref } from 'vue'
import { usePluginI18n } from '../../i18n'

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
        <div class="card-face card-front">
          <div class="card-content">
            <p class="context">
              {{ card.context_with_blank }}
            </p>

            <div v-if="card.phonetic_hint" class="hint-area">
              <button v-if="!getCardState(index).showHint" class="btn-hint" @click.stop="showHint(index)">
                👁 {{ t('board.hint') }}
              </button>
              <p v-else class="phonetic-hint">
                {{ card.phonetic_hint }}
              </p>
            </div>
          </div>
          <button class="btn-flip" @click="flipCard(index)">
            ↺ {{ t('board.flipCard') }}
          </button>
        </div>

        <div class="card-face card-back">
          <div class="card-content">
            <h3 class="answer">
              {{ card.answer }}
            </h3>
            <p v-if="card.phonetic_hint" class="phonetic-answer">
              {{ card.phonetic_hint }}
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
  min-height: calc(100% - 78px);
}
.flashcard-container {
  width: 100%;
  max-width: 500px;
  height: 350px;
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
  overflow: hidden;
}
.card-back {
  transform: rotateY(180deg);
  background: var(--bg-accent-color);
  border-color: var(--border-accent-color);
}
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 0;
  width: 100%;
}
.context {
  font-size: 1.5em;
  color: var(--fg-primary-color);
  margin-bottom: 24px;
  font-family: var(--lang-font, inherit);
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
.phonetic-hint {
  color: var(--fg-secondary-color);
  font-family: monospace;
  font-size: 1.2em;
}
.answer {
  font-size: 3em;
  color: var(--fg-primary-color);
  margin: 0;
  font-family: var(--lang-font, inherit);
}
.phonetic-answer {
  color: var(--fg-accent-color);
  margin-bottom: 16px;
  font-family: monospace;
}
.explanation {
  font-size: 0.9em;
  color: var(--fg-secondary-color);
  text-align: left;
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: var(--bg-primary-color);
  border-radius: 8px;
  margin-bottom: 16px;

  p {
    margin: 0;
  }
}
.btn-flip {
  flex-shrink: 0;
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
@media (max-width: 768px) {
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
