<script setup lang="ts">
import type { HanziWordBreakdown } from '../types'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { openPopover } from '../store/hanzi-saver.store'

const props = defineProps<{
  words: HanziWordBreakdown[]
  expanded: boolean
}>()

const emit = defineEmits(['toggle', 'wordClick'])

const containerRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const hiddenCount = ref(0)

let observer: ResizeObserver | null = null

function checkOverflow() {
  if (!containerRef.value || props.expanded)
    return

  const el = containerRef.value

  el.style.flexWrap = 'nowrap'
  el.style.paddingRight = '0px'

  const isOver = el.scrollWidth > el.clientWidth

  el.style.flexWrap = 'wrap'
  el.style.paddingRight = isOver ? '110px' : '0px'

  isOverflowing.value = isOver

  if (isOver) {
    const children = Array.from(el.querySelectorAll('.w-chip')) as HTMLElement[]
    if (children.length > 0) {
      const firstTop = children[0].offsetTop
      let visible = 0
      for (let i = 0; i < children.length; i++) {
        if (children[i].offsetTop <= firstTop + 5) {
          visible++
        }
        else {
          break
        }
      }
      hiddenCount.value = children.length - visible
    }
  }
  else {
    hiddenCount.value = 0
  }
}

onMounted(() => {
  observer = new ResizeObserver(() => {
    requestAnimationFrame(checkOverflow)
  })
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
  nextTick(checkOverflow)
})

onBeforeUnmount(() => {
  if (observer)
    observer.disconnect()
})

watch(() => props.words, () => {
  nextTick(checkOverflow)
}, { deep: true })
</script>

<template>
  <div class="hz-words-wrapper" :class="{ 'is-expanded': expanded }">
    <!-- Компактный вид -->
    <div v-show="!expanded" ref="containerRef" class="hz-words-compact-wrap">
      <div
        v-for="(w, i) in words"
        :key="i"
        class="w-chip"
        @click.stop="emit('wordClick', w.word)"
      >
        <span class="w-chip-char interactive-text" title="Действия" @click.stop="openPopover($event, w.word)">
          {{ w.word }}
        </span>
        <span class="w-chip-pinyin">{{ w.pinyin }}</span>
      </div>

      <button
        v-if="isOverflowing"
        class="hz-expand-absolute-btn"
        @click.stop="emit('toggle')"
      >
        еще {{ hiddenCount }}
      </button>
    </div>

    <!-- Развернутый вид (прокидывается слотом из родителя) -->
    <slot v-if="expanded" name="expanded" />
  </div>
</template>

<style scoped>
.hz-words-wrapper {
  display: flex;
  flex-direction: column;
}
.hz-words-compact-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 34px; /* Ровно 1 строка (высота чипса + gap) */
  overflow: hidden;
  position: relative;
  align-items: center;
  align-content: flex-start;
  box-sizing: border-box;
}

.w-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary-color);
  padding: 0 12px;
  border-radius: 20px;
  border: 1px solid var(--border-primary-color);
  transition: all 0.2s;
  height: 30px; /* Фиксированная высота чипса */
  box-sizing: border-box;
  cursor: pointer;
}
.w-chip:hover {
  border-color: var(--border-primary-color);
  background: rgba(var(--border-primary-color-rgb), 0.05);
}
.w-chip-char {
  font-family: 'Maple Mono CN', sans-serif;
  font-weight: 600;
  color: var(--fg-primary-color);
}
.w-chip-pinyin {
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
}

.interactive-text {
  cursor: pointer;
  transition:
    color 0.2s,
    opacity 0.2s;
}
.interactive-text:hover {
  color: var(--fg-accent-color);
  opacity: 0.8;
}

.hz-expand-absolute-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 30px;
  background: var(--bg-primary-color);
  border: none;
  color: var(--fg-accent-color);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0 4px 0 24px;
  display: flex;
  align-items: center;
}
.hz-expand-absolute-btn::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, var(--bg-primary-color) 100%);
  pointer-events: none;
}
.hz-expand-absolute-btn:hover {
  text-decoration: underline;
}
</style>
