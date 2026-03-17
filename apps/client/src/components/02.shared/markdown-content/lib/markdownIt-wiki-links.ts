import type MarkdownIt from 'markdown-it'

function markdownItWikiLinks(md: MarkdownIt) {
  const originalParse = md.parse

  md.parse = function (src, env) {
    // Регулярное выражение изменено для поддержки скобок внутри URL.
    // 1. \[([^\]]+)\] -> захватывает текст ссылки
    // 2. \(\s*\/\s* -> ищет начало ссылки '(', возможные пробелы и слэш '/' (признак внутренней ссылки)
    // 3. ((?:[^()]+|\([^()]*\))*) -> захватывает путь.
    //    Логика группы: "любые символы без скобок" ИЛИ "группа в скобках (..)".
    //    Это позволяет обработать ссылки вида "/path/to/file (comment)"
    // 4. \) -> закрывающая скобка всей ссылки

    // eslint-disable-next-line regexp/no-super-linear-backtracking
    src = src.replace(/\[([^\]]+)\]\(\s*\/\s*((?:[^()]|\([^()]*\))*)\)/g, (match, text, path) => {
      const cleanPath = path.trim()
      return `<a href="/${cleanPath}">${text}</a>`
    })

    return originalParse.call(this, src, env)
  }
}

export { markdownItWikiLinks }
