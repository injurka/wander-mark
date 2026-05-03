<script setup lang="ts">
import type { PluginSlotName } from '@injurkx/plugin-api'
import { usePluginStore } from '../store'

interface Props {
  name: PluginSlotName
}

const props = defineProps<Props>()

const pluginStore = usePluginStore()
const components = pluginStore.getSlotComponents(props.name)
</script>

<template>
  <div
    v-for="entry in components"
    :key="entry.pluginId"
    class="wm-plugin-slot-item"
    :data-plugin-id="entry.pluginId"
  >
    <component :is="entry.component" />
  </div>
</template>

<style scoped>
.wm-plugin-slot-item {
  display: contents;
}
</style>
