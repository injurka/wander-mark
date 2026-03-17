<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  rounded?: boolean
  variant?: 'default' | 'solo'
}
withDefaults(defineProps<Props>(), {
  placeholder: '',
  variant: 'default',
})

const emit = defineEmits(['update:modelValue'])

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="kit-input-wrapper" :class="{ 'is-rounded': rounded, 'is-solo': variant === 'solo' }">
    <input
      :value="modelValue"
      type="text"
      class="kit-input"
      :placeholder="placeholder"
      @input="onInput"
    >
  </div>
</template>

<style lang="scss" scoped>
.kit-input-wrapper {
  position: relative;
  width: 100%;

  &.is-rounded .kit-input {
    border-radius: 20px;
  }

  &.is-solo .kit-input {
    background-color: var(--bg-secondary-color);
    border: none;
    box-shadow: none;
  }
}

.kit-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.9rem;
  background-color: var(--bg-primary-color);
  color: var(--fg-primary-color);
  border: 1px solid var(--border-primary-color);
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--fg-muted-color);
  }

  &:focus {
    border-color: var(--fg-accent-color);
  }
}
</style>
