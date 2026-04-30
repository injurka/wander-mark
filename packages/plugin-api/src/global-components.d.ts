import type { DefineComponent } from 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    KitBtn: DefineComponent<{
      icon?: string
      prependIcon?: string
      appendIcon?: string
      variant?: 'solid' | 'outlined' | 'text' | 'subtle' | 'tonal'
      color?: 'primary' | 'secondary' | 'accent' | 'success' | 'error'
      disabled?: boolean
      size?: 'xs' | 'sm' | 'md' | 'lg'
      density?: 'default' | 'compact'
    }>
    KitDialog: DefineComponent<{
      visible: boolean
      maxWidth?: number
      title?: string
      icon?: string
      description?: string
      persistent?: boolean
    }>
    KitInput: DefineComponent<{
      modelValue: string
      placeholder?: string
      rounded?: boolean
      variant?: 'default' | 'solo'
      size?: 'xs' | 'sm' | 'md' | 'lg'
    }>
    KitCheckbox: DefineComponent<{
      modelValue: boolean
      label?: string
    }>
  }
}

export { }
