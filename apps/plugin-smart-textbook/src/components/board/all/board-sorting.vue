<script setup lang="ts">
import type { SortingData, SortingItem } from '../../../types'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'
import { usePluginI18n } from '../../../i18n'

const props = defineProps<{ data: SortingData }>()
const { t } = usePluginI18n()

// Состояние
const pool = ref<SortingItem[]>([])
const buckets = ref<Record<string, SortingItem[]>>({})
const errorItemId = ref<string | null>(null)
const selectedItem = ref<SortingItem | null>(null)

// Инициализация при получении новых данных
watch(() => props.data, (newData) => {
  if (!newData)
    return

  // Создаем пустые корзины
  const newBuckets: Record<string, SortingItem[]> = {}
  newData.categories.forEach((cat) => {
    newBuckets[cat.id] = []
  })
  buckets.value = newBuckets

  // Перемешиваем слова и помещаем в пул
  // Добавляем уникальный _id для удобства (если AI сгенерирует одинаковые слова)
  pool.value = Array.from(newData.items, (item, idx) => ({ ...item, _id: `${item.category_id}-${idx}` }))
    .sort(() => Math.random() - 0.5)

  selectedItem.value = null
  errorItemId.value = null
}, { immediate: true })

const isComplete = computed(() => pool.value.length === 0)

// --- Логика Drag and Drop (для ПК) ---

function onDragStart(event: DragEvent, item: SortingItem) {
  if (isComplete.value)
    return
  event.dataTransfer?.setData('text/plain', item._id!)
  event.dataTransfer!.effectAllowed = 'move'
  selectedItem.value = item // Синхронизируем с клик-логикой на всякий случай
}

function onDrop(event: DragEvent, categoryId: string) {
  const itemId = event.dataTransfer?.getData('text/plain')
  if (!itemId)
    return

  const item = pool.value.find(i => i._id === itemId)
  if (item) {
    handleMoveAttempt(item, categoryId)
  }
}

// --- Логика Click-to-Move (для Мобилок) ---

function onPoolItemClick(item: SortingItem) {
  if (isComplete.value)
    return
  // Если кликнули по уже выбранному — снимаем выделение
  if (selectedItem.value?._id === item._id) {
    selectedItem.value = null
  }
  else {
    selectedItem.value = item
  }
}

function onCategoryClick(categoryId: string) {
  if (!selectedItem.value || isComplete.value)
    return
  handleMoveAttempt(selectedItem.value, categoryId)
}

// --- Общая логика проверки ---

function handleMoveAttempt(item: SortingItem, categoryId: string) {
  if (item.category_id === categoryId) {
    // Успех! Перемещаем в корзину
    pool.value = pool.value.filter(i => i._id !== item._id)
    buckets.value[categoryId].push(item)
    selectedItem.value = null
  }
  else {
    // Ошибка! Анимация
    triggerError(item._id!)
    selectedItem.value = null
  }
}

function triggerError(itemId: string) {
  errorItemId.value = itemId
  setTimeout(() => {
    if (errorItemId.value === itemId) {
      errorItemId.value = null
    }
  }, 600) // Длительность анимации
}

function renderMarkdown(text: string): string {
  if (!text)
    return ''
  return marked.parse(text) as string
}
</script>

