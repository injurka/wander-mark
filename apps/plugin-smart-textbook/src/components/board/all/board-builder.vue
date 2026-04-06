<script setup lang="ts">
import type { BuilderData } from '../../../types'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'
import { tbActions } from '../../../store/textbook.store'

const props = defineProps<{ data: BuilderData }>()
const { t } = usePluginI18n()

const available = ref<any[]>([])
const selected = ref<any[]>([])
const showLogic = ref(false)

watch(() => props.data, (newData) => {
  available.value = [...newData.tokens].sort(() => Math.random() - 0.5)
  selected.value = []
  showLogic.value = false
}, { immediate: true })

function selectToken(token: any, index: number) {
  if (showLogic.value)
    return
  available.value.splice(index, 1)
  selected.value.push(token)
}

function deselectToken(token: any, index: number) {
  if (showLogic.value)
    return
  selected.value.splice(index, 1)
  available.value.push(token)
}

/**
 * Проверка ответа.
 * Нормализуем обе строки: убираем лишние пробелы и сравниваем.
 * Также проверяем совпадение порядка токенов.
 */
function checkResult() {
  // Сравниваем по порядку токенов (самый надёжный способ)
  const isCorrect = selected.value.length === props.data.tokens.length
    && selected.value.every((tok, i) => tok.text === props.data.tokens[i].text)

  if (isCorrect) {
    showLogic.value = true
  }
  else {
    // Запасная проверка: конкатенация текстов
    const currentStr = selected.value.map(tok => tok.text).join('').replace(/\s+/g, '')
    const targetStr = props.data.target.replace(/\s+/g, '')
    if (currentStr === targetStr) {
      showLogic.value = true
    }
    else {
      tbActions.notify(t('board.wrongAnswer'), 'warning')
    }
  }
}

function showAnswer() {
  selected.value = [...props.data.tokens]
  available.value = []
  showLogic.value = true
}

const parsedGrammar = computed(() => marked.parse(props.data.grammar_rule))
</script>

<template>
  <div class="builder-board">
    <h2>{{ t('board.builderTitle') }}</h2>
    <div class="target-card">
      <span class="label">{{ t('board.translatePrompt') }}</span>
      <p class="target-text">
        {{ data.grammar_rule.split('.')[0] }}...
      </p>
    </div>

    <div class="drop-zone" :class="{ 'is-correct': showLogic }">
      <div v-if="selected.length === 0" class="placeholder">
        Кликай по блокам ниже...
      </div>
      <div
        v-for="(tok, i) in selected" :key="i"
        class="token selected"
        :class="{ locked: showLogic }"
        @click="deselectToken(tok, i)"
      >
        <span v-if="showLogic" class="logic-tag">{{ tok.logic_tag }}</span>
        {{ tok.text }}
      </div>
    </div>

    <div v-if="!showLogic" class="pool-zone">
      <div
        v-for="(tok, i) in available" :key="i"
        class="token" @click="selectToken(tok, i)"
      >
        {{ tok.text }}
      </div>
    </div>

    <div v-if="!showLogic" class="actions-row">
      <button class="btn-primary" :disabled="available.length > 0" @click="checkResult">
        {{ t('board.check') }}
      </button>
      <button class="btn-secondary" @click="showAnswer">
        {{ t('board.showAnswer') }}
      </button>
    </div>

    <Transition name="fade">
      <div v-if="showLogic" class="logic-explanation">
        <h3>{{ t('board.logicTitle') }}</h3>
        <div class="logic-chain">
          <span v-for="(tok, idx) in data.tokens" :key="idx" class="chain-item">
            <span class="chain-tag">{{ tok.logic_tag }}</span>
            <span class="chain-text">{{ tok.text }}</span>
            <span v-if="tok.transcription" class="chain-transcription">{{ tok.transcription }}</span>
          </span>
        </div>
        <div class="markdown-body" v-html="parsedGrammar" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.builder-board {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100% - 78px);
}
.target-card {
  background: var(--bg-secondary-color);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid var(--border-accent-color);
}
.label {
  font-size: 12px;
  color: var(--fg-secondary-color);
  text-transform: uppercase;
}
.target-text {
  font-size: 1.1em;
  color: var(--fg-primary-color);
  font-weight: 500;
  margin-top: 4px;
}

.drop-zone {
  min-height: 80px;
  border: 2px dashed var(--border-primary-color);
  border-radius: 12px;
  padding: 20px 16px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  transition: all 0.3s;
}
.drop-zone.is-correct {
  border-color: var(--border-success-color);
  background: var(--bg-success-color);
}
.placeholder {
  color: var(--fg-muted-color);
  font-style: italic;
}

.pool-zone {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.token {
  padding: 12px 20px;
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 1.2em;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.token:hover:not(.locked) {
  background: var(--bg-hover-color);
  transform: translateY(-2px);
  border-color: var(--border-focus-color);
}
.token.selected {
  background: var(--bg-accent-color);
  border-color: var(--border-accent-color);
}
.token.locked {
  cursor: default;
  pointer-events: none;
}

/* logic-tag — плавающий тег над токеном.
   max-width ограничен, чтобы не заезжал на соседей. */
.logic-tag {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  background: var(--bg-inverted-color);
  color: var(--fg-inverted-color);
  padding: 1px 6px;
  border-radius: 10px;
  white-space: nowrap;
  max-width: calc(100% + 16px);
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.actions-row {
  display: flex;
  gap: 12px;
}
.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.btn-primary {
  background: var(--bg-action-hover-color);
  color: var(--fg-inverted-color);
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: transparent;
  color: var(--fg-secondary-color);
  border: 1px solid var(--border-secondary-color);
}
.btn-secondary:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}

.logic-explanation {
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-secondary-color);
}
.logic-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 16px 0;
}
.chain-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-tertiary-color);
  padding: 8px 12px;
  border-radius: 8px;
}
.chain-tag {
  font-size: 12px;
  color: var(--fg-accent-color);
}
.chain-text {
  font-size: 1.2em;
  font-weight: bold;
}
.chain-transcription {
  font-size: 0.9em;
  color: var(--fg-secondary-color);
  font-family: monospace;
  margin-top: 2px;
}

.markdown-body {
  color: var(--fg-secondary-color);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .token {
    font-size: 1em;
    padding: 8px 12px;
  }
  .logic-chain {
    gap: 8px;
  }
  .chain-text {
    font-size: 1em;
  }
}
</style>
