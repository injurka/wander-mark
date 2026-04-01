<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  text: string
  visible: boolean
  target: HTMLElement | null
}>()

const tooltipRef = ref<HTMLElement | null>(null)
const x = ref(0)
const y = ref(0)
const isPositioned = ref(false)

function updatePosition() {
  if (!props.target || !tooltipRef.value || !props.visible)
    return

  const targetRect = props.target.getBoundingClientRect()
  const tipRect = tooltipRef.value.getBoundingClientRect()
  const pad = 12

  // Горизонтальное центрирование относительно target
  let left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2)

  // Предотвращение выхода за края экрана
  if (left < pad)
    left = pad
  if (left + tipRect.width > window.innerWidth - pad) {
    left = window.innerWidth - pad - tipRect.width
  }

  // Вертикальное позиционирование (по умолчанию сверху)
  let top = targetRect.top - tipRect.height - 8

  // Если сверху нет места, переносим вниз
  if (top < pad) {
    top = targetRect.bottom + 8
  }

  x.value = left
  y.value = top
  isPositioned.value = true
}

watch(() => props.visible, (val) => {
  if (val) {
    isPositioned.value = false
    nextTick(() => {
      updatePosition()
    })
  }
})

function handleScroll() {
  if (props.visible)
    updatePosition()
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="visible"
        ref="tooltipRef"
        class="ui-tooltip"
        :style="{
          left: `${x}px`,
          top: `${y}px`,
          opacity: isPositioned ? 1 : 0,
        }"
        v-html="text"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-tooltip {
  position: fixed;
  background: var(--bg-inverted-color, #1a1a2e);
  color: var(--fg-inverted-color, #fff);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
  max-width: min(320px, calc(100vw - 24px));
  width: max-content;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  word-wrap: break-word;
  white-space: normal;
  font-family: var(--lang-font, system-ui, sans-serif);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.96);
}
</style>
