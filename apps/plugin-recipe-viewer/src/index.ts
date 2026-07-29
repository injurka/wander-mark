import type { WanderMarkPlugin, WanderMarkPluginContext } from '@injurkx/plugin-api'

import { markRaw } from 'vue'
import RecipeViewerPage from './pages/recipe-viewer-page.vue'
import { setContext } from './store/plugin.store'

export default {
  id: 'recipe-viewer',
  name: 'Recipe Explorer',
  description: 'Универсальный каталог рецептов (Кофе, Чай, Коктейли). Поиск и удобные фильтры по вкусам и сложности.',
  version: '1.0.0',
  icon: 'mdi:coffee-outline',

  slots: {},

  pages: {
    index: markRaw(RecipeViewerPage),
  },

  activate(ctx: WanderMarkPluginContext) {
    setContext(ctx)
    // eslint-disable-next-line no-console
    console.log('[Recipe Explorer] Activated')
  },

  deactivate(_ctx: WanderMarkPluginContext) {
    // eslint-disable-next-line no-console
    console.log('[Recipe Explorer] Deactivated')
  },
} satisfies WanderMarkPlugin
