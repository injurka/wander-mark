<script setup lang="ts">
import type { ChengyuData } from '../../types'
import { marked } from 'marked'
import { reactive } from 'vue'
import { usePluginI18n } from '../../i18n'

const props = defineProps<{ data: ChengyuData }>()

const { t } = usePluginI18n()

// openSections[cardIndex][section] = boolean
const openSections = reactive<Record<number, Record<string, boolean>>>({})

function toggle(idx: number, section: string) {
  if (!openSections[idx]) {
    openSections[idx] = {}
  }
  openSections[idx][section] = !openSections[idx][section]
}

function renderMarkdown(md: string): string {
  if (!md)
    return ''
  return marked.parse(md) as string
}
</script>

<template>
  <div class="chengyu-board">
    <div
      v-for="(idiom, idx) in data.idioms"
      :key="idx"
      class="chengyu-card"
    >
      <!-- Card header: characters + pinyin -->
      <div class="card-header">
        <div class="chengyu-chars">
          {{ idiom.chengyu }}
        </div>
        <div class="chengyu-pinyin">
          {{ idiom.pinyin }}
        </div>
      </div>

      <!-- Core info table -->
      <div class="chengyu-info-grid">
        <div class="info-row">
          <span class="info-label">{{ t('board.literal') }}</span>
          <span class="info-value">{{ idiom.literal_translation }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('board.meaning') }}</span>
          <span class="info-value meaning-value">{{ idiom.meaning }}</span>
        </div>
      </div>

      <!-- Expandable sections -->
      <div class="expandable-sections">
        <!-- History / Origin -->
        <div class="expand-section" :class="{ open: openSections[idx]?.origin }">
          <button
            class="expand-trigger"
            :aria-expanded="openSections[idx]?.origin"
            @click="toggle(idx, 'origin')"
          >
            <span class="expand-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C3.96 1.5 1.5 3.96 1.5 7S3.96 12.5 7 12.5 12.5 10.04 12.5 7 10.04 1.5 7 1.5Z" stroke="currentColor" stroke-width="1.2" />
                <path d="M5 5c0-1.1.9-2 2-2s2 .9 2 2c0 1-.7 1.6-1.4 2.2C7 7.7 7 8 7 8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                <circle cx="7" cy="10.5" r="0.7" fill="currentColor" />
              </svg>
            </span>
            <span class="expand-label">{{ t('board.origin') }}</span>
            <span class="expand-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  :d="openSections[idx]?.origin ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
          <Transition name="expand">
            <div v-if="openSections[idx]?.origin" class="expand-content">
              <div class="markdown-content" v-html="renderMarkdown(idiom.origin)" />
            </div>
          </Transition>
        </div>

        <!-- Example sentence -->
        <div class="expand-section" :class="{ open: openSections[idx]?.example }">
          <button
            class="expand-trigger"
            :aria-expanded="openSections[idx]?.example"
            @click="toggle(idx, 'example')"
          >
            <span class="expand-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3h10M2 6.5h8M2 10h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </span>
            <span class="expand-label">{{ t('board.example') }}</span>
            <span class="expand-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  :d="openSections[idx]?.example ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
          <Transition name="expand">
            <div v-if="openSections[idx]?.example" class="expand-content">
              <div class="example-block">
                <div class="example-chinese">
                  {{ idiom.example_sentence }}
                </div>
                <div class="example-pinyin">
                  {{ idiom.example_pinyin }}
                </div>
                <div class="example-translation">
                  {{ idiom.example_translation }}
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Usage notes -->
        <div class="expand-section last" :class="{ open: openSections[idx]?.notes }">
          <button
            class="expand-trigger"
            :aria-expanded="openSections[idx]?.notes"
            @click="toggle(idx, 'notes')"
          >
            <span class="expand-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h7l3 3v7H2V2Z" stroke="currentColor" stroke-width="1.2" />
                <path d="M9 2v3h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                <path d="M4 7h6M4 9.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
              </svg>
            </span>
            <span class="expand-label">{{ t('board.usageNotes') }}</span>
            <span class="expand-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  :d="openSections[idx]?.notes ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
          <Transition name="expand">
            <div v-if="openSections[idx]?.notes" class="expand-content">
              <div class="notes-text">
                {{ idiom.usage_notes }}
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chengyu-board {
  font-family: var(--lang-font, system-ui, sans-serif);
  background: var(--bg-primary-color);
  color: var(--fg-primary-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
  height: calc(100% - 78px);
}

.chengyu-card {
  background: var(--bg-secondary-color);
  border-radius: 12px;
  border: 1px solid var(--border-primary-color);
  border-left: 4px solid var(--border-accent-color);
  overflow: hidden;
  position: relative;
  transition: box-shadow 0.2s ease;
}

.chengyu-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 22px 22px 14px;
  background: linear-gradient(135deg, var(--bg-secondary-color) 0%, var(--bg-tertiary-color) 100%);
  border-bottom: 1px solid var(--border-primary-color);
}

