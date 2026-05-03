import type { WanderMarkPluginContext } from '@injurkx/plugin-api'
import { markRaw, reactive, watch } from 'vue'

export interface HanziSaverState {
  backendUrl: string

  isSettingsOpen: boolean
  isManualInputOpen: boolean
  manualInputTarget: string

  ctx: WanderMarkPluginContext | null
}

export const state = reactive({
  backendUrl: '',

  isSettingsOpen: false,
  isManualInputOpen: false,
  manualInputTarget: '',

  ctx: null,
}) as HanziSaverState

export async function setContext(ctx: WanderMarkPluginContext) {
  state.ctx = markRaw(ctx)

  const val = await ctx.storage.get<string>('backendUrl')
  if (val) {
    state.backendUrl = val
  }
  else {
    state.backendUrl = 'http://localhost:3000'
  }
}

watch(() => state.backendUrl, (val) => {
  if (state.ctx && val) {
    state.ctx.storage.set('backendUrl', val)
  }
})
