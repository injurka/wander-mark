import type { Component } from 'vue'

// ─── Слоты, в которые плагин может встраивать компоненты ───
export type PluginSlotName =
  | 'toolbar'         // Верхняя панель (рядом с кнопками header)
  | 'sidebar-top'     // Верх боковой навигации
  | 'sidebar-bottom'  // Низ боковой навигации
  | 'content-before'  // Перед контентом заметки
  | 'content-after'   // После контента заметки (перед backlinks)
  | 'footer'          // Нижняя часть страницы
  | 'overlay'         // Оверлей поверх всего (модалки, панели)
  | 'vault-index'     // Слот на главной странице хранилища (для кнопок плагинов и т.д.)

// ─── Контекст, который хост передаёт плагину ───
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
}

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
  activate?: (ctx: PluginContext) => void | Promise<void>

  /** Вызывается при деактивации */
  deactivate?: () => void | Promise<void>
}

// ─── Запись о плагине в store (персистентные данные) ───
export interface PluginRecord {
  /** ID плагина */
  id: string
  /** URL, откуда загружен модуль */
  sourceUrl: string
  /** Включён ли плагин */
  enabled: boolean
  /** Метаданные из манифеста (кешируются) */
  name: string
  description: string
  version: string
  icon: string
}

// ─── Загруженный в runtime плагин ───
export interface LoadedPlugin {
  record: PluginRecord
  module: WanderMarkPlugin
  /** ID <style> элемента для CSS плагина */
  styleElementId?: string
}

// ─── Реэкспорт для удобства ───
export interface SearchIndexItem {
  id: string
  title: string
  url: string
  content: string
  tags?: string[]
}
