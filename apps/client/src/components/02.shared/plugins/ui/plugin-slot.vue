<script setup lang="ts">
import type { PluginSlotName } from '../models'
import { usePluginStore } from '../store'

interface Props {
  /** Имя слота, в котором рендерятся плагины */
  name: PluginSlotName
}

const props = defineProps<Props>()

const pluginStore = usePluginStore()
const components = pluginStore.getSlotComponents(props.name)
</script>

<template>
  <template v-for="entry in components" :key="entry.pluginId">
    <component
      :is="entry.component"
      :plugin-id="entry.pluginId"
      class="wm-plugin-slot-item"
    />
  </template>
</template>
