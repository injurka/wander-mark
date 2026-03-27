import type { Ref } from 'vue'
import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import cn from './locales/cn.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

// Создаем собственный экземпляр i18n для плагина
const i18n = createI18n({
  legacy: false,
  locale: 'ru', // Язык по умолчанию, если хост не передаст свой
  fallbackLocale: 'en',
  messages: { ru, en, cn },
})

/**
 * Функция для инициализации локализации плагина.
 * Она принимает реактивную ссылку на локаль от хоста.
 */
export function setupPluginI18n(hostLocale: Ref<string>) {
  // Следим за изменениями локали в хост-приложении
  // и синхронно меняем локаль в нашем плагине.
  watch(hostLocale, (newLocale) => {
    if (newLocale) {
      i18n.global.locale.value = newLocale as 'ru' | 'en' | 'cn'
    }
  }, { immediate: true }) // immediate: true - чтобы применилось сразу при активации
}

// Экспортируем функцию перевода, чтобы использовать ее в компонентах
export const t = i18n.global.t
