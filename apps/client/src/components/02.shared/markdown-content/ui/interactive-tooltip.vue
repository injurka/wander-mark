<script setup lang="ts">
import type { Component } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

const isVisible = ref(false)
const text = ref('')
const position = ref({ x: 0, y: 0 })
const tooltipRef = ref<HTMLElement | null>(null)

// Теперь храним МАССИВ компонентов
const activeComponents = shallowRef<Component[]>([])

function open(x: number, y: number, content: string, components: Component[]) {
  position.value = { x, y }
  text.value = content
  activeComponents.value = components
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
        <div class="tooltip-plugins-stack">
          <!-- Рендерим все компоненты, которые среагировали на текст -->
          <component
            :is="comp"
            v-for="(comp, index) in activeComponents"
            :key="index"
            :text="text"
            class="tooltip-plugin-item"
            @close="close"
          />
        </div>
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
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  transform: translate(-50%, -115%) translateY(-10px);
  pointer-events: auto;
  max-width: 320px;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: var(--border-primary-color) transparent transparent transparent;
  }
}

.tooltip-plugins-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Разделитель между плагинами, если их больше одного */
.tooltip-plugin-item:not(:last-child) {
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border-secondary-color);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -130%) scale(0.95);
}
</style>
