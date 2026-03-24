import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  persistent?: boolean
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({ message: '' })
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(opts: ConfirmOptions | string): Promise<boolean> {
    options.value = typeof opts === 'string' ? { message: opts } : { persistent: true, ...opts }
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function respond(value: boolean) {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(value)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    respond,
  }
}
