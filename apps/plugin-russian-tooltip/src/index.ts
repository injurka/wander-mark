import type { PluginContext } from './types'
import { markRaw } from 'vue'
import RussianTooltip from './components/russian-tooltip.vue'

export default {
  id: 'russian-tooltip',
  name: 'Russian Language Helper',
  description: 'Позволяет выделять и озвучивать русские слова по клику.',
  version: '1.0.0',
  icon: 'mdi:volume-high',

  activate(ctx: PluginContext) {
    if (ctx.registerTextInterceptor) {
      ctx.registerTextInterceptor({
        id: 'ru-speech-interceptor',
        // eslint-disable-next-line e18e/prefer-static-regex, regexp/no-obscure-range
        isValidChar: (char: string) => /[а-яА-ЯёЁ\-]/.test(char),
        // eslint-disable-next-line e18e/prefer-static-regex, regexp/no-obscure-range
        isValidText: (text: string) => /[а-яА-ЯёЁ]/.test(text),
        tooltipComponent: markRaw(RussianTooltip),
      })
      // eslint-disable-next-line no-console
      console.log('[Russian Tooltip] Activated')
    }
  },

  deactivate(ctx: PluginContext) {
    if (ctx.unregisterTextInterceptor) {
      ctx.unregisterTextInterceptor('ru-speech-interceptor')
      // eslint-disable-next-line no-console
      console.log('[Russian Tooltip] Deactivated')
    }
  },
}
