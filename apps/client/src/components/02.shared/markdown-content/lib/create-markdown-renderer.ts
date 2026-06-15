/* eslint-disable e18e/prefer-static-regex */
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

export async function createMarkdownRenderer(params: CreateMarkdownRendererParams): Promise<MarkdownIt> {
  const { imageBasePath, shikiTheme, onHighlightNeeded } = params
  const highlighter = await getHighlighter()

  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      if (!lang)
        return `<pre class="shiki-fallback"><code>${md.utils.escapeHtml(str)}</code></pre>`

      if (!highlighter.getLoadedLanguages().includes(lang)) {
        highlighter.loadLanguage(lang as any).then(() => {
          onHighlightNeeded()
        }).catch((err) => {
          console.warn(`[Shiki] Не удалось загрузить язык: ${lang}`, err)
        })

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

  const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const lang = token.info ? token.info.trim().split(/\s+/)[0] : ''

    if (lang === 'mermaid') {
      return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>\n`
    }

    if (lang === 'd2') {
      try {
        const data = new TextEncoder().encode(token.content)
        const compressed = pako.deflate(data, { level: 9 })
        let binaryString = ''
        for (let i = 0; i < compressed.length; i++) {
          binaryString += String.fromCharCode(compressed[i])
        }
        const encoded = btoa(binaryString)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')

        const krokiUrl = 'https://kroki.io'
        const imgUrl = `${krokiUrl}/d2/svg/${encoded}`

        return `<div class="d2-diagram-wrapper" style="text-align: center; margin: 1rem 0;">\n<img src="${imgUrl}" alt="D2 Diagram" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />\n</div>\n`
      }
      catch (e) {
        console.error('Ошибка при генерации D2:', e)
      }
    }

    return defaultFence(tokens, idx, options, env, slf)
  }

  md.renderer.rules.table_open = (tokens, idx, options, _env, self) => {
    return `<div class="table-container">${self.renderToken(tokens, idx, options)}`
  }
  md.renderer.rules.table_close = (tokens, idx, options, _env, self) => {
    return `${self.renderToken(tokens, idx, options)}</div>`
  }

  md.use(markdownItWikiImages, { baseURL: imageBasePath, defaultAlt: '' })
    .use(markdownItWikiLinks)
    .use(MarkdownItObsidianCallouts)
    .use(MarkdownItAttrs)
    .use(MarkdownItCollapsible)

  return md
}
