import { markRaw } from 'vue'
import AiAssistant from './ai-assistant.vue'
import AiPage from './ai-page.vue'
import { aiActions } from './store/ai.store'

import styles from './styles/ai-assistant.css?raw'

export default {
  id: 'ai-assistant',
  name: 'AI Assistant',
  description: 'AI-помощник с фоновым выполнением запросов',
  version: '1.0.0',
  icon: 'mdi:robot-outline',

  slots: {
    toolbar: markRaw(AiAssistant),
  },

  pages: {
    index: markRaw(AiPage),
  },

  styles,

  activate(ctx: any) {
    aiActions.setContext(ctx)
    // eslint-disable-next-line no-console
    console.log('[AI Assistant] Activated')
  },
}
