import type { Component, Ref } from 'vue'

export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export interface ContentNavItem {
  sysname: string
  title: string
  type: 'file' | 'directory'
  children?: ContentNavItem[]
  meta?: {
    words: number
    readingTime: number
    lastModified: string
  }
}

export interface ToastOptions {
  title?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  persistent?: boolean
}

export interface TextInterceptor {
  id: string
  isValidChar: (char: string) => boolean
  isValidText?: (text: string) => boolean
  tooltipComponent: Component
}

export interface PluginContext {
  vaultId: string
  vaultUrl: string
  searchIndex: SearchIndexItem[] | null
  navItems: ContentNavItem[] | null
  router: any
  getFileContent: (path: string) => Promise<string | null>
  showToast: (message: string, options?: ToastOptions) => void
  confirm: (options: string | ConfirmOptions) => Promise<boolean>
  locale: Ref<string>
  t: (key: string, ...args: any[]) => string
  registerTextInterceptor: (interceptor: TextInterceptor) => void
  unregisterTextInterceptor: (id: string) => void
}
