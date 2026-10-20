import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => ({ head: vi.fn() }))
const preference = ref('system')
const dark = ref(false)
vi.mock('@vueuse/core', () => ({ useStorage: () => preference, usePreferredDark: () => dark }))
vi.mock('@vueuse/head', () => ({ useHead: mocks.head }))

const { ThemesVariant, useChangeTheme } = await import('./use-change-theme')

beforeEach(() => {
  vi.clearAllMocks()
  preference.value = ThemesVariant.System
  dark.value = false
  vi.stubGlobal('document', { documentElement: { setAttribute: vi.fn(), style: {} } })
})
afterEach(() => vi.unstubAllGlobals())

describe('theme preference', () => {
  it('tracks system changes in the page, browser controls and metadata', async () => {
    const scope = effectScope()
    const api = scope.run(useChangeTheme)!
    expect(api.resolvedTheme.value).toBe('light')
    dark.value = true
    await nextTick()
    expect(api.theme.value).toBe('system')
    expect(api.resolvedTheme.value).toBe('dark')
    expect(document.documentElement.setAttribute).toHaveBeenLastCalledWith('data-theme', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(mocks.head.mock.calls[0]![0].meta[0].content()).toBe('#0d1117')
    scope.stop()
  })

  it('preserves explicit choices and cycles back to system', async () => {
    const scope = effectScope()
    const api = scope.run(useChangeTheme)!
    api.toggleTheme()
    dark.value = true
    await nextTick()
    expect(api.theme.value).toBe('light')
    expect(api.resolvedTheme.value).toBe('light')
    api.toggleTheme()
    dark.value = false
    await nextTick()
    expect(api.theme.value).toBe('dark')
    expect(api.resolvedTheme.value).toBe('dark')
    api.toggleTheme()
    await nextTick()
    expect(api.theme.value).toBe('system')
    expect(api.resolvedTheme.value).toBe('light')
    scope.stop()
  })
})
