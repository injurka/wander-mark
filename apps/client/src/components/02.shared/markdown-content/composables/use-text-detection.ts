/**
 * Composable для определения текста под курсором.
 * Работает с MouseEvent и Range API для извлечения текста из сложных HTML структур.
 */
export function useTextDetection() {
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
   * Главная функция: находит последовательность символов под курсором.
   * Теперь она принимает функцию проверки валидности символа от плагина.
   */
  function getWordFromEvent(e: MouseEvent, isValidChar: (char: string) => boolean): string | null {
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
    else if ('caretPositionFromPoint' in document) {
      const doc = document as any
      const range = doc.caretPositionFromPoint(x, y)
      if (range) {
        textNode = range.offsetNode
        clickOffset = range.offset
      }
    }

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return null
    }

    // 2. Находим контейнер и "плоский" текст
    const element = textNode.parentElement
    const blockContainer = element?.closest('p, li, blockquote, div.callout-content, h1, h2, h3, h4, h5, h6') as HTMLElement

    if (!blockContainer)
      return null

    const fullText = blockContainer.textContent || ''
    const globalIndex = getOffsetInContainer(blockContainer, textNode, clickOffset)

    if (globalIndex === -1)
      return null

    // 3. Проверяем, попали ли мы вообще в валидный символ или его соседа
    let scanIndex = globalIndex!

    if (!isValidChar(fullText[scanIndex])) {
      if (scanIndex > 0 && isValidChar(fullText[scanIndex - 1])) {
        scanIndex--
      }
      else {
        return null
      }
    }

    // 4. Расширяем выделение влево и вправо ПОКА символы являются валидными
    let start = scanIndex
    let end = scanIndex

    while (start > 0 && isValidChar(fullText[start - 1])) {
      start--
    }

    while (end < fullText.length && isValidChar(fullText[end])) {
      end++
    }

    const result = fullText.slice(start, end).trim()

    return result.length > 0 ? result : null
  }

  return {
    getWordFromEvent,
  }
}
