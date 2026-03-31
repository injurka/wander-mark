<script setup lang="ts">
import type { TranslationData } from '../../types'
import { ref } from 'vue'
import { usePluginI18n } from '../../i18n'

defineProps<{ data: TranslationData }>()
const { t } = usePluginI18n()
const xRayMode = ref(false)
</script>

<template>
  <div class="translation-board">
    <label class="xray-toggle">
      <input v-model="xRayMode" type="checkbox">
      <span class="toggle-track" />
      <span class="toggle-label">{{ t('board.xrayToggle') }}</span>
    </label>

    <div v-for="(p, i) in data.paragraphs" :key="i" class="paragraph-block">
      <div class="interlinear" :class="{ 'xray-active': xRayMode }">
        <ruby v-for="(word, wi) in p.words" :key="wi">
          {{ word.word }}
          <rt v-show="xRayMode">{{ word.literal }}</rt>
        </ruby>
      </div>

      <div class="translations">
        <p><span class="label">{{ t('board.litTranslation') }}</span> {{ p.translation }}</p>
        <p v-if="xRayMode" class="literal-text">
          <span class="label">{{ t('board.literal') }}</span> {{ p.literal }}
        </p>

        <div v-if="p.cultural_note" class="note">
          <div class="note-title">
            💡 {{ t('board.cultureNote') }}
          </div>
          {{ p.cultural_note }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.xray-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: var(--bg-secondary-color);
  padding: 12px 16px;
  border-radius: 12px;
  width: fit-content;
}
.xray-toggle input {
  display: none;
}
.toggle-track {
  width: 40px;
  height: 24px;
  background: var(--bg-disabled-color);
  border-radius: 12px;
  position: relative;
  transition: 0.3s;
  border: 1px solid var(--border-secondary-color);
}
.toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--fg-inverted-color);
  border-radius: 50%;
  transition: 0.3s;
}
.xray-toggle input:checked + .toggle-track {
  background: var(--bg-action-hover-color);
  border-color: var(--border-accent-color);
}
.xray-toggle input:checked + .toggle-track::after {
  transform: translateX(16px);
}
.toggle-label {
  color: var(--fg-primary-color);
  font-weight: 500;
}

.paragraph-block {
  background: var(--bg-tertiary-color);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-primary-color);
}
.interlinear {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 24px;
  line-height: 2.5;
}
.interlinear ruby {
  font-size: 1.8em;
  font-family: 'Maple Mono CN', monospace;
  margin-right: 8px;
  ruby-align: center;
  color: var(--fg-primary-color);
}
.interlinear rt {
  font-size: 0.45em;
  color: var(--fg-accent-color);
  font-family: Inter, sans-serif;
  transform: translateY(-4px);
  opacity: 0.9;
}

.translations {
  border-top: 1px solid var(--border-secondary-color);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--fg-secondary-color);
  font-weight: 600;
  margin-right: 8px;
}
.literal-text {
  color: var(--fg-muted-color);
  font-style: italic;
}
.note {
  background: var(--bg-warning-color);
  color: var(--fg-warning-color);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--border-warning-color);
  margin-top: 8px;
  line-height: 1.5;
}
.note-title {
  font-weight: bold;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .interlinear ruby {
    font-size: 1.4em;
  }
  .paragraph-block {
    padding: 16px;
  }
  .xray-toggle {
    width: 100%;
    justify-content: center;
  }
}
</style>
