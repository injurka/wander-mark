import type { LoadedPlugin, PluginContext, PluginRecord, PluginSlotName, TextInterceptor, WanderMarkPlugin } from '../models'
import { defineStore } from 'pinia'
import { computed, markRaw, ref, shallowRef } from 'vue'
import { injectPluginStyles, loadPluginModule, removePluginStyles } from '../lib'

function storageKey(vaultId: string) {
  return `wm-plugins::${vaultId}`
}

export const usePluginStore = defineStore('plugins', () => {
  const currentVaultId = ref<string>('')
  const registry = ref<PluginRecord[]>([])
  const loaded = ref<Map<string, LoadedPlugin>>(new Map())
  const errors = ref<Map<string, string>>(new Map())
  const textInterceptors = ref<TextInterceptor[]>([])
  const context = shallowRef<PluginContext | null>(null)

  const plugins = computed(() => registry.value)
  const enabledPlugins = computed(() => registry.value.filter(p => p.enabled))

  function registerTextInterceptor(interceptor: TextInterceptor) {
    textInterceptors.value.push(interceptor)
  }

  function unregisterTextInterceptor(id: string) {
    textInterceptors.value = textInterceptors.value.filter(i => i.id !== id)
  }

  const getSlotComponents = (slot: PluginSlotName) => {
    return computed(() => {
      const result: Array<{ pluginId: string, component: any }> = []
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

  const getError = (pluginId: string) => errors.value.get(pluginId)

  async function init(vaultId: string, ctx: Omit<PluginContext, 'registerTextInterceptor' | 'unregisterTextInterceptor'>) {
    await deactivateAll()

    currentVaultId.value = vaultId

    context.value = {
      ...ctx,
      registerTextInterceptor,
      unregisterTextInterceptor,
    } as PluginContext

    errors.value.clear()
    textInterceptors.value = []

    const stored = localStorage.getItem(storageKey(vaultId))
    registry.value = stored ? JSON.parse(stored) : []

    for (const record of registry.value) {
      if (record.enabled) {
        await loadAndActivate(record)
      }
    }
  }

  async function install(sourceUrl: string, autoEnable = true): Promise<WanderMarkPlugin> {
    const module = await loadPluginModule(sourceUrl)

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

  async function uninstall(pluginId: string) {
    await disable(pluginId)
    registry.value = registry.value.filter(r => r.id !== pluginId)
    errors.value.delete(pluginId)
    persist()
  }

  async function enable(pluginId: string) {
    const record = registry.value.find(r => r.id === pluginId)
    if (!record)
      return

    record.enabled = true
    persist()

    await loadAndActivate(record)
  }

  async function disable(pluginId: string) {
    const record = registry.value.find(r => r.id === pluginId)
    if (!record)
      return

    record.enabled = false
    persist()

    const lp = loaded.value.get(pluginId)
    if (lp) {
      try {
        await lp.module.deactivate?.(context.value!)
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
        await lp.module.deactivate?.(context.value!)
      }
      catch (e) {
        console.warn(`[PluginStore] Error deactivating "${id}":`, e)
      }

      if (lp.styleElementId) {
        removePluginStyles(lp.styleElementId)
      }
    }
    loaded.value.clear()
    textInterceptors.value = []
  }

  function persist() {
    if (!currentVaultId.value)
      return
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
    textInterceptors,

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
