<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { PageLoader } from '~/components/02.shared/page-loader'
import { usePluginStore } from '~/components/02.shared/plugins/store'

const route = useRoute()
const pluginStore = usePluginStore()
const { t } = useI18n()

const pluginId = computed(() => route.params.pluginId as string)

const pluginPathArray = computed(() => {
  const path = route.params.pluginPath

  if (Array.isArray(path))
    return path

  if (path)
    return [path]

  return []
})

const pluginPageKey = computed(() => {
  const pathArr = pluginPathArray.value

  if (!pathArr || pathArr.length === 0)
    return 'index'

  return pathArr.join('/')
})

const pluginRecord = computed(() => pluginStore.registry.find(p => p.id === pluginId.value))
const isEnabled = computed(() => pluginRecord.value?.enabled)
const loadedPlugin = computed(() => pluginStore.loaded.get(pluginId.value))
const isLoading = computed(() => isEnabled.value && !loadedPlugin.value)

const pluginComponent = computed(() => {
  if (!loadedPlugin.value)
    return null

  return loadedPlugin.value.module.pages?.[pluginPageKey.value] || null
})
</script>

<template>
  <div class="plugin-page-wrapper">
    <!-- Показываем лоадер, если плагин должен быть, но еще инициализируется -->
    <PageLoader v-if="isLoading" />

    <component
      :is="pluginComponent"
      v-else-if="pluginComponent"
      :plugin-id="pluginId"
      :plugin-path="pluginPathArray"
    />

    <div v-else class="plugin-page-not-found">
      <div class="alert">
        <h3>{{ t('page.pluginNotFound') }}</h3>
        <p>{{ t('page.pluginNotFoundDesc') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-page-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100dvh - 50px);
  padding: 0;
  display: flex;
  flex-direction: column;
}
.plugin-page-not-found {
  padding: 40px;
  display: flex;
  justify-content: center;
}
.alert {
  background: var(--bg-secondary-color);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid var(--fg-accent-color);
  color: var(--fg-primary-color);
}
.alert h3 {
  margin-top: 0;
  margin-bottom: 8px;
}
.alert p {
  margin: 0;
  color: var(--fg-secondary-color);
}
</style>
