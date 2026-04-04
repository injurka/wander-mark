<script setup lang="ts">
interface Props {
  text: string
}

const props = defineProps<Props>()
defineEmits(['close'])

function speak() {
  if (!props.text)
    return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(props.text)

  utterance.lang = 'ru-RU'
  utterance.rate = 0.9
  utterance.pitch = 1.0

  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <div class="ru-tooltip-container">
    <div class="ru-text">
      {{ text }}
    </div>

    <div class="ru-actions">
      <button class="ru-btn" title="Озвучить" @click="speak">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ru-tooltip-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ru-text {
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--fg-primary-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 200px;
}

.ru-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  border-left: 1px solid var(--border-secondary-color);
  padding-left: 12px;
}

.ru-btn {
  background: transparent;
  border: none;
  color: var(--fg-secondary-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.ru-btn:hover {
  background-color: var(--bg-hover-color);
  color: var(--fg-accent-color);
}

.ru-btn:active {
  transform: scale(0.95);
}
</style>
