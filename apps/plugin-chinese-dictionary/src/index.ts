import type { PluginContext } from './types'
import { markRaw } from 'vue'
import DictionaryTooltip from './components/dictionary-tooltip.vue'
import { useHanziDetection } from './composables/use-hanzi-detection'
import { init as initDictionaryService } from './services/dictionary.service'
import { dictionaryActions } from './store/dictionary.store'
import styles from './styles.css?raw'

let markdownBody: HTMLElement | null = null
const { getHanziFromEvent } = useHanziDetection()

// Функция-обработчик, которую мы будем добавлять и удалять
async function handleContentClick(event: MouseEvent) {
  const hanziPhrase = getHanziFromEvent(event)

  if (hanziPhrase) {
    // Останавливаем стандартную подсказку хоста
    event.preventDefault()
    event.stopPropagation()

    // Показываем нашу подсказку
    dictionaryActions.showTooltip(event.clientX, event.clientY, hanziPhrase)
    return
  }

  // Если клик был не по иероглифу, закрываем нашу подсказку
  dictionaryActions.hideTooltip()
}

export default {
  id: 'chinese-dictionary',
  name: 'Chinese Dictionary',
  description: 'Показывает перевод и пиньинь для китайских слов при наведении.',
  version: '1.0.0',
  icon: 'mdi:book-open-variant',

  slots: {
    overlay: markRaw(DictionaryTooltip),
  },

  styles,

  async activate(ctx: PluginContext) {
    dictionaryActions.setContext(ctx)
    await initDictionaryService(ctx)

    // Ищем контейнер для контента и вешаем слушатель
    // Используем `mousedown` для перехвата до `click`
    setTimeout(() => {
      markdownBody = document.querySelector('.markdown-body')
      if (markdownBody) {
        markdownBody.addEventListener('mousedown', handleContentClick, true) // use capture
      }
    }, 500) // Даем хосту время на рендер

    console.log('[Chinese Dictionary] Activated')
  },

  deactivate() {
    // Обязательно убираем слушатель при деактивации
    if (markdownBody) {
      markdownBody.removeEventListener('mousedown', handleContentClick, true)
    }
    markdownBody = null
    console.log('[Chinese Dictionary] Deactivated')
  },
}