.chengyu-chars {
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  letter-spacing: 0.12em;
  line-height: 1.1;
  margin-bottom: 6px;
}

.chengyu-pinyin {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  letter-spacing: 0.08em;
}

.chengyu-info-grid {
  padding: 14px 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-secondary-color);
  border-bottom: 1px solid var(--border-primary-color);
}

.info-row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--fg-accent-color);
  min-width: 72px;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.88rem;
  color: var(--fg-secondary-color);
  line-height: 1.5;
}

.meaning-value {
  color: var(--fg-primary-color);
  font-weight: 500;
}

.expandable-sections {
  display: flex;
  flex-direction: column;
}

.expand-section {
  border-bottom: 1px solid var(--border-primary-color);
}

.expand-section.last {
  border-bottom: none;
}

.expand-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  color: var(--fg-secondary-color);
  text-align: left;
  transition:
    background 0.15s,
    color 0.15s;
}

.expand-trigger:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}

.expand-section.open .expand-trigger {
  color: var(--fg-accent-color);
  background: var(--bg-accent-overlay-color);
}

.expand-icon {
  display: flex;
  align-items: center;
  opacity: 0.8;
  flex-shrink: 0;
}

.expand-label {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  flex: 1;
}

.expand-chevron {
  display: flex;
  align-items: center;
  opacity: 0.6;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.expand-section.open .expand-chevron {
  opacity: 1;
}

.expand-content {
  padding: 12px 22px 16px;
  background: var(--bg-primary-color);
  border-top: 1px solid var(--border-primary-color);
}

.markdown-content {
  font-size: 0.88rem;
  color: var(--fg-secondary-color);
  line-height: 1.75;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  color: var(--fg-primary-color);
  font-weight: 700;
  margin: 12px 0 6px;
  font-size: 0.95rem;
}

.markdown-content :deep(p) {
  margin: 6px 0;
}

.markdown-content :deep(strong) {
  color: var(--fg-primary-color);
  font-weight: 600;
}

.markdown-content :deep(em) {
  color: var(--fg-accent-color);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 18px;
  margin: 6px 0;
}

.markdown-content :deep(li) {
  margin: 3px 0;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--border-accent-color);
  margin: 8px 0;
  padding: 4px 12px;
  color: var(--fg-muted-color);
  font-style: italic;
}

/* ── Example block ── */
.example-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.example-chinese {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  letter-spacing: 0.05em;
  line-height: 1.4;
}

.example-pinyin {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  letter-spacing: 0.03em;
}

.example-translation {
  font-size: 0.85rem;
  color: var(--fg-accent-color);
  font-style: italic;
}

/* ── Notes text ── */
.notes-text {
  font-size: 0.88rem;
  color: var(--fg-secondary-color);
  line-height: 1.7;
}

/* ── Expand transition ── */
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.22s ease,
    max-height 0.28s ease;
  overflow: hidden;
  max-height: 600px;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .chengyu-board {
    gap: 12px;
  }

  .card-header {
    padding: 16px 16px 12px;
  }

  .chengyu-chars {
    font-size: 1.9rem;
  }

  .chengyu-info-grid {
    padding: 12px 16px;
  }

  .expand-trigger {
    padding: 10px 16px;
  }

  .expand-content {
    padding: 10px 16px 14px;
  }

  .info-label {
    min-width: 60px;
  }
}
</style>
