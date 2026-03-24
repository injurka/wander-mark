import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title?: string
  type?: ToastType
  duration?: number
}

export interface Toast extends ToastOptions {
  id: string
  message: string
  type: ToastType
  duration: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function showToast(message: string, options: ToastOptions = {}) {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = {
      id,
      message,
      title: options.title,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : 4000,
    }

    toasts.value.push(toast)

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast,
  }
}
