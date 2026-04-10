import type { PluginContext } from './types'
import { markRaw } from 'vue'
import HanziTooltip from './components/hanzi-tooltip.vue'
import HanziSaverPage from './pages/hanzi-saver-page.vue'
import { setContext } from './store/hanzi-saver.store'

export default {
  id: 'hanzi-saver',
  name: 'Hanzi Saver',
  description: 'Выделяйте иероглифы, разбирайте через AI и сохраняйте в БД',
  version: '1.1.0',
  icon: 'mdi:translate',

  pages: {
    index: markRaw(HanziSaverPage),
  },

  activate(ctx: PluginContext) {
    setContext(ctx)

    ctx.registerTextInterceptor({
      id: 'hanzi-interceptor',
      isValidChar: (char: string) => /[\u4E00-\u9FFF]/.test(char),
      tooltipComponent: markRaw(HanziTooltip),
    })

    // eslint-disable-next-line no-console
    console.log('[Hanzi Saver] Activated')
  },

  deactivate(ctx: PluginContext) {
    ctx.unregisterTextInterceptor('hanzi-interceptor')
  },
}
