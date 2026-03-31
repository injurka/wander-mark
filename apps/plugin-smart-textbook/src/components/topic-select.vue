<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePluginI18n } from '../i18n'
import { filteredTopics, tbState, TOPIC_REGISTRY } from '../store/textbook.store'

const { t } = usePluginI18n()

const isOpen = ref(false)
const search = ref('')
const rootEl = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)

/** Текущая выбранная тема — лейбл */
const selectedLabel = computed(() => {
  const topic = TOPIC_REGISTRY.find(tp => tp.id === tbState.activeTopic)
  return topic ? t(topic.labelKey) : t('topicSelect.placeholder')
})

/** Название текущего языка для заголовка группы */
const langLabel = computed(() => t(`langs.${tbState.targetLanguage}`))

/** Отфильтрованные группы с учётом поискового запроса */
const groups = computed(() => {
  const { universal, langSpecific } = filteredTopics.value
  const q = search.value.trim().toLowerCase()

  const filterFn = (items: typeof universal) =>
    q ? items.filter(tp => t(tp.labelKey).toLowerCase().includes(q)) : items

  const result: { key: string, label: string, items: typeof universal }[] = []

  const uFiltered = filterFn(universal)
  if (uFiltered.length > 0) {
    result.push({ key: 'universal', label: t('topicGroup.universal'), items: uFiltered })
  }

  const lFiltered = filterFn(langSpecific)
  if (lFiltered.length > 0) {
    const label = t('topicGroup.langSpecific').replace('{lang}', langLabel.value)
    result.push({ key: 'langSpecific', label, items: lFiltered })
  }

  return result
})

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    search.value = ''
    nextTick(() => searchEl.value?.focus())
  }
}

function select(id: string) {
  tbState.activeTopic = id
  isOpen.value = false
  search.value = ''
}

/** Закрытие по клику вне */
function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    isOpen.value = false
    search.value = ''
  }
}

/** Закрытие по Escape */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    search.value = ''
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})

/** Сброс при смене языка, если дропдаун открыт */
watch(() => tbState.targetLanguage, () => {
  search.value = ''
})
</script>

<template>
  <div ref="rootEl" class="topic-select" :class="{ 'is-open': isOpen }">
    <button class="topic-trigger" @click="toggle">
      <span class="trigger-label">{{ selectedLabel }}</span>
      <svg
        class="trigger-chevron" :class="{ rotated: isOpen }"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="topic-dropdown">
        <div class="dropdown-search">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref="searchEl"
            v-model="search"
            type="text"
            :placeholder="t('topicSelect.search')"
            class="search-input"
          >
        </div>

        <div class="dropdown-body">
          <template v-for="group in groups" :key="group.key">
            <div class="group-label">
              {{ group.label }}
            </div>
            <button
              v-for="topic in group.items" :key="topic.id"
              class="topic-option"
              :class="{ active: tbState.activeTopic === topic.id }"
              @click="select(topic.id)"
            >
              <span class="option-text">{{ t(topic.labelKey) }}</span>
              <svg
                v-if="tbState.activeTopic === topic.id"
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </template>

          <div v-if="groups.length === 0" class="no-results">
            —
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.topic-select {
  position: relative;
}

.topic-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-tertiary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9em;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: left;
}
.topic-trigger:hover {
  border-color: var(--border-focus-color);
}
.is-open .topic-trigger {
  border-color: var(--border-accent-color);
}

.trigger-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trigger-chevron {
  flex-shrink: 0;
  color: var(--fg-secondary-color);
  transition: transform 0.2s;
}
.trigger-chevron.rotated {
  transform: rotate(180deg);
}

/* ── Dropdown ── */
.topic-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-primary-color);
  border: 1px solid var(--border-secondary-color);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 320px;
}

.dropdown-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-secondary-color);
  color: var(--fg-muted-color);
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fg-primary-color);
  font-family: inherit;
  font-size: 0.85em;
}
.search-input::placeholder {
  color: var(--fg-muted-color);
}

.dropdown-body {
  overflow-y: auto;
  padding: 4px 0;
}

.group-label {
  padding: 6px 12px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-muted-color);
  font-weight: 600;
  user-select: none;
}

.topic-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--fg-primary-color);
  font-family: inherit;
  font-size: 0.85em;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.topic-option:hover {
  background: var(--bg-hover-color);
}
.topic-option.active {
  color: var(--fg-accent-color);
  background: var(--bg-accent-color);
}
.topic-option.active svg {
  color: var(--fg-accent-color);
}

.no-results {
  padding: 16px;
  text-align: center;
  color: var(--fg-muted-color);
  font-size: 0.85em;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
