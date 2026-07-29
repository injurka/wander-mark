import type { Composer, Locale } from 'vue-i18n'
import type { Component, Ref } from 'vue'
import { useRouter } from 'vue-router';

export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
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

export interface FileMetaData {
  words: number
  readingTime: number // в минутах
  lastModified: string // ISO date
}

export enum ContentNavItemType {
  File = 'file',
  Directory = 'directory',
}

export interface ContentNavItem {
  sysname: string
  title: string
  type: ContentNavItemType
  children?: ContentNavItem[]
  meta?: FileMetaData
}

export interface WanderMarkPluginContext {
  /** ID текущего vault */
  vaultId: string
  /** URL сервера vault (для fetch) */
  vaultUrl: string
  /** Поисковый индекс заметок (если загружен) */
  searchIndex: SearchIndexItem[] | null
  /** Элементы навигации */
  navItems: ContentNavItem[] | null
  /** Vue Router — для навигации */
  router: ReturnType<typeof useRouter>
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

  // 1. Единый API для работы с данными плагина (заменит idb-keyval внутри плагинов)
  storage: {
    get: <T>(key: string) => Promise<T | null>
    set: <T>(key: string, value: T) => Promise<void>
  }

  // 2. Единый AI-провайдер. Пользователь вводит ключ ОДИН раз в настройках клиента.
  ai: {
    getModel: () => string
    fetch: (endpoint: string, options: any) => Promise<Response>
  },

  registerTextInterceptor: (interceptor: TextInterceptor) => void
  unregisterTextInterceptor: (id: string) => void
}


// ─── Слоты, в которые плагин может встраивать компоненты ───
export type PluginSlotName
  = | 'toolbar' // Верхняя панель (рядом с кнопками header)
  | 'sidebar-top' // Верх боковой навигации
  | 'sidebar-bottom' // Низ боковой навигации
  | 'content-before' // Перед контентом заметки
  | 'content-after' // После контента заметки (перед backlinks)
  | 'footer' // Нижняя часть страницы
  | 'overlay' // Оверлей поверх всего (модалки, панели)
  | 'vault-index' // Слот на главной странице хранилища (для кнопок плагинов и т.д.)


// ─── Манифест плагина (то, что экспортирует ES-модуль) ───
export interface WanderMarkPlugin {
  /** Уникальный ID плагина (kebab-case) */
  id: string
  /** Человекочитаемое название */
  name: string
  /** Краткое описание */
  description?: string
  /** Версия плагина */
  version: string
  /** Иконка (Iconify ID, например 'mdi:magnify') */
  icon?: string

  /**
   * Слоты и соответствующие Vue-компоненты.
   * Один плагин может рендериться в нескольких слотах.
   */
  slots: Partial<Record<PluginSlotName, Component>>

  /**
   * Страницы плагина.
   * Ключ — путь относительно /:vault/plugin/:pluginId/ (по умолчанию 'index').
   * Значение — Vue-компонент страницы.
   */
  pages?: Record<string, Component>

  /**
   * CSS-строка, которую плагин хочет внедрить глобально.
   * Будет добавлена в <style> при активации и удалена при деактивации.
   */
  styles?: string

  // ─── Lifecycle hooks ───

  /** Вызывается при активации плагина. Получает контекст хоста. */
  activate?: (ctx: WanderMarkPluginContext) => void | Promise<void>

  /** Вызывается при деактивации */
  deactivate?: (ctx: WanderMarkPluginContext) => void | Promise<void>
}
