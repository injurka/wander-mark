<script setup lang="ts">
import type { BuilderData } from '../types'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import { usePluginI18n } from '../i18n'
import { tbActions } from '../store/textbook.store'

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
  available.value.splice(index, 1)
  selected.value.push(token)
}

function deselectToken(token: any, index: number) {
  selected.value.splice(index, 1)
  available.value.push(token)
}

function checkResult() {
  const currentStr = selected.value.map(t => t.text).join('')
  if (currentStr === props.data.target) {
    showLogic.value = true
  }
  else {
    tbActions.notify(t('board.wrongAnswer'), 'warning')
  }
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

    <!-- Выбранные блоки -->
    <div class="drop-zone" :class="{ 'is-correct': showLogic }">
      <div v-if="selected.length === 0" class="placeholder">
        Кликай по блокам ниже...
      </div>
      <div
        v-for="(t, i) in selected" :key="i"
        class="token selected" @click="deselectToken(t, i)"
      >
        <span v-if="showLogic" class="logic-tag">{{ t.logic_tag }}</span>
        {{ t.text }}
      </div>
    </div>

    <!-- Доступные блоки -->
    <div v-if="!showLogic" class="pool-zone">
      <div
        v-for="(t, i) in available" :key="i"
        class="token" @click="selectToken(t, i)"
      >
        {{ t.text }}
      </div>
    </div>

    <button v-if="!showLogic" class="btn-primary" :disabled="available.length > 0" @click="checkResult">
      {{ t('board.check') }}
    </button>

    <Transition name="fade">
      <div v-if="showLogic" class="logic-explanation">
        <h3>{{ t('board.logicTitle') }}</h3>
        <div class="logic-chain">
          <span v-for="(t, idx) in data.tokens" :key="idx" class="chain-item">
            <span class="chain-tag">{{ t.logic_tag }}</span>
            <span class="chain-text">{{ t.text }}</span>
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
  padding: 16px;
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
.token:hover {
  background: var(--bg-hover-color);
  transform: translateY(-2px);
  border-color: var(--border-focus-color);
}
.token.selected {
  background: var(--bg-accent-color);
  border-color: var(--border-accent-color);
}

.logic-tag {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  background: var(--bg-inverted-color);
  color: var(--fg-inverted-color);
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.btn-primary {
  background: var(--bg-action-hover-color);
  color: var(--fg-inverted-color);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  align-self: flex-start;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.markdown-body {
  color: var(--fg-secondary-color);
  line-height: 1.6;
}

/* Адаптив Builder */
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
