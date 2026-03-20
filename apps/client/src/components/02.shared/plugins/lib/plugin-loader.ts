import type { WanderMarkPlugin } from '../models'

/**
 * Загружает ES-модуль плагина по URL в runtime.
 *
 * Плагин должен быть собран как ESM с `vue` в external
 * и доступен через Import Map или через абсолютный URL.
 *
 * Поддерживает два сценария:
 * 1. URL к файлу на сервере (плагин лежит в meta/vault/plugins/)
 * 2. Blob URL (плагин загружен из IndexedDB / загружен пользователем)
 */
export async function loadPluginModule(url: string): Promise<WanderMarkPlugin> {
  try {
    // Динамический import — браузер загрузит ES-модуль
    // @vite-ignore нужен, чтобы Vite не пытался резолвить URL при сборке
    const module = await import(/* @vite-ignore */ url)

    const plugin: WanderMarkPlugin = module.default || module

    // Валидация минимального контракта
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('Plugin must export an "id" field (string)')
    }
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must export a "name" field (string)')
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must export a "version" field (string)')
    }

    return plugin
  }
  catch (error) {
    console.error(`[PluginLoader] Failed to load plugin from ${url}:`, error)
    throw new Error(`Не удалось загрузить плагин: ${(error as Error).message}`)
  }
}

/**
 * Внедряет CSS плагина в DOM и возвращает ID элемента <style>.
 */
export function injectPluginStyles(pluginId: string, css: string): string {
  const styleId = `wm-plugin-style-${pluginId}`

  // Удаляем предыдущий, если был
  removePluginStyles(styleId)

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = css
  document.head.appendChild(style)

  return styleId
}

/**
 * Удаляет CSS плагина из DOM.
 */
export function removePluginStyles(styleElementId: string): void {
  const existing = document.getElementById(styleElementId)
  if (existing) {
    existing.remove()
  }
}
