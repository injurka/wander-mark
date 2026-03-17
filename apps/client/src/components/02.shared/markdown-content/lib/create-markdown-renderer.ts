import type { Highlighter } from 'shiki'
import catppuccinFrappe from '@shikijs/themes/catppuccin-frappe'
import catppuccinLatte from '@shikijs/themes/catppuccin-latte'
import catppuccinMacchiato from '@shikijs/themes/catppuccin-macchiato'
import catppuccinMocha from '@shikijs/themes/catppuccin-mocha'
import MarkdownIt from 'markdown-it'
import MarkdownItAttrs from 'markdown-it-attrs'
import MarkdownItCollapsible from 'markdown-it-collapsible'
// @ts-expect-error no dts
import MarkdownItObsidianCallouts from 'markdown-it-obsidian-callouts'
import { createHighlighter } from 'shiki'
import { markdownItWikiImages } from './markdownIt-wiki-images'
import { markdownItWikiLinks } from './markdownIt-wiki-links'

interface CreateMarkdownRendererParams {
  imageBasePath: string
  shikiTheme: string
}

let cachedHighlighter: Highlighter | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (cachedHighlighter)
    return cachedHighlighter

  cachedHighlighter = await createHighlighter({
    themes: [catppuccinMocha, catppuccinMacchiato, catppuccinFrappe, catppuccinLatte],
    langs: ['c++', 'ql', 'javascript', 'typescript', 'html', 'css', 'scss', 'json', 'bash', 'python', 'vue', 'markdown', 'go', 'rust', 'yaml', 'shell'],
  })

  return cachedHighlighter
}

export async function createMarkdownRenderer(params: CreateMarkdownRendererParams): Promise<MarkdownIt> {
  const { imageBasePath, shikiTheme } = params

  const highlighter = await getHighlighter()

  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      if (!lang || !highlighter.getLoadedLanguages().includes(lang)) {
        return `<pre class="shiki-fallback"><code>${md.utils.escapeHtml(str)}</code></pre>`
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

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return `<div class="table-container">${self.renderToken(tokens, idx, options)}`
  }

  md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    return `${self.renderToken(tokens, idx, options)}</div>`
  }

  md
    .use(markdownItWikiImages, { baseURL: imageBasePath, defaultAlt: '' })
    .use(markdownItWikiLinks)
    .use(MarkdownItObsidianCallouts)
    .use(MarkdownItAttrs)
    .use(MarkdownItCollapsible)

  return md
}
