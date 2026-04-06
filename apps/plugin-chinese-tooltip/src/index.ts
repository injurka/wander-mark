import type { PluginContext } from './types'
import { markRaw } from 'vue'
import ChineseTooltip from './components/chinese-tooltip.vue'

export default {
  id: 'chinese-tooltip',
  name: 'Chinese Language Helper',
  description: 'Позволяет выделять и озвучивать китайские иероглифы по клику.',
  version: '1.0.0',
  icon: 'mdi:translate-variant',

  activate(ctx: PluginContext) {
    if (ctx.registerTextInterceptor) {
      ctx.registerTextInterceptor({
        id: 'zh-speech-interceptor',
        // eslint-disable-next-line e18e/prefer-static-regex
        isValidChar: (char: string) => /[\u4E00-\u9FA5]/.test(char),
        // eslint-disable-next-line e18e/prefer-static-regex
        isValidText: (text: string) => /[\u4E00-\u9FA5]+/.test(text),
        tooltipComponent: markRaw(ChineseTooltip),
      })
      // eslint-disable-next-line no-console
      console.log('[Chinese Tooltip] Activated')
    }
  },

  deactivate(ctx: PluginContext) {
    if (ctx.unregisterTextInterceptor) {
      ctx.unregisterTextInterceptor('zh-speech-interceptor')
      // eslint-disable-next-line no-console
      console.log('[Chinese Tooltip] Deactivated')
    }
  },
}
