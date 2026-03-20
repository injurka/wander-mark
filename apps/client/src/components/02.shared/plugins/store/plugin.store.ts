import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { PluginRecord, LoadedPlugin, PluginContext, PluginSlotName, WanderMarkPlugin } from '../models'
import { loadPluginModule, injectPluginStyles, removePluginStyles } from '../lib'

/**
 * Ключ localStorage формируется per-vault:
 * `wm-plugins::<vaultId>` → PluginRecord[]
 */
function storageKey(vaultId: string) {
  return `wm-plugins::${vaultId}`
}

export const usePluginStore = defineStore('plugins', () => {
  // ─── State ───────────────────────────────────────────────
  /** Текущий vault, для которого загружены плагины */
  const currentVaultId = ref<string>('')

  /** Персистентный список установленных плагинов (per-vault) */
  const registry = ref<PluginRecord[]>([])

  /** Загруженные в runtime модули */
  const loaded = ref<Map<string, LoadedPlugin>>(new Map())

  /** Текущий контекст хоста */
  const context = ref<PluginContext | null>(null)

  /** Ошибки загрузки */
  const errors = ref<Map<string, string>>(new Map())

  // ─── Getters ─────────────────────────────────────────────

  /** Все записи плагинов */
  const plugins = computed(() => registry.value)

  /** Только включённые плагины */
  const enabledPlugins = computed(() => registry.value.filter(p => p.enabled))

  /** Компоненты для конкретного слота */
  const getSlotComponents = (slot: PluginSlotName) => {
    return computed(() => {
      const result: Array<{ pluginId: string; component: any }> = []
      for (const record of enabledPlugins.value) {
        const lp = loaded.value.get(record.id)
        if (lp?.module.slots?.[slot]) {
          result.push({
            pluginId: record.id,
            component: lp.module.slots[slot],
          })
        }
      }
      return result
    })
  }

  /** Ошибка загрузки конкретного плагина */
  const getError = (pluginId: string) => errors.value.get(pluginId)

  // ─── Actions ─────────────────────────────────────────────

  /**
   * Инициализация: загружает registry из localStorage и грузит enabled плагины.
   * Вызывается при смене vault.
   */
  async function init(vaultId: string, ctx: PluginContext) {
    // Деактивируем все текущие
    await deactivateAll()

    currentVaultId.value = vaultId
    context.value = ctx
    errors.value.clear()

    // Загружаем из localStorage
    const stored = localStorage.getItem(storageKey(vaultId))
    registry.value = stored ? JSON.parse(stored) : []

    // Загружаем enabled плагины
    for (const record of registry.value) {
      if (record.enabled) {
        await loadAndActivate(record)
      }
    }
  }

  /**
   * Установить плагин по URL.
   * Загружает модуль, валидирует, сохраняет в registry.
   */
  async function install(sourceUrl: string, autoEnable = true): Promise<WanderMarkPlugin> {
    const module = await loadPluginModule(sourceUrl)

    // Проверяем дубликаты
    if (registry.value.some(r => r.id === module.id)) {
      throw new Error(`Плагин "${module.name}" (${module.id}) уже установлен.`)
    }

    const record: PluginRecord = {
      id: module.id,
      sourceUrl,
      enabled: autoEnable,
      name: module.name,
      description: module.description || '',
      version: module.version,
      icon: module.icon || 'mdi:puzzle-outline',
    }

    registry.value.push(record)
    persist()

    if (autoEnable) {
      await loadAndActivate(record, module)
    }

    return module
  }

  /**
   * Удалить плагин полностью.
   */
  async function uninstall(pluginId: string) {
    await disable(pluginId)
    registry.value = registry.value.filter(r => r.id !== pluginId)
    errors.value.delete(pluginId)
    persist()
  }

  /**
   * Включить плагин.
   */
  async function enable(pluginId: string) {
    const record = registry.value.find(r => r.id === pluginId)
    if (!record) return

    record.enabled = true
    persist()

    await loadAndActivate(record)
  }

  /**
   * Выключить плагин.
   */
  async function disable(pluginId: string) {
    const record = registry.value.find(r => r.id === pluginId)
    if (!record) return

    record.enabled = false
    persist()

    const lp = loaded.value.get(pluginId)
    if (lp) {
      try {
        await lp.module.deactivate?.()
      }
      catch (e) {
        console.warn(`[PluginStore] Error deactivating "${pluginId}":`, e)
      }

      if (lp.styleElementId) {
        removePluginStyles(lp.styleElementId)
      }

      loaded.value.delete(pluginId)
    }
  }

  // ─── Internal ────────────────────────────────────────────

  async function loadAndActivate(record: PluginRecord, existingModule?: WanderMarkPlugin) {
    try {
      const module = existingModule || await loadPluginModule(record.sourceUrl)

      const lp: LoadedPlugin = { record, module: markRaw(module) }

      if (module.styles) {
        lp.styleElementId = injectPluginStyles(module.id, module.styles)
      }

      loaded.value.set(record.id, lp)

      if (module.activate && context.value) {
        await module.activate(context.value)
      }

      errors.value.delete(record.id)
    }
    catch (error) {
      const msg = (error as Error).message
      console.error(`[PluginStore] Failed to load "${record.id}":`, msg)
      errors.value.set(record.id, msg)
    }
  }

  async function deactivateAll() {
    for (const [id, lp] of loaded.value) {
      try {
        await lp.module.deactivate?.()
      }
      catch (e) {
        console.warn(`[PluginStore] Error deactivating "${id}":`, e)
      }

      if (lp.styleElementId) {
        removePluginStyles(lp.styleElementId)
      }
    }
    loaded.value.clear()
  }

  function persist() {
    if (!currentVaultId.value) return
    localStorage.setItem(
      storageKey(currentVaultId.value),
      JSON.stringify(registry.value),
    )
  }

  return {
    // State
    currentVaultId,
    registry,
    loaded,
    errors,

    // Getters
    plugins,
    enabledPlugins,
    getSlotComponents,
    getError,

    // Actions
    init,
    install,
    uninstall,
    enable,
    disable,
  }
})
