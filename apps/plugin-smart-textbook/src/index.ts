/// <reference types="vite/client" />

import type { PluginContext } from './types'
import { markRaw, unref } from 'vue'
import { setupPluginI18n } from './i18n'
import TextbookPage from './pages/textbook-page.vue'
import { tbActions } from './store/textbook.store'

export default {
  id: 'smart-textbook',
  name: 'Smart Textbook',
  description: 'Умный интерактивный учебник с Generative UI',
  version: '1.0.0',
  icon: 'mdi:book-open-page-variant-outline',

  pages: {
    index: markRaw(TextbookPage),
  },

  // styles,

  activate(ctx: PluginContext) {
    tbActions.setContext(ctx)

    if (ctx.locale) {
      setupPluginI18n(() => unref(ctx.locale as any))
    }

    // eslint-disable-next-line no-console
    console.log('[Smart Textbook] Activated')
  },
}
