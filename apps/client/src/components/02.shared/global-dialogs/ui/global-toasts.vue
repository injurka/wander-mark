<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useToast } from '~/shared/composables/use-toast'

const { toasts, removeToast } = useToast()

const icons: Record<string, string> = {
  info: 'mdi:information-outline',
  success: 'mdi:check-circle-outline',
  warning: 'mdi:alert-outline',
  error: 'mdi:alert-circle-outline',
}
</script>

<template>
  <div class="global-toasts-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <Icon :icon="icons[toast.type]" class="toast-icon" />
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">
            {{ toast.title }}
          </div>
          <div class="toast-message">
            {{ toast.message }}
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.global-toasts-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 350px;

  @include media-down(sm) {
    bottom: 16px;
    left: 16px;
    right: 16px;
    max-width: 100%;
  }
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background-color: var(--bg-tertiary-color);
  border: 1px solid var(--border-secondary-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  backdrop-filter: blur(10px);
  will-change: transform, opacity;

  &.toast-info {
    border-left: 4px solid var(--fg-accent-color);
    .toast-icon {
      color: var(--fg-accent-color);
    }
  }
  &.toast-success {
    border-left: 4px solid #4caf50;
    .toast-icon {
      color: #4caf50;
    }
  }
  &.toast-warning {
    border-left: 4px solid #ff9800;
    .toast-icon {
      color: #ff9800;
    }
  }
  &.toast-error {
    border-left: 4px solid #f44336;
    .toast-icon {
      color: #f44336;
    }
  }
}

.toast-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toast-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--fg-primary-color);
}

.toast-message {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  line-height: 1.4;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
