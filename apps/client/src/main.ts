import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import router from '~/shared/lib/router'

import App from './app.vue'

import { vRipple } from '~/shared/directives/ripple'

import '~/assets/scss/global.scss'
import '~/assets/scss/normalize.scss'

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.directive('ripple', vRipple)

app.use(pinia)
app.use(head)
app.use(router)

app.mount('#app')
