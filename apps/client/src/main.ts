import { addCollection } from '@iconify/vue'
import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import * as Vue from 'vue'
import { createApp } from 'vue'
import iconsBundle from '~/assets/icons-bundle.json'
import { KitBtn, KitCheckbox, KitDialog, KitDropdown, KitInput, KitSelect, KitSkeleton } from '~/components/01.kit'
import { vRipple } from '~/shared/directives/ripple'
import router from '~/shared/lib/router'
import { i18n } from '~/shared/plugins/i18n'
import { isTauri } from '~/shared/services/fs.client'
import { useVaultStore } from '~/shared/store/vault.store'
import App from './app.vue'

import '~/assets/scss/global.scss'
import '~/assets/scss/normalize.scss';

(window as any).Vue = Vue

async function bootstrap() {
  addCollection(iconsBundle)

  const app = createApp(App)
  const pinia = createPinia()
  const head = createHead()

  app.directive('ripple', vRipple)

  app.use(pinia)
  app.use(head)
  app.use(router)
  app.use(i18n)

  app.component('KitBtn', KitBtn)
  app.component('KitDialog', KitDialog)
  app.component('KitInput', KitInput)
  app.component('KitCheckbox', KitCheckbox)
  app.component('KitDropdown', KitDropdown)
  app.component('KitSelect', KitSelect)
  app.component('KitSkeleton', KitSkeleton)

  const vaultStore = useVaultStore()
  await vaultStore.initPredefinedVaults()

  app.mount('#app')

  document.getElementById('app-preloader')?.remove()

  if (!isTauri && 'serviceWorker' in navigator) {
    import('~/shared/services/pwa.service')
      .then(({ initializePwaUpdater }) => {
        initializePwaUpdater(pinia)
      })
      .catch((err) => {
        console.warn('PWA plugin not found or failed to register:', err)
      })
  }

  if (import.meta.env.DEV) {
    app.config.performance = true
  }
}

bootstrap()
