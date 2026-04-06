import type { Component, Ref } from 'vue'
import type { Router } from 'vue-router'

export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export enum ContentNavItemType {
  File = 'file',
  Directory = 'directory',
}

export interface FileMetaData {
  words: number
  readingTime: number
  lastModified: string
}

export interface ContentNavItem {
  sysname: string
  title: string
  type: ContentNavItemType
  children?: ContentNavItem[]
  meta?: FileMetaData
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
  router: Router
  getFileContent: (path: string) => Promise<string | null>
  showToast: (message: string, options?: ToastOptions) => void
  confirm: (options: string | ConfirmOptions) => Promise<boolean>
  locale: Ref<string>
  t: (key: string, ...args: any[]) => string
  registerTextInterceptor: (interceptor: TextInterceptor) => void
  unregisterTextInterceptor: (id: string) => void
}
