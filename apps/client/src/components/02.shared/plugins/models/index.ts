import type { WanderMarkPlugin } from '@injurkx/plugin-api'

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
  removable?: boolean
}

// ─── Загруженный в runtime плагин ───
export interface LoadedPlugin {
  record: PluginRecord
  module: WanderMarkPlugin
  /** ID <style> элемента для CSS плагина */
  styleElementId?: string
  /** Сохраненная ссылка Blob для последующей очистки памяти */
  blobUrl?: string
}
