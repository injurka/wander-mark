<script setup lang="ts">
import type { AspectPairsData } from '../../../types'
import { marked } from 'marked'
import { ref } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: AspectPairsData }>()

const { t } = usePluginI18n()

const openRules = ref<Set<number>>(new Set())

function toggleRule(index: number) {
  const next = new Set(openRules.value)
  if (next.has(index)) {
    next.delete(index)
  }
  else {
    next.add(index)
  }
  openRules.value = next
}

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}
</script>

<template>
  <div class="aspect-board">
    <div v-if="!data || !data.pairs || data.pairs.length === 0" class="empty-state">
      <span>{{ t('tb.emptyState') }}</span>
    </div>

    <template v-else>
      <div
        v-for="(pair, pairIndex) in data.pairs"
        :key="pairIndex"
        class="pair-card"
      >
        <!-- Base Meaning -->
        <div class="base-meaning">
          <span class="base-meaning-icon">◈</span>
          {{ pair.base_meaning }}
        </div>

        <!-- Two Column: НСВ / СВ -->
        <div class="aspect-columns">
          <!-- Imperfective -->
          <div class="aspect-col imperfective-col">
            <div class="aspect-badge imp-badge">
              {{ t('board.imperfective') }}
            </div>
            <div class="aspect-verb imp-verb">
              {{ pair.imperfective }}
            </div>
            <div class="aspect-usage">
              {{ pair.imperfective_usage }}
            </div>
          </div>

          <!-- Divider -->
          <div class="col-divider">
            <div class="divider-line" />
            <span class="divider-arrow">⇌</span>
            <div class="divider-line" />
          </div>

          <!-- Perfective -->
          <div class="aspect-col perfective-col">
            <div class="aspect-badge perf-badge">
              {{ t('board.perfective') }}
            </div>
            <div class="aspect-verb perf-verb">
              {{ pair.perfective }}
            </div>
            <div class="aspect-usage">
              {{ pair.perfective_usage }}
            </div>
          </div>
        </div>

        <!-- Examples Section -->
        <div v-if="pair.examples && pair.examples.length" class="examples-section">
          <div class="section-label">
            {{ t('board.example') }}
          </div>
          <div
            v-for="(ex, ei) in pair.examples"
            :key="ei"
            class="example-block"
          >
            <div class="example-sentences">
              <div class="example-item imp-example">
                <span class="example-dot imp-dot" />
                <span class="example-sent">{{ ex.imperfective_sentence }}</span>
              </div>
              <div class="example-item perf-example">
                <span class="example-dot perf-dot" />
                <span class="example-sent">{{ ex.perfective_sentence }}</span>
              </div>
            </div>
            <div class="example-footer">
              <span class="example-translation">{{ ex.translation }}</span>
              <span class="context-hint-badge">{{ ex.context_hint }}</span>
            </div>
          </div>
        </div>

        <!-- Formation Rule -->
        <div v-if="pair.formation_rule" class="formation-rule-block">
          <button
            class="formation-toggle"
            @click="toggleRule(pairIndex)"
          >
            <span class="formation-toggle-label">{{ t('board.formationRule') }}</span>
            <span class="toggle-icon" :class="{ open: openRules.has(pairIndex) }">▾</span>
          </button>
          <transition name="collapse">
            <div v-if="openRules.has(pairIndex)" class="formation-body">
              <div class="formation-content" v-html="renderMarkdown(pair.formation_rule)" />
            </div>
          </transition>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.aspect-board {
  font-family: var(--lang-font, inherit);
  color: var(--fg-primary-color);
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100% - 78px);
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--fg-muted-color);
  font-size: 0.95rem;
}

/* Pair Card */
.pair-card {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Base Meaning */
.base-meaning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--bg-tertiary-color);
  border-bottom: 1px solid var(--border-secondary-color);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
}

.base-meaning-icon {
  color: var(--fg-accent-color);
  font-size: 1rem;
}

/* Two Columns */
.aspect-columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
}

