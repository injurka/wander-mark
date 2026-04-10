import type { Component, Ref } from 'vue'
import type { Composer, Locale } from 'vue-i18n'

export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}

export interface TextInterceptor {
  id: string
  isValidChar: (char: string) => boolean
  isValidText?: (text: string) => boolean
  tooltipComponent: Component
}

export interface PluginContext {
  /** ID текущего vault */
  vaultId: string
  /** URL сервера vault (для fetch) */
  vaultUrl: string
  /** Поисковый индекс заметок (если загружен) */
  searchIndex: SearchIndexItem[] | null
  /** Элементы навигации */
  navItems: any[] | null
  /** Vue Router — для навигации */
  router: any
  /** Прочитать файл из vault */
  getFileContent: (path: string) => Promise<string | null>
  /** Вызвать всплывающее уведомление */
  showToast: (message: string, options?: { title?: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number }) => void
  /** Вызвать модальное окно подтверждения */
  confirm: (options: string | { title?: string, message: string, confirmText?: string, cancelText?: string, persistent?: boolean }) => Promise<boolean>
  /** Реактивная ссылка на текущую локаль хоста (ru, en, cn) */
  locale: Ref<Locale>
  /** Функция перевода из инстанса i18n хоста */
  t: Composer['t']

  registerTextInterceptor: (interceptor: TextInterceptor) => void
  unregisterTextInterceptor: (id: string) => void
}
