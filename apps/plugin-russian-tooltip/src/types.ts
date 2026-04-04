import type { Component, Ref } from 'vue'

export interface TextInterceptor {
  id: string
  isValidChar: (char: string) => boolean
  tooltipComponent: Component
}

export interface PluginContext {
  vaultId: string
  vaultUrl: string
  searchIndex: any[] | null
  navItems: any[] | null
  router: any
  getFileContent: (path: string) => Promise<string | null>
  showToast?: (message: string, options?: any) => void
  confirm?: (options: any) => Promise<boolean>

  locale?: Ref<string>
  t?: (key: string) => string

  registerTextInterceptor?: (interceptor: TextInterceptor) => void
  unregisterTextInterceptor?: (id: string) => void
}
