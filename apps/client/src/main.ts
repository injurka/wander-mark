import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import * as Vue from 'vue'
import { createApp } from 'vue'
import { vRipple } from '~/shared/directives/ripple'
import router from '~/shared/lib/router'
import { i18n } from '~/shared/plugins/i18n'
import { isTauri } from '~/shared/services/fs.client'

import { useVaultService } from '~/shared/services/vault.service'

import App from './app.vue'

import '~/assets/scss/global.scss'
import '~/assets/scss/normalize.scss'

;

(window as any).Vue = Vue

async function bootstrap() {
  const vaultService = useVaultService()
  await vaultService.initPredefinedVaults()

  const app = createApp(App)
  const pinia = createPinia()
  const head = createHead()

  app.directive('ripple', vRipple)

  app.use(pinia)
  app.use(head)
  app.use(router)
  app.use(i18n)

  app.mount('#app')

  if (!isTauri && 'serviceWorker' in navigator) {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: true })
      })
      .catch((err) => {
        console.warn('PWA plugin not found or failed to register:', err)
      })
  }
}

bootstrap()