.aspect-col {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Imperfective — warm amber tones */
.imperfective-col {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.07) 0%, rgba(245, 158, 11, 0.04) 100%);
  border-right: 1px solid var(--border-secondary-color);
}

/* Perfective — cool blue tones */
.perfective-col {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.07) 0%, rgba(99, 102, 241, 0.04) 100%);
}

.aspect-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  align-self: flex-start;
}

.imp-badge {
  background: rgba(251, 191, 36, 0.18);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.perf-badge {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.aspect-verb {
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.imp-verb {
  color: #f59e0b;
}

.perf-verb {
  color: #3b82f6;
}

.aspect-usage {
  font-size: 0.84rem;
  color: var(--fg-secondary-color);
  line-height: 1.5;
}

/* Divider */
.col-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  gap: 6px;
}

.divider-line {
  flex: 1;
  width: 1px;
  background: var(--border-secondary-color);
}

.divider-arrow {
  font-size: 1.1rem;
  color: var(--fg-muted-color);
  line-height: 1;
}

/* Examples */
.examples-section {
  padding: 16px 20px;
  border-top: 1px solid var(--border-secondary-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-primary-color);
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--fg-muted-color);
}

.example-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--bg-secondary-color);
  border-radius: 10px;
  border: 1px solid var(--border-secondary-color);
}

.example-sentences {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.example-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.example-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 7px;
}

.imp-dot {
  background: #f59e0b;
}

.perf-dot {
  background: #3b82f6;
}

.example-sent {
  font-size: 0.9rem;
  color: var(--fg-primary-color);
  line-height: 1.5;
}

.example-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.example-translation {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-style: italic;
}

.context-hint-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 99px;
  background: var(--bg-accent-overlay-color);
  color: var(--fg-accent-color);
  border: 1px solid var(--border-accent-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* Formation Rule */
.formation-rule-block {
  border-top: 1px solid var(--border-secondary-color);
  overflow: hidden;
}

.formation-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-tertiary-color);
  border: none;
  cursor: pointer;
  color: var(--fg-secondary-color);
  transition: background 0.15s;
}

.formation-toggle:hover {
  background: var(--bg-hover-color);
}

.formation-toggle-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--fg-secondary-color);
}

.toggle-icon {
  font-size: 1rem;
  color: var(--fg-muted-color);
  transition: transform 0.25s ease;
}

.toggle-icon.open {
  transform: rotate(180deg);
}

.formation-body {
  padding: 0 20px 16px;
  background: var(--bg-primary-color);
}

.formation-content {
  font-size: 0.88rem;
  line-height: 1.65;
  color: var(--fg-secondary-color);
  padding-top: 12px;
}

:deep(.formation-content p) {
  margin: 0 0 8px;
}
:deep(.formation-content p:last-child) {
  margin-bottom: 0;
}
:deep(.formation-content strong) {
  color: var(--fg-primary-color);
  font-weight: 700;
}
:deep(.formation-content em) {
  color: var(--fg-accent-color);
  font-style: italic;
}
:deep(.formation-content ul) {
  margin: 0 0 8px;
  padding-left: 20px;
}
:deep(.formation-content li) {
  margin-bottom: 4px;
}
:deep(.formation-content code) {
  font-family: monospace;
  background: var(--bg-tertiary-color);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--fg-accent-color);
}

/* Collapse transition */
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
  .aspect-board {
    padding: 12px;
    gap: 16px;
  }

  .aspect-columns {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .col-divider {
    flex-direction: row;
    padding: 4px 16px;
  }

  .col-divider .divider-line {
    flex: 1;
    width: auto;
    height: 1px;
    background: var(--border-secondary-color);
  }

  .divider-arrow {
    transform: rotate(90deg);
    padding: 0 8px;
  }

  .imperfective-col {
    border-right: none;
    border-bottom: 1px solid var(--border-secondary-color);
  }

  .aspect-verb {
    font-size: 1.4rem;
  }

  .examples-section {
    padding: 12px 14px;
  }

  .example-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .formation-toggle {
    padding: 10px 14px;
  }

  .formation-body {
    padding: 0 14px 12px;
  }
}
</style>
