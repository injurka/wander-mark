import { usePreferredDark, useStorage } from '@vueuse/core'
import { useHead } from '@vueuse/head'
import { computed, watchEffect } from 'vue'

export enum ThemesVariant {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

const themesColors = {
  [ThemesVariant.Light]: '#faf4f2',
  [ThemesVariant.Dark]: '#0d1117',
}

const themePreference = useStorage<ThemesVariant>('app-theme', ThemesVariant.System)

export function useChangeTheme() {
  const preferredDark = usePreferredDark()
  const resolvedTheme = computed(() => {
    if (themePreference.value === ThemesVariant.Light || themePreference.value === ThemesVariant.Dark)
      return themePreference.value
    return preferredDark.value ? ThemesVariant.Dark : ThemesVariant.Light
  })
  const themeIcon = computed(() => ({
    [ThemesVariant.System]: 'mdi:theme-light-dark',
    [ThemesVariant.Light]: 'mdi:weather-sunny',
    [ThemesVariant.Dark]: 'mdi:weather-night',
  })[themePreference.value] || 'mdi:theme-light-dark')
  const themeLabel = computed(() => ({
    [ThemesVariant.System]: 'settings.themeSystem',
    [ThemesVariant.Light]: 'settings.themeLight',
    [ThemesVariant.Dark]: 'settings.themeDark',
  })[themePreference.value] || 'settings.themeSystem')

  useHead({
    meta: [{ name: 'theme-color', content: () => themesColors[resolvedTheme.value] }],
  })

  watchEffect(() => {
    if (typeof document === 'undefined')
      return
    document.documentElement.setAttribute('data-theme', resolvedTheme.value)
    document.documentElement.style.colorScheme = resolvedTheme.value
  })

  function getHeadThemeColor() {
    return themesColors[resolvedTheme.value]
  }

  function setTheme(value: ThemesVariant) {
    themePreference.value = value
  }

  function toggleTheme() {
    const order = [ThemesVariant.System, ThemesVariant.Light, ThemesVariant.Dark]
    setTheme(order[(order.indexOf(themePreference.value) + 1) % order.length]!)
  }

  return {
    theme: themePreference,
    resolvedTheme,
    themeIcon,
    themeLabel,
    getHeadThemeColor,
    setTheme,
    toggleTheme,
  }
}
