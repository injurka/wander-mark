import type { PluginContext } from './types'
import { markRaw, unref } from 'vue'
import MarkButton from './components/mark-button.vue'
import SidebarWidget from './components/sidebar-widget.vue'

import { setupPluginI18n } from './i18n'
import ReportPage from './pages/report-page.vue'
import { trackerActions } from './store/tracker.store'

export default {
  id: 'reading-tracker',
  name: 'Reading Tracker',
  description: 'Логирование прочитанных материалов, интервальное повторение и синхронизация.',
  version: '1.0.0',
  icon: 'mdi:book-check-outline',

  slots: {
    'content-after': markRaw(MarkButton),
    'sidebar-bottom': markRaw(SidebarWidget),
  },

  pages: {
    index: markRaw(ReportPage),
  },

  activate(ctx: PluginContext) {
    trackerActions.init(ctx)

    if (ctx.locale) {
      setupPluginI18n(() => unref(ctx.locale as any))
    }

    // eslint-disable-next-line no-console
    console.log('[Reading Tracker] Activated')
  },
}
