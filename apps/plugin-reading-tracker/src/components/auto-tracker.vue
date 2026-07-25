<script setup lang="ts">
import { onMounted, onUnmounted, unref, watch } from 'vue'
import { trackerActions, trackerState } from '../store/tracker.store'

let startTime = Date.now()
let currentPath = ''
let currentTitle = ''

function extractPageInfo() {
  const router = trackerState.router
  if (!router)
    return

  const route = unref(router.currentRoute) as any
  const pwd = route?.params?.pwd
  let path = ''
  if (Array.isArray(pwd)) {
    path = pwd.join('/')
  }
  else if (typeof pwd === 'string') {
    path = pwd
  }

  if (!path) {
    currentPath = ''
    currentTitle = ''
    return
  }

  const title = (route.query?.title as string) || path.split('/').pop() || path
  currentPath = path
  currentTitle = title
}

function flushTime() {
  if (!currentPath) {
    return
  }
  const now = Date.now()
  const duration = Math.floor((now - startTime) / 1000)
  startTime = now

  if (duration >= 2) {
    trackerActions.addVisit(currentPath, currentTitle, duration)
  }
}

watch(
  () => {
    const r = trackerState.router
    if (!r)
      return undefined
    return unref(r.currentRoute)?.fullPath
  },
  () => {
    flushTime()
    extractPageInfo()
    startTime = Date.now()
  },
  { immediate: true },
)

onMounted(() => {
  startTime = Date.now()
  extractPageInfo()
})

onUnmounted(() => {
  flushTime()
})
</script>

<template>
  <div style="display: none;" />
</template>
