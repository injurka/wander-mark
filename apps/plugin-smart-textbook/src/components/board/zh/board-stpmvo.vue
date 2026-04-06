<script setup lang="ts">
import type { StpmvoData } from '../../../types'
import { marked } from 'marked'
import { computed, ref } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: StpmvoData }>()

const { t } = usePluginI18n()

const activeIndex = ref<number | null>(null)

const roleColors: Record<string, { bg: string, border: string, text: string }> = {
  S: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.6)', text: '#3b82f6' },
  T: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.6)', text: '#f97316' },
  P: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.6)', text: '#22c55e' },
  M: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.6)', text: '#a855f7' },
  V: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.6)', text: '#ef4444' },
  O: { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.6)', text: '#14b8a6' },
  particle: { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' },
}

const roleLabels: Record<string, string> = {
  S: 'S 主语',
  T: 'T 时间',
  P: 'P 地点',
  M: 'M 状语',
  V: 'V 谓语',
  O: 'O 宾语',
  particle: '助词',
}

const legendRoles = [
  { key: 'S', label: 'S 主语' },
  { key: 'T', label: 'T 时间' },
  { key: 'P', label: 'P 地点' },
  { key: 'M', label: 'M 状语' },
  { key: 'V', label: 'V 谓语' },
  { key: 'O', label: 'O 宾语' },
  { key: 'particle', label: '助词' },
]

function toggleBlock(i: number) {
  activeIndex.value = activeIndex.value === i ? null : i
}

const renderedGrammarNotes = computed(() => {
  if (!props.data.grammar_notes)
    return ''
  return marked.parse(props.data.grammar_notes) as string
})
</script>

<template>
  <div class="stpmvo-board">
    <div class="sentence-header">
      <div class="sentence-ruby">
        <ruby v-for="(comp, i) in data.components" :key="i" class="sentence-ruby-item">
          <span class="sentence-char">{{ comp.text }}</span>
          <rt class="sentence-pinyin-rt">{{ comp.pinyin }}</rt>
        </ruby>
      </div>
      <div class="sentence-full">
        {{ data.sentence }}
      </div>
      <div class="sentence-translation">
        {{ data.translation }}
      </div>
    </div>

    <div class="legend-bar">
      <div v-for="role in legendRoles" :key="role.key" class="legend-item">
        <span class="legend-dot" :style="{ background: roleColors[role.key].bg, border: `2px solid ${roleColors[role.key].border}` }" />
        <span class="legend-label">{{ role.label }}</span>
      </div>
    </div>

    <div class="component-chain">
      <div
        v-for="(comp, i) in data.components"
        :key="i"
        class="comp-block"
        :class="{ active: activeIndex === i }"
        :style="{
          '--block-bg': roleColors[comp.role]?.bg || roleColors.particle.bg,
          '--block-border': roleColors[comp.role]?.border || roleColors.particle.border,
          '--block-text': roleColors[comp.role]?.text || roleColors.particle.text,
        }"
        :aria-expanded="activeIndex === i"
        tabindex="0"
        @click="toggleBlock(i)"
        @keydown.enter="toggleBlock(i)"
        @keydown.space.prevent="toggleBlock(i)"
      >
        <div class="comp-role-label">
          {{ roleLabels[comp.role] || comp.role }}
        </div>
        <div class="comp-text">
          {{ comp.text }}
        </div>
        <div class="comp-pinyin">
          {{ comp.pinyin }}
        </div>
        <div class="comp-meaning">
          {{ comp.meaning }}
        </div>
        <div class="comp-chevron">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path :d="activeIndex === i ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>

    <Transition name="detail-slide">
      <div v-if="activeIndex !== null" :key="activeIndex" class="detail-panel">
        <div class="detail-header">
          <span
            class="detail-role-badge"
            :style="{
              background: roleColors[data.components[activeIndex].role]?.bg,
              borderColor: roleColors[data.components[activeIndex].role]?.border,
              color: roleColors[data.components[activeIndex].role]?.text,
            }"
          >{{ roleLabels[data.components[activeIndex].role] || data.components[activeIndex].role }}</span>
          <span class="detail-text">{{ data.components[activeIndex].text }}</span>
          <span class="detail-pinyin-badge">{{ data.components[activeIndex].pinyin }}</span>
        </div>
        <div class="detail-explanation">
          {{ data.components[activeIndex].explanation }}
        </div>
        <button class="detail-close" :aria-label="t('settings.close')" @click="activeIndex = null">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </Transition>

    <div class="grammar-notes-section">
      <div class="grammar-notes-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5" />
          <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        {{ t('board.grammarNotes') }}
      </div>
      <div class="grammar-notes-content" v-html="renderedGrammarNotes" />
    </div>
  </div>
