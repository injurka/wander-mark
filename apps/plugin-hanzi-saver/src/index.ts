import type { WanderMarkPlugin, WanderMarkPluginContext } from '@injurkx/plugin-api'
import { markRaw } from 'vue'
import HanziTooltip from './components/hanzi-tooltip.vue'
import ToolbarAction from './components/toolbar-action.vue'
import HanziSaverPage from './pages/hanzi-saver-page.vue'
import { setContext } from './store/hanzi-saver.store'

export default {
  id: 'hanzi-saver',
  name: 'Hanzi Saver',
  description: 'Выделяйте иероглифы, разбирайте фразы через AI и сохраняйте в личный словарь',
  version: '2.0.0',
  icon: 'mdi:translate',

  slots: {
    toolbar: markRaw(ToolbarAction),
  },

  pages: {
    index: markRaw(HanziSaverPage),
  },

  activate(ctx: WanderMarkPluginContext) {
    setContext(ctx)

    ctx.registerTextInterceptor({
      id: 'hanzi-interceptor',
      isValidChar: (char: string) => /[\u4E00-\u9FFF]/.test(char),
      tooltipComponent: markRaw(HanziTooltip),
    })


  },

  deactivate(ctx: WanderMarkPluginContext) {
    ctx.unregisterTextInterceptor('hanzi-interceptor')
  },
} satisfies WanderMarkPlugin
