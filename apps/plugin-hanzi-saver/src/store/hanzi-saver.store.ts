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

export function setContext(ctx: WanderMarkPluginContext) {
  state.ctx = markRaw(ctx)

  ctx.storage.get<string>('backendUrl').then((val) => {
    if (val) {
      state.backendUrl = val
    }
    else {
      state.backendUrl = 'http://localhost:3000'
    }
  })
}

watch(() => state.backendUrl, (val) => {
  if (state.ctx && val) {
    state.ctx.storage.set('backendUrl', val)
  }
})