</template>

<style scoped>
.stpmvo-board {
  font-family: var(--lang-font, system-ui, sans-serif);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100% - 78px);
}

.sentence-header {
  text-align: center;
  padding: 20px 16px;
  background: var(--bg-secondary-color);
  border-radius: 10px;
  border: 1px solid var(--border-primary-color);
}

.sentence-ruby {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 2px;
  margin-bottom: 8px;
  line-height: 2.8;
}

.sentence-ruby-item {
  ruby-align: center;
  ruby-position: over;
}

.sentence-char {
  font-size: 2rem;
  font-weight: 600;
  color: var(--fg-primary-color);
}

.sentence-pinyin-rt {
  font-size: 0.55em;
  color: var(--fg-secondary-color);
  letter-spacing: 0.02em;
  font-weight: 400;
  transform: translateY(-2px);
}

.sentence-full {
  font-size: 1.1rem;
  color: var(--fg-muted-color);
  margin-top: 6px;
  letter-spacing: 0.05em;
}

.sentence-translation {
  font-size: 0.95rem;
  color: var(--fg-accent-color);
  margin-top: 6px;
  font-style: italic;
}

.legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px 14px;
  background: var(--bg-secondary-color);
  border-radius: 8px;
  border: 1px solid var(--border-primary-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--fg-secondary-color);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.component-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.comp-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 14px 12px;
  min-width: 72px;
  background: var(--block-bg);
  border: 2px solid var(--block-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  outline: none;
  user-select: none;
}

.comp-block:hover,
.comp-block:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.comp-block.active {
  border-color: var(--border-focus-color);
  box-shadow:
    0 0 0 3px rgba(var(--border-focus-color), 0.2),
    0 6px 18px rgba(0, 0, 0, 0.1);
}

.comp-role-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--block-text);
  margin-bottom: 2px;
}

.comp-text {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  line-height: 1.1;
}

.comp-pinyin {
  font-size: 0.72rem;
  color: var(--fg-secondary-color);
  letter-spacing: 0.03em;
}

.comp-meaning {
  font-size: 0.72rem;
  color: var(--fg-muted-color);
  text-align: center;
  max-width: 80px;
  line-height: 1.3;
}

.comp-chevron {
  color: var(--block-text);
  opacity: 0.7;
  margin-top: 2px;
}

.detail-panel {
  position: relative;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-accent-color);
  border-radius: 10px;
  padding: 16px 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.detail-role-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1.5px solid;
  letter-spacing: 0.04em;
}

.detail-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--fg-primary-color);
}

.detail-pinyin-badge {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  background: var(--bg-tertiary-color);
  padding: 2px 8px;
  border-radius: 4px;
}

.detail-explanation {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  line-height: 1.65;
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--fg-muted-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition:
    color 0.15s,
    background 0.15s;
}

.detail-close:hover {
  color: var(--fg-primary-color);
  background: var(--bg-hover-color);
}

.detail-slide-enter-active,
.detail-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.detail-slide-enter-from,
.detail-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.grammar-notes-section {
  background: var(--bg-secondary-color);
  border-radius: 10px;
  border: 1px solid var(--border-primary-color);
  padding: 16px 20px;
}

.grammar-notes-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--fg-accent-color);
  margin-bottom: 12px;
}

.grammar-notes-content {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  line-height: 1.7;
}

.grammar-notes-content :deep(h1),
.grammar-notes-content :deep(h2),
.grammar-notes-content :deep(h3) {
  color: var(--fg-primary-color);
  font-weight: 700;
  margin: 12px 0 6px;
}

.grammar-notes-content :deep(p) {
  margin: 6px 0;
}

.grammar-notes-content :deep(strong) {
  color: var(--fg-primary-color);
}

.grammar-notes-content :deep(code) {
  background: var(--bg-tertiary-color);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.85em;
}

.grammar-notes-content :deep(ul),
.grammar-notes-content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

@media (max-width: 768px) {
  .stpmvo-board {
    padding: 14px;
    gap: 14px;
  }

  .sentence-char {
    font-size: 1.6rem;
  }

  .comp-block {
    min-width: 60px;
    padding: 8px 10px 10px;
  }

  .comp-text {
    font-size: 1.3rem;
  }

  .legend-bar {
    gap: 6px 12px;
  }

  .detail-panel {
    padding: 14px 16px;
  }
}
</style>
