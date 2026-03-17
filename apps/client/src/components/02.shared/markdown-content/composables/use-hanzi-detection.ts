/**
 * Composable для определения китайского текста под курсором.
 * Работает с MouseEvent и Range API для извлечения текста из сложных HTML структур.
 */
export function useHanziDetection() {
  /**
   * Проверка, является ли символ частью китайской фразы.
   */
  function isChineseChar(char: string): boolean {
    // Диапазоны Unicode:
    // 4E00-9FFF: Основные иероглифы (CJK Unified Ideographs)
    // 3400-4DBF: Редкие иероглифы (Extension A)
    // 3000-303F: Символы и пунктуация CJK (например, 。)
    // FF00-FFEF: Полноширинные формы (например, ！ или ，)
    return /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\uFF00-\uFFEF]/.test(char)
      // Исключаем обычные ASCII скобки и пробелы, чтобы не цеплять (Pinyin)
      && !/[a-z0-9\s()[\]<>]/i.test(char)
  }

  /**
   * Вычисляет глобальное смещение внутри контейнера, игнорируя вложенность тегов.
   */
  function getOffsetInContainer(container: HTMLElement, targetNode: Node, targetOffset: number): number {
    let offset = 0
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)

    while (walker.nextNode()) {
      const currentNode = walker.currentNode
      if (currentNode === targetNode) {
        return offset + targetOffset
      }
      offset += currentNode.textContent?.length || 0
    }
    return -1
  }

  /**
   * Главная функция: находит последовательность китайских символов под курсором.
   */
  function getHanziFromEvent(e: MouseEvent): string | null {
    const x = e.clientX
    const y = e.clientY
    let textNode: Node | null = null
    let clickOffset = 0

    // 1. Получаем ноду и смещение (кроссбраузерно)
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y)
      if (range) {
        textNode = range.startContainer
        clickOffset = range.startOffset
      }
    }
    else if (document.caretPositionFromPoint) {
      const range = document.caretPositionFromPoint(x, y)
      if (range) {
        textNode = range.offsetNode
        clickOffset = range.offset
      }
    }

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return null
    }

    // 2. Находим контейнер и "плоский" текст
    // Ищем ближайший блочный элемент, в котором может быть текст
    const element = textNode.parentElement
    const blockContainer = element?.closest('p, li, blockquote, div.callout-content, h1, h2, h3, h4, h5, h6') as HTMLElement

    if (!blockContainer)
      return null

    const fullText = blockContainer.textContent || ''
    const globalIndex = getOffsetInContainer(blockContainer, textNode, clickOffset)

    if (globalIndex === -1)
      return null

    // 3. Проверяем, попали ли мы вообще в китайский символ или его соседа
    let scanIndex = globalIndex!

    // Проверяем текущий символ или символ слева (если клик был в конец символа)
    if (!isChineseChar((fullText as any)[scanIndex])) {
      if (scanIndex > 0 && isChineseChar((fullText as any)[scanIndex - 1])) {
        scanIndex--
      }
      else {
        return null
      }
    }

    // 4. Расширяем выделение влево и вправо ПОКА символы являются китайскими
    let start = scanIndex
    let end = scanIndex

    // Идем влево
    while (start > 0 && isChineseChar((fullText as any)[start - 1])) {
      start--
    }

    // Идем вправо (включая текущий символ)
    while (end < fullText.length && isChineseChar((fullText as any)[end])) {
      end++
    }

    const result = fullText.slice(start, end).trim()

    return result.length > 0 ? result : null
  }

  return {
    getHanziFromEvent,
    isChineseChar,
  }
}
