<script setup lang="ts">
import type { RadicalDeconstructorData } from '../../../types'
import { marked } from 'marked'
import { usePluginI18n } from '../../../i18n'

defineProps<{ data: RadicalDeconstructorData }>()
const { t } = usePluginI18n()

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}

function getRoleClass(role: string) {
  const normalized = role.toLowerCase()
  if (normalized.includes('semantic') || normalized.includes('смыслов'))
    return 'role-semantic'
  if (normalized.includes('phonetic') || normalized.includes('фонетич'))
    return 'role-phonetic'
  return 'role-structural'
}

function getRoleLabel(role: string) {
  const normalized = role.toLowerCase()
  if (normalized.includes('semantic') || normalized.includes('смыслов'))
    return t('board.roleSemantic')
  if (normalized.includes('phonetic') || normalized.includes('фонетич'))
    return t('board.rolePhonetic')
  if (normalized.includes('structural') || normalized.includes('структурн'))
    return t('board.roleStructural')
  return role
}
</script>

<template>
  <div class="radicals-board">
    <!-- Общий заголовок слова -->
    <div v-if="data.characters.length > 1" class="word-header">
      <div class="full-word">
        <div class="word-chars">
          {{ data.word }}
        </div>
        <div class="word-pinyin">
          {{ data.word_pinyin }}
        </div>
      </div>
      <div class="word-translation">
        {{ data.word_translation }}
      </div>
    </div>

    <!-- Список карточек для каждого иероглифа -->
    <div class="characters-list">
      <div
        v-for="(charData, index) in data.characters"
        :key="index"
        class="character-card"
      >
        <!-- Левая часть: Сам иероглиф -->
        <div class="char-showcase">
          <div class="main-char">
            {{ charData.character }}
          </div>
          <div class="char-pinyin">
            {{ charData.pinyin }}
          </div>
          <div class="char-meaning">
            {{ charData.meaning }}
          </div>
          <div v-if="charData.hsk_level && charData.hsk_level.toLowerCase() !== 'none'" class="hsk-badge">
            {{ charData.hsk_level }}
          </div>
        </div>

        <!-- Правая часть: Разбор -->
        <div class="char-analysis">
          <!-- Формула компонентов (A = B + C) -->
          <div class="components-formula">
            <div class="formula-result">
              {{ charData.character }}
            </div>
            <div class="formula-equals">
              =
            </div>
            <div class="formula-parts">
              <template v-for="(comp, ci) in charData.components" :key="ci">
                <div class="formula-part">
                  <span class="part-char">{{ comp.component }}</span>
                  <span class="part-pinyin">{{ comp.pinyin }}</span>
                </div>
                <div v-if="ci < charData.components.length - 1" class="formula-plus">
                  +
                </div>
              </template>
            </div>
          </div>

          <!-- Этимология / Мнемоника -->
          <div class="etymology-box">
            <div class="box-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              {{ t('board.etymology') }}
            </div>
            <div class="etymology-content markdown-body" v-html="renderMarkdown(charData.etymology)" />
          </div>

          <!-- Список компонентов с деталями -->
          <div class="components-details">
            <div class="box-title">
              {{ t('board.components') }}
            </div>
            <div class="component-list">
              <div v-for="(comp, ci) in charData.components" :key="ci" class="component-item">
                <div class="comp-icon">
                  {{ comp.component }}
                </div>
                <div class="comp-info">
                  <div class="comp-header">
                    <span class="comp-meaning">{{ comp.meaning }} <span v-if="comp.pinyin" class="comp-pinyin-inline">({{ comp.pinyin }})</span></span>
                    <span class="role-badge" :class="getRoleClass(comp.role)">{{ getRoleLabel(comp.role) }}</span>
                  </div>
                  <div class="comp-explanation">
                    {{ comp.explanation }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.radicals-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: calc(100% - 78px);
  font-family: var(--lang-font, inherit);
}

.word-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-primary-color);
}
.word-chars {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  letter-spacing: 0.1em;
  line-height: 1.2;
}
.word-pinyin {
  font-size: 1.1rem;
  color: var(--fg-secondary-color);
}
.word-translation {
  margin-top: 8px;
  font-size: 1.1rem;
  color: var(--fg-accent-color);
  font-weight: 500;
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.character-card {
  display: flex;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  overflow: hidden;
  flex-direction: column;
}

.char-showcase {
  flex-shrink: 0;
  background: var(--bg-tertiary-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border-right: 1px dashed var(--border-secondary-color);
  position: relative;
}
.main-char {
  font-size: 5rem;
  font-weight: 900;
  color: var(--fg-primary-color);
  line-height: 1;
  text-shadow: 2px 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}
.char-pinyin {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--fg-accent-color);
  margin-bottom: 4px;
}
.char-meaning {
  font-size: 0.95rem;
  color: var(--fg-secondary-color);
  text-align: center;
}
.hsk-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--bg-accent-overlay-color);
  color: var(--fg-accent-color);
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-accent-color);
}

/* Правая часть (Разбор) */
.char-analysis {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Формула */
.components-formula {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg-primary-color);
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid var(--border-secondary-color);
}
.formula-result {
  font-size: 2rem;
  font-weight: bold;
  color: var(--fg-primary-color);
}
.formula-equals,
.formula-plus {
  font-size: 1.5rem;
  color: var(--fg-muted-color);
  font-weight: bold;
}
.formula-parts {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.formula-part {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-tertiary-color);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary-color);
}
.part-char {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--fg-primary-color);
}
.part-pinyin {
  font-size: 0.7rem;
  color: var(--fg-secondary-color);
}

/* Этимология */
.box-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-muted-color);
  margin-bottom: 10px;
}
.etymology-box {
  background: rgba(var(--border-accent-color-rgb), 0.05);
  border-left: 3px solid var(--border-accent-color);
  padding: 16px;
  border-radius: 0 8px 8px 0;
}
.etymology-content {
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  line-height: 1.6;
}

/* Список компонентов */
.component-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.component-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 12px;
}
.comp-icon {
  font-size: 2rem;
  font-weight: bold;
  color: var(--fg-primary-color);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary-color);
  border-radius: 8px;
  flex-shrink: 0;
}
.comp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.comp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.comp-meaning {
  font-weight: bold;
  font-size: 1rem;
  color: var(--fg-primary-color);
}
.comp-pinyin-inline {
  font-weight: normal;
  color: var(--fg-secondary-color);
  font-size: 0.9em;
}

/* Бейджи ролей */
.role-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  border: 1px solid;
  text-transform: uppercase;
}
.role-semantic {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.4);
}
.role-phonetic {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.4);
}
.role-structural {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.4);
}

.comp-explanation {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .char-showcase {
    width: 100%;
    border-right: none;
    border-bottom: 1px dashed var(--border-secondary-color);
    padding: 32px 16px 24px;
  }
  .char-analysis {
    padding: 16px;
  }
  .components-formula {
    justify-content: center;
  }
}
</style>
