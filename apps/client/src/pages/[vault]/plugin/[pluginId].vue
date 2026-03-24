<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePluginStore } from '~/components/02.shared/plugins/store'

const route = useRoute()
const pluginStore = usePluginStore()

const pluginId = computed(() => route.params.pluginId as string)

const pluginPathArray = computed(() => {
  const path = route.params.pluginPath
  if (Array.isArray(path)) return path
  if (path) return [path]
  return[]
})

const pluginPageKey = computed(() => {
  const pathArr = pluginPathArray.value
  if (!pathArr || pathArr.length === 0) return 'index'
  return pathArr.join('/')
})

// Нам нужно использовать computed, чтобы реагировать на асинхронную инициализацию плагинов
const pluginComponent = computed(() => {
  const loadedPlugin = pluginStore.loaded.get(pluginId.value)
  if (!loadedPlugin) return null
  return loadedPlugin.module.pages?.[pluginPageKey.value] || null
})
</script>

<template>
  <div class="plugin-page-wrapper">
    <component 
      :is="pluginComponent" 
      v-if="pluginComponent" 
      :plugin-id="pluginId" 
      :plugin-path="pluginPathArray" 
    />
    <div v-else class="plugin-page-not-found">
      <div class="alert">
        <h3>Страница плагина не найдена</h3>
        <p>Плагин <strong>{{ pluginId }}</strong> не предоставляет страницу <code>{{ pluginPageKey }}</code> или еще не загружен.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-page-wrapper {
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
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
