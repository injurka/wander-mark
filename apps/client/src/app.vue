<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'

import { useChangeTheme } from '~/shared/composables/use-change-theme'

import { DefaultLayout } from '~/components/06.layouts/default'
import '~/assets/scss/global.scss'
import '~/assets/scss/atomic.scss'
import '~/assets/scss/normalize.scss'

useChangeTheme()

const route = useRoute()
const layoutName = computed(() => (route.meta.layout as string) || 'default')

const layouts: Record<string, any> = {
  'default': DefaultLayout,
}

useHead({
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | WanderingMark` : `WanderingMark`,
  htmlAttrs: { lang: 'ru' }
})
</script>

<template>
  <component :is="layouts[layoutName]" v-if="layouts[layoutName]">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </component>
  
  <router-view v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
