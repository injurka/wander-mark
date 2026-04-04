<script setup lang="ts">
import type { Component } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

const isVisible = ref(false)
const text = ref('')
const position = ref({ x: 0, y: 0 })
const tooltipRef = ref<HTMLElement | null>(null)

// Используем shallowRef для компонентов, чтобы Vue не пытался делать их глубоко реактивными
const activeComponent = shallowRef<Component | null>(null)

function open(x: number, y: number, content: string, component: Component) {
  position.value = { x, y }
  text.value = content
  activeComponent.value = component
  isVisible.value = true
}

function close() {
  isVisible.value = false
}

onClickOutside(tooltipRef, () => {
  isVisible.value = false
})

useEventListener('scroll', () => {
  if (isVisible.value) {
    isVisible.value = false
  }
}, { capture: true })

defineExpose({
  open,
  close,
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="isVisible"
        ref="tooltipRef"
        class="interactive-tooltip"
        :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      >
        <component
          :is="activeComponent"
          v-if="activeComponent"
          :text="text"
          @close="close"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.interactive-tooltip {
  position: fixed;
  z-index: 9999;
  background-color: var(--bg-tertiary-color);
  border: 1px solid var(--border-primary-color);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: var(--s-l);
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translate(-50%, -115%) translateY(-10px);
  pointer-events: auto;
  max-width: 300px;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: var(--border-primary-color) transparent transparent transparent;
  }
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -140%) scale(0.95);
}
</style>
