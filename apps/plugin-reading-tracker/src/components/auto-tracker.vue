<template>
  <div style="display: none;"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { trackerActions } from '../store/tracker.store'

const route = useRoute()
let mountTime = 0

onMounted(() => {
  mountTime = Date.now()
  // eslint-disable-next-line no-console
  console.log(`[Reading Tracker] Начато отслеживание страницы: ${route.path}`)
})

onUnmounted(() => {
  if (mountTime === 0) return
  const duration = Math.floor((Date.now() - mountTime) / 1000)
  
  const title = (route.query.title as string) || (route.params.path as string) || 'Unknown'
  const path = (route.params.path as string) || route.path

  // eslint-disable-next-line no-console
  console.log(`[Reading Tracker] Страница покинута: ${path}. Время пребывания: ${duration} сек.`)

  if (duration > 0 && path) {
    trackerActions.addVisit(path, title, duration)
  }
})
</script>
