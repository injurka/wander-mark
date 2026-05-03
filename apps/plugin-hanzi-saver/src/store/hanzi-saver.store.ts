import type { WanderMarkPluginContext } from '@injurkx/plugin-api'
import { markRaw, reactive, watch } from 'vue'

export interface HanziSaverState {
  backendUrl: string

  isSettingsOpen: boolean
  isManualInputOpen: boolean
  manualInputTarget: string

  popover: {
    visible: boolean
    text: string
    x: number
    y: number
  }

  ctx: WanderMarkPluginContext | null
}

export const state = reactive({
  backendUrl: '',

  isSettingsOpen: false,
  isManualInputOpen: false,
  manualInputTarget: '',

  popover: {
    visible: false,
    text: '',
    x: 0,
    y: 0,
  },

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

export function openPopover(event: MouseEvent, text: string) {
  event.preventDefault()
  event.stopPropagation()

  state.popover.text = text

  const x = Math.min(event.clientX, window.innerWidth - 160)
  const y = Math.min(event.clientY, window.innerHeight - 100)

  state.popover.x = x
  state.popover.y = y
  state.popover.visible = true
}

export function closePopover() {
  state.popover.visible = false
}

watch(() => state.backendUrl, (val) => {
  if (state.ctx && val) {
    state.ctx.storage.set('backendUrl', val)
  }
})
