export interface PluginContext {
  vaultId: string
  vaultUrl: string
  searchIndex: any[] | null
  navItems: any[] | null
  router: any
  getFileContent: (path: string) => Promise<string | null>
  showToast?: (message: string, options?: any) => void
  confirm?: (options: any) => Promise<boolean>
}

export interface AiHistoryItem {
  id: string
  prompt: string
  response: string
  status: 'loading' | 'success' | 'error' | 'aborted'
  date: number
}

export interface AiTopic {
  id: string
  title: string
  history: AiHistoryItem[]
  updatedAt: number
}

export interface AiSystemPrompt {
  id: string
  name: string
  content: string
}