<template>
  <div class="sorting-board">
    <div class="sorting-header">
      <h3 class="title">
        {{ data.title }}
      </h3>
      <p class="subtitle">
        {{ t('board.sortingInstructions') }}
      </p>
    </div>

    <!-- Корзины (Категории) -->
    <div class="buckets-grid">
      <div
        v-for="cat in data.categories"
        :key="cat.id"
        class="bucket"
        :class="{ 'highlight-bucket': selectedItem }"
        @dragover.prevent
        @dragenter.prevent
        @drop="onDrop($event, cat.id)"
        @click="onCategoryClick(cat.id)"
      >
        <div class="bucket-header">
          <h4>{{ cat.name }}</h4>
        </div>
        <div class="bucket-content">
          <TransitionGroup name="list">
            <div v-for="item in buckets[cat.id]" :key="item._id" class="sorted-item">
              <span class="item-text">{{ item.text }}</span>
              <span v-if="item.subtext" class="item-subtext">{{ item.subtext }}</span>
            </div>
          </TransitionGroup>
          <div v-if="buckets[cat.id]?.length === 0" class="bucket-placeholder">
            {{ t('board.dropHere') }}
          </div>
        </div>

        <!-- Показываем объяснение категории при завершении -->
        <Transition name="fade">
          <div v-if="isComplete && cat.explanation" class="bucket-explanation markdown-body" v-html="renderMarkdown(cat.explanation)" />
        </Transition>
      </div>
    </div>

    <!-- Пул слов -->
    <div v-if="!isComplete" class="pool-zone">
      <TransitionGroup name="list" tag="div" class="pool-items">
        <div
          v-for="item in pool"
          :key="item._id"
          class="pool-item"
          :class="{
            'is-selected': selectedItem?._id === item._id,
            'is-error': errorItemId === item._id,
          }"
          draggable="true"
          @dragstart="onDragStart($event, item)"
          @click="onPoolItemClick(item)"
        >
          <span class="item-text">{{ item.text }}</span>
          <span v-if="item.subtext" class="item-subtext">{{ item.subtext }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- Сообщение об успехе -->
    <Transition name="fade">
      <div v-if="isComplete" class="success-banner">
        <div class="success-icon">
          🎉
        </div>
        <div class="success-text">
          {{ t('board.sortingComplete') }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sorting-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: calc(100% - 78px);
  font-family: var(--lang-font, inherit);
}

.sorting-header {
  text-align: center;
}
.title {
  font-size: 1.4rem;
  color: var(--fg-primary-color);
  margin: 0 0 4px 0;
}
.subtitle {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  margin: 0;
}

/* Корзины */
.buckets-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.bucket {
  flex: 1;
  min-width: 280px;
  background: var(--bg-secondary-color);
  border: 2px dashed var(--border-secondary-color);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  overflow: hidden;
  cursor: pointer; /* Для клика на мобилках */
}
.bucket.highlight-bucket {
  border-color: var(--border-accent-color);
  background: rgba(var(--border-accent-color-rgb), 0.05);
}
.bucket-header {
  background: var(--bg-tertiary-color);
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid var(--border-secondary-color);
}
.bucket-header h4 {
  margin: 0;
  color: var(--fg-primary-color);
  font-size: 1.1rem;
}
.bucket-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}
.bucket-placeholder {
  color: var(--fg-muted-color);
  text-align: center;
  margin: auto;
  font-style: italic;
  font-size: 0.9rem;
  pointer-events: none;
}
.bucket-explanation {
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border-top: 1px solid var(--border-success-color);
  font-size: 0.85rem;
  color: var(--fg-primary-color);
}

/* Пул слов */
.pool-zone {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 16px;
  padding: 20px;
}
.pool-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

/* Элементы (карточки слов) */
.pool-item,
.sorted-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-primary-color);
  border: 2px solid var(--border-primary-color);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: grab;
  user-select: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s,
    background 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.pool-item:active {
  cursor: grabbing;
}
.pool-item:hover {
  transform: translateY(-2px);
  border-color: var(--border-focus-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.pool-item.is-selected {
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--border-accent-color-rgb), 0.2);
}
.pool-item.is-error {
  border-color: var(--fg-error-color);
  background: rgba(239, 68, 68, 0.1);
  animation: shake 0.4s ease;
}

.sorted-item {
  cursor: default;
  background: var(--bg-tertiary-color);
  border-color: var(--border-success-color);
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.item-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  line-height: 1.2;
}
.item-subtext {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  margin-top: 2px;
}

/* Баннер успеха */
.success-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--border-success-color);
  padding: 20px;
  border-radius: 16px;
  text-align: center;
}
.success-icon {
  font-size: 2rem;
}
.success-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #22c55e;
}

/* Анимации */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
@keyframes pop-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.list-leave-active {
  position: absolute;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .buckets-grid {
    flex-direction: column;
  }
  .bucket {
    min-width: 100%;
  }
  .pool-item {
    padding: 8px 12px;
  }
  .item-text {
    font-size: 1.1rem;
  }
}
</style>
