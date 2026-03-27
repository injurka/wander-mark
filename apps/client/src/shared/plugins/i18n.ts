import { createI18n } from 'vue-i18n'
import ru from '../locales/ru.json'
import en from '../locales/en.json'
import cn from '../locales/cn.json'

const savedLocale = localStorage.getItem('app-locale') || 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    ru,
    en,
    cn
  }
})
