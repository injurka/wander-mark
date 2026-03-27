<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, watch } from 'vue'
import { lookup } from '../services/dictionary.service'
import { dictionaryActions, dictionaryState } from '../store/dictionary.store'

const tooltipRef = ref<HTMLElement | null>(null)

function speak() {
  if (!dictionaryState.hanzi)
    return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(dictionaryState.hanzi)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  window.speechSynthesis.speak(utterance)
}

onClickOutside(tooltipRef, () => {
  dictionaryActions.hideTooltip()
})

useEventListener('scroll', () => {
  if (dictionaryState.isVisible) {
    dictionaryActions.hideTooltip()
  }
}, { capture: true })

watch(() => dictionaryState.hanzi, (newHanzi) => {
  if (newHanzi && dictionaryState.isVisible) {
    const entry = lookup(newHanzi)
    dictionaryActions.setEntry(entry)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="dictionaryState.isVisible"
        ref="tooltipRef"
        class="dict-tooltip"
        :style="{ top: `${dictionaryState.position.y}px`, left: `${dictionaryState.position.x}px` }"
      >
        <div class="dict-header">
          <div class="dict-hanzi">
            {{ dictionaryState.hanzi }}
          </div>
          <button class="dict-speak-btn" title="Озвучить" @click.stop="speak">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9z" /></svg>
          </button>
        </div>
        <div class="dict-body">
          <div v-if="dictionaryState.isLoading" class="dict-loader">
            Загрузка...
          </div>
          <div v-else-if="dictionaryState.entry" class="dict-entry">
            <div class="dict-pinyin">
              {{ dictionaryState.entry.pinyin }}
            </div>
            <div class="dict-def">
              {{ dictionaryState.entry.definition }}
            </div>
          </div>
          <div v-else class="dict-not-found">
            В словаре не найдено
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
