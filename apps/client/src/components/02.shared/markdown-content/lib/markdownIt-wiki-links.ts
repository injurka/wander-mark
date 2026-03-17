import type MarkdownIt from 'markdown-it'

function markdownItWikiLinks(md: MarkdownIt) {
  const originalParse = md.parse

  md.parse = function (src, env) {
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    src = src.replace(/\[([^\]]+)\]\(\s*\/\s*((?:[^()]|\([^()]*\))*)\)/g, (_match, text, path) => {
      const cleanPath = path.trim()
      return `<a href="/${cleanPath}">${text}</a>`
    })

    return originalParse.call(this, src, env)
  }
}

export { markdownItWikiLinks }
