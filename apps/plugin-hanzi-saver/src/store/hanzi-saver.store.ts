import type { WanderMarkPluginContext } from '@injurkx/plugin-api'
import { markRaw, reactive, watch } from 'vue'

export interface HanziSaverState {
  apiKey: string
  model: string
  backendUrl: string

  isSettingsOpen: boolean
  isManualInputOpen: boolean
  manualInputTarget: string

  ctx: WanderMarkPluginContext | null
}

export const state = reactive({
  apiKey: localStorage.getItem('hz-api-key') || '',
  model: localStorage.getItem('hz-model') || 'gemini-3-flash-preview',
  backendUrl: localStorage.getItem('hz-backend') || 'http://localhost:8080',

  isSettingsOpen: false,
  isManualInputOpen: false,
  manualInputTarget: '',

  ctx: null,
}) as HanziSaverState

watch(() => state.apiKey, v => localStorage.setItem('hz-api-key', v))
watch(() => state.model, v => localStorage.setItem('hz-model', v))
watch(() => state.backendUrl, v => localStorage.setItem('hz-backend', v))

export function setContext(ctx: WanderMarkPluginContext) {
  state.ctx = markRaw(ctx)
}
