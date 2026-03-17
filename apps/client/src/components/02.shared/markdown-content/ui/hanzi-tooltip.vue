<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { KitBtn } from '~/components/01.kit'

const isVisible = ref(false)
const text = ref('')
const position = ref({ x: 0, y: 0 })
const tooltipRef = ref<HTMLElement | null>(null)

function speak() {
  if (!text.value)
    return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text.value)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  window.speechSynthesis.speak(utterance)
}

function open(x: number, y: number, content: string) {
  position.value = { x, y }
  text.value = content
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
        class="hanzi-tooltip"
        :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      >
        <div class="hanzi-text">
          {{ text }}
        </div>

        <div class="actions">
          <KitBtn
            size="xs"
            variant="text"
            icon="mdi:volume-high"
            title="Озвучить"
            @click="speak"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.hanzi-tooltip {
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

  /* Стрелочка */
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

.hanzi-text {
  font-family: 'Maple Mono CN', serif;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--fg-primary-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
