import { ref, watch } from 'vue'
import cn from './locales/cn.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

const messages: Record<string, any> = { ru, en, cn }

const currentLocale = ref('ru')

export function setupPluginI18n(getLocale: () => string | undefined) {
  watch(getLocale, (newLocale) => {
    if (newLocale && messages[newLocale]) {
      currentLocale.value = newLocale
    }
  }, { immediate: true })
}

export function usePluginI18n() {
  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.')
    let result = messages[currentLocale.value]

    for (const k of keys) {
      if (result === undefined || result === null)
        break
      result = result[k]
    }

    let text = typeof result === 'string' ? result : key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }

    return text
  }

  return { t, locale: currentLocale }
}
