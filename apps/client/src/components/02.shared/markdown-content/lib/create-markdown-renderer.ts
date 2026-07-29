import type { Highlighter } from 'shiki'
import catppuccinFrappe from '@shikijs/themes/catppuccin-frappe'
import catppuccinLatte from '@shikijs/themes/catppuccin-latte'
import catppuccinMacchiato from '@shikijs/themes/catppuccin-macchiato'
import catppuccinMocha from '@shikijs/themes/catppuccin-mocha'
import MarkdownIt from 'markdown-it'
// @ts-expect-error no dts
import MarkdownItAttrs from 'markdown-it-attrs'
import MarkdownItCollapsible from 'markdown-it-collapsible'
// @ts-expect-error no dts
import MarkdownItObsidianCallouts from 'markdown-it-obsidian-callouts'
import pako from 'pako'
import { createHighlighter } from 'shiki'
import { markdownItWikiImages } from './markdownIt-wiki-images'
import { markdownItWikiLinks } from './markdownIt-wiki-links'

interface CreateMarkdownRendererParams {
  imageBasePath: string
  shikiTheme: string
  onHighlightNeeded: () => void
}

let cachedHighlighter: Highlighter | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (cachedHighlighter)
    return cachedHighlighter

  cachedHighlighter = await createHighlighter({
    themes: [catppuccinMocha, catppuccinMacchiato, catppuccinFrappe, catppuccinLatte],
    langs: [],
  })

  return cachedHighlighter
}

/**
 * Плагин для очистки автоматических <br> и <p> внутри HTML-блоков с отступами.
 * Из-за отключенного правила 'code', отформатированный HTML воспринимается как абзацы,
 * а настройка breaks: true вставляет <br> при каждом переносе строки.
 */
function cleanHtmlBreaksPlugin(md: MarkdownIt) {
  md.core.ruler.push('clean_html_breaks', (state) => {
    const blockTags = ['div', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'figure', 'figcaption', 'details', 'summary']
    // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-useless-lazy
    const blockTagRegex = new RegExp(`^<\\/?(?:${blockTags.join('|')})(?:\\s+[^>]*?)?>`, 'i')

    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i]

      if (token.type === 'inline' && token.children && token.children.length > 0) {
        const children = token.children

        let firstToken = null
        for (let j = 0; j < children.length; j++) {
          if (children[j].type !== 'text' || children[j].content.trim() !== '') {
            firstToken = children[j]
            break
          }
        }

        let lastToken = null
        for (let j = children.length - 1; j >= 0; j--) {
          if (children[j].type !== 'text' || children[j].content.trim() !== '') {
            lastToken = children[j]
            break
          }
        }

        const isFullHtmlBlock = firstToken && firstToken.type === 'html_inline' && blockTagRegex.test(firstToken.content.trim())
          && lastToken && lastToken.type === 'html_inline' && blockTagRegex.test(lastToken.content.trim())

        if (isFullHtmlBlock) {
          for (let j = 0; j < children.length; j++) {
            if (children[j].type === 'softbreak') {
              children[j].type = 'text'
              children[j].content = '\n'
            }
          }

          if (i > 0 && state.tokens[i - 1].type === 'paragraph_open') {
            state.tokens[i - 1].hidden = true
          }
          if (i < state.tokens.length - 1 && state.tokens[i + 1].type === 'paragraph_close') {
            state.tokens[i + 1].hidden = true
          }
          continue
        }

        for (let j = 0; j < children.length; j++) {
          if (children[j].type === 'softbreak') {
            let prevHtml = false
            for (let k = j - 1; k >= 0; k--) {
              const prev = children[k]
              if (prev.type === 'html_inline') {
                if (blockTagRegex.test(prev.content.trim()))
                  prevHtml = true
                break
              }
              if (prev.type !== 'text' || prev.content.trim() !== '')
                break
            }

            let nextHtml = false
            for (let k = j + 1; k < children.length; k++) {
              const next = children[k]
              if (next.type === 'html_inline') {
                if (blockTagRegex.test(next.content.trim()))
                  nextHtml = true
                break
              }
              if (next.type !== 'text' || next.content.trim() !== '')
                break
            }

            if (prevHtml || nextHtml) {
              children[j].type = 'text'
              children[j].content = '\n'
            }
          }
        }
      }
    }
  })
}

export async function createMarkdownRenderer(params: CreateMarkdownRendererParams): Promise<MarkdownIt> {
  const { imageBasePath, shikiTheme, onHighlightNeeded } = params
  const highlighter = await getHighlighter()
  const requestedLangs = new Set<string>()

  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      if (!lang)
        return `<pre class="shiki-fallback"><code>${md.utils.escapeHtml(str)}</code></pre>`

      if (lang === 'mermaid') {
        return `<pre class="mermaid" style="all:unset; display:flex; justify-content:center; margin: 1.5rem 0; overflow-x:auto;">${md.utils.escapeHtml(str)}</pre>`
      }

      if (lang === 'd2') {
        try {
          const data = new TextEncoder().encode(str)
          const compressed = pako.deflate(data, { level: 9 })
          let binaryString = ''
          for (let i = 0; i < compressed.length; i++) {
            binaryString += String.fromCharCode(compressed[i])
          }
          const encoded = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
          const imgUrl = `https://kroki.io/d2/svg/${encoded}`

          const safeRaw = md.utils.escapeHtml(str)

          return `<pre class="d2-wrapper" style="all:unset;display:block;"><div class="d2-diagram-wrapper" style="text-align: center; margin: 1rem 0;"><img src="${imgUrl}" class="d2-diagram" data-raw="${safeRaw}" alt="D2 Diagram" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></div></pre>`
        }
        catch (e) {
          console.error('Ошибка при генерации D2:', e)
        }
      }

      if (!highlighter.getLoadedLanguages().includes(lang)) {
        if (!requestedLangs.has(lang)) {
          requestedLangs.add(lang)
          highlighter.loadLanguage(lang as any).then(() => {
            onHighlightNeeded()
          }).catch((err) => {
            console.warn(`[Shiki] Не удалось загрузить язык: ${lang}`, err)
          })
        }
        return `<pre class="shiki-loading"><code>${md.utils.escapeHtml(str)}</code></pre>`
      }

      try {
        return highlighter.codeToHtml(str, { lang, theme: shikiTheme })
      }
      catch (error) {
        console.error(`Shiki highlighting error for lang ${lang}:`, error)
        return `<pre class="shiki-fallback"><code>${md.utils.escapeHtml(str)}</code></pre>`
      }
    },
  })

  md.disable('code')

  md.renderer.rules.table_open = (tokens, idx, options, _env, self) => {
    return `<div class="table-container">${self.renderToken(tokens, idx, options)}`
  }
  md.renderer.rules.table_close = (tokens, idx, options, _env, self) => {
    return `${self.renderToken(tokens, idx, options)}</div>`
  }

  md.use(cleanHtmlBreaksPlugin)
    .use(markdownItWikiImages, { baseURL: imageBasePath, defaultAlt: '' })
    .use(markdownItWikiLinks)
    .use(MarkdownItObsidianCallouts)
    .use(MarkdownItAttrs)
    .use(MarkdownItCollapsible)

  return md
}
