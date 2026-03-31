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
  const t = (key: string) => {
    const keys = key.split('.')
    let result = messages[currentLocale.value]

    for (const k of keys) {
      if (result === undefined || result === null)
        break
      result = result[k]
    }

    return typeof result === 'string' ? result : key
  }

  return { t, locale: currentLocale }
}
