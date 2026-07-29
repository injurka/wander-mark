import type { WanderMarkPluginContext } from '@injurkx/plugin-api'
import { markRaw, ref } from 'vue'

export const pluginContext = ref<any>(null)

export function setContext(ctx: WanderMarkPluginContext) {
  pluginContext.value = markRaw(ctx)
}
