import { reactive, watch } from 'vue'

export const state = reactive({
  apiKey: localStorage.getItem('hz-api-key') || '',
  model: localStorage.getItem('hz-model') || 'gemini-3-flash-preview',
  backendUrl: localStorage.getItem('hz-backend') || 'http://localhost:8080',
  isSettingsOpen: false,

  vaultId: '',
  vaultUrl: '',
  getFileContent: null as any,
  showToast: null as any,
})

watch(() => state.apiKey, v => localStorage.setItem('hz-api-key', v))
watch(() => state.model, v => localStorage.setItem('hz-model', v))
watch(() => state.backendUrl, v => localStorage.setItem('hz-backend', v))

export function setContext(ctx: any) {
  state.vaultId = ctx.vaultId
  state.vaultUrl = ctx.vaultUrl
  state.getFileContent = ctx.getFileContent
  state.showToast = ctx.showToast
}
