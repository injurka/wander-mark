<script setup lang="ts">
import type MarkdownIt from 'markdown-it'
import { PageLoader } from '~/components/02.shared/page-loader'
import { ThemesVariant, useChangeTheme } from '~/shared/composables/use-change-theme'
import { useHanziDetection } from '../composables/use-hanzi-detection'
import { createMarkdownRenderer } from '../lib'
import HanziTooltip from './hanzi-tooltip.vue'
import { useVaultService } from '~/shared/services/vault.service'
import { useRouter } from 'vue-router'

interface Props {
  content: string
  imageBasePath: string
  vault?: string
}

const props = defineProps<Props>()
const { theme } = useChangeTheme()
const vaultService = useVaultService()
const { getHanziFromEvent } = useHanziDetection()
const router = useRouter()

const renderedContent = ref<string>('')
const mdInstance = ref<MarkdownIt | null>(null)
const isLoading = ref<boolean>(true)
const currentImages = ref<string[]>([])

const hanziTooltipRef = ref<InstanceType<typeof HanziTooltip> | null>(null)

const shikiTheme = computed(() => {
  return theme.value === ThemesVariant.Light ? 'catppuccin-latte' : 'catppuccin-mocha'
})

async function initRenderer() {
  try {
    mdInstance.value = await createMarkdownRenderer({
      imageBasePath: props.imageBasePath,
      shikiTheme: shikiTheme.value,
    })
  }
  catch (error) {
    console.error('Failed to create markdown renderer:', error)
  }
  finally {
    isLoading.value = false
  }
}

watch(
  [() => props.content, mdInstance],
  async ([newContent, md]) => {
    if (md && newContent) {
      let html = md.render(newContent)
      html = html.replace(/<img([^>]*)src="([^"]*)"/g, '<img$1data-src="$2"')
      renderedContent.value = html
      
      await nextTick()
      const wrapper = document.querySelector('.markdown-body')
      if (wrapper && props.vault) {
        const images = wrapper.querySelectorAll('img[data-src]') as NodeListOf<HTMLImageElement>
        for (const img of images) {
          const originalSrc = img.getAttribute('data-src')
          
          if (originalSrc && !originalSrc.startsWith('http') && !originalSrc.startsWith('data:')) {
            const decodedSrc = decodeURIComponent(originalSrc)
            
            // Если путь начинается с /images/ (как бывает в Obsidian), убираем слэш,
            // иначе считаем, что картинка лежит внутри папки content/Vault/...
            const mediaPath = decodedSrc.startsWith('images/') || decodedSrc.startsWith('/images/')
              ? decodedSrc.replace(/^\//, '')
              : `content/${props.vault}/${decodedSrc}`

            img.src = await vaultService.resolveMediaUrl(props.vault, mediaPath)
          } else if (originalSrc) {
             img.src = originalSrc
          }
        }
      }
    } else {
      renderedContent.value = ''
    }
  },
)

watch(shikiTheme, async () => {
  await initRenderer()
})

onMounted(() => {
  initRenderer()
})

function openImageViewer() {
  console.log('Open image viewer with:', currentImages.value)
}

function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const hanziPhrase = getHanziFromEvent(event)

  if (hanziPhrase) {
    hanziTooltipRef.value?.open(event.clientX, event.clientY, hanziPhrase)
    event.preventDefault()
    event.stopPropagation()
    return
  }

  hanziTooltipRef.value?.close()

  const link = target.closest('a')
  if (link && link.getAttribute('href')?.startsWith('/')) {
    event.preventDefault()
    const href = link.getAttribute('href')
    if (href) {
      router.push(href)
    }
    return
  }

  if (target.tagName === 'IMG') {
    const img = target as HTMLImageElement
    if (target.closest('.callout-content') || target.closest('.markdown-body')) {
      event.stopPropagation()
      const container = event.currentTarget as HTMLElement
      const allImages = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
      const imageUrls = allImages.map(el => el.src)
      const clickedUrl = img.src
      currentImages.value =[clickedUrl, ...imageUrls.filter(url => url !== clickedUrl)]
      openImageViewer()
    }
  }
}
</script>

<template>
  <PageLoader v-if="isLoading" />
  <div v-else class="markdown-wrapper">
    <HanziTooltip ref="hanziTooltipRef" />
    <div
      class="markdown-body"
      @click="handleContentClick"
      v-html="renderedContent"
    />
  </div>
</template>

<style lang="scss">
.markdown-body {
  line-height: 1.7;
  color: var(--fg-primary-color);
  font-size: 1.05rem;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--fg-primary-color);
  }
  h1 {
    font-size: 2rem;
    border-bottom: 1px solid var(--border-secondary-color);
    padding-bottom: 0.5rem;
  }
  h2 {
    font-size: 1.5rem;
    border: none;
    border-left: 4px solid var(--fg-accent-color);
    background: linear-gradient(90deg, rgba(var(--bg-accent-color-rgb), 0.5) 0%, transparent 100%);
    padding: 0.5rem 1rem;
    border-radius: 0 8px 8px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h3 {
    font-size: 1.25rem;
    border: none;
    border-bottom: 2px solid var(--border-secondary-color);
    padding-bottom: 0.3rem;
    width: fit-content;
    padding-right: 20px;
  }
  p {
    margin-bottom: 1.2rem;
  }
  p + ul {
    padding-top: 0;
  }
  strong {
    color: var(--fg-primary-color);
    font-weight: 700;
  }
  a {
    color: var(--fg-accent-color);
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid rgba(var(--fg-accent-color-rgb), 0.4);
    transition: all 0.2s ease-in-out;
    &:hover {
      background-color: rgba(var(--fg-accent-color-rgb), 0.1);
      border-bottom-color: var(--fg-accent-color);
    }
  }
  em {
    color: var(--fg-accent-color);
    font-style: italic;
  }
  code:not(pre > code) {
    background-color: rgba(var(--fg-accent-color-rgb), 0.1);
    border: 1px solid rgba(var(--fg-accent-color-rgb), 0.2);
    color: var(--fg-accent-color);
    padding: 0.1em 0.4em;
    margin: 0 0.1em;
    font-size: 0.9em;
    border-radius: 6px;
    font-family: 'Maple Mono CN', 'JetBrains Mono', monospace;
    font-weight: 600;
    vertical-align: baseline;
    display: inline-block;
  }
  .shiki {
    padding: 10px;
    border-radius: 8px;
  }
  pre:not(.shiki) {
    background: var(--bg-tertiary-color);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    code {
      font-family: 'Maple Mono CN', 'JetBrains Mono', monospace;
      background: transparent;
      padding: 0;
      color: inherit;
      border: none;
    }
  }
  ul,
  ol {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
    > li {
      ul {
        margin: 0;
      }
    }
  }
  ul > li {
    list-style-type: disc;
    margin-bottom: 0.5rem;
    &::marker {
      color: var(--fg-accent-color);
    }
  }
  blockquote {
    border-left: 4px solid var(--fg-accent-color);
    background-color: var(--bg-secondary-color);
    padding: 1rem 1.5rem;
    border-radius: 0 8px 8px 0;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--fg-secondary-color);
    p {
      margin: 0;
    }
  }
  img {
    border-radius: 8px;
    max-width: 100%;
    height: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 1rem 0;
  }
  .table-container {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 2rem 0;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--border-secondary-color);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  th {
    background-color: var(--bg-tertiary-color);
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 2px solid var(--border-secondary-color);
  }
  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-secondary-color);
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background-color: var(--bg-hover-color);
  }

  /* Callouts */
  --co-bg-opacity: 0.08;
  --co-border-width: 4px;
  --co-radius: 8px;
  --co-note: 68, 138, 255;
  --co-info: 68, 138, 255;
  --co-tip: 0, 191, 165;
  --co-success: 76, 175, 80;
  --co-warning: 255, 152, 0;
  --co-danger: 229, 57, 53;
  --co-quote: 158, 158, 158;

  .callout {
    margin: 1.5rem 0;
    border-radius: var(--co-radius);
    background-color: rgba(var(--callout-color), var(--co-bg-opacity));
    border-left: var(--co-border-width) solid rgb(var(--callout-color));
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    --callout-color: var(--co-note);
  }
  .callout-title {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    color: rgb(var(--callout-color));
    background-color: rgba(var(--callout-color), 0.12);
    font-size: 1rem;
    border-bottom: 1px solid rgba(var(--callout-color), 0.1);
  }
  .callout-content {
    padding: 16px;
    p:empty {
      display: none;
    }
    p:has(br:only-child) {
      display: none;
    }
    p {
      margin: 8px 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    p:first-child {
      margin-top: 0;
    }
    ul {
      margin: 0;
    }
  }
  .callout-title-icon {
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
}
details.callout {
  & > summary.callout-title {
    cursor: pointer;
    list-style: none;
  }
  & > summary.callout-title::-webkit-details-marker {
    display: none;
    .callout-fold {
      margin-left: auto;
      transform: rotate(0deg);
      transition: transform 0.2s;
      opacity: 0.7;
    }
    &[open] .callout-fold {
      transform: rotate(90deg);
    }
  }
  & .callout[data-callout='abstract'],
  & .callout[data-callout='summary'],
  & .callout[data-callout='tldr'] {
    --callout-color: var(--co-tip);
  }
  & .callout[data-callout='info'] {
    --callout-color: var(--co-info);
  }
  & .callout[data-callout='todo'] {
    --callout-color: var(--co-note);
  }
  & .callout[data-callout='tip'],
  & .callout[data-callout='hint'],
  & .callout[data-callout='important'] {
    --callout-color: var(--co-tip);
  }
  & .callout[data-callout='success'],
  & .callout[data-callout='check'],
  & .callout[data-callout='done'] {
    --callout-color: var(--co-success);
  }
  & .callout[data-callout='question'],
  & .callout[data-callout='help'],
  & .callout[data-callout='faq'] {
    --callout-color: var(--co-warning);
  }
  & .callout[data-callout='warning'],
  & .callout[data-callout='caution'],
  & .callout[data-callout='attention'] {
    --callout-color: var(--co-warning);
  }
  & .callout[data-callout='failure'],
  & .callout[data-callout='fail'],
  & .callout[data-callout='missing'],
  & .callout[data-callout='danger'],
  & .callout[data-callout='error'] {
    --callout-color: var(--co-danger);
  }
  & .callout[data-callout='bug'] {
    --callout-color: var(--co-danger);
  }
  & .callout[data-callout='example'] {
    --callout-color: 124, 77, 255;
  }
  & .callout[data-callout='quote'],
  & .callout[data-callout='cite'] {
    --callout-color: var(--co-quote);
  }
}
.hero {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: rgba(115, 233, 144, 0.08);
  border: 1px solid rgba(115, 233, 144, 0.25);
  border-left: 4px solid rgba(142, 175, 151, 0.5);
  border-radius: 12px;
  padding: 16px 24px;
  margin: 2rem 0;
  position: relative;
  overflow: hidden;

  @include media-down(md) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
.hero .hanzi {
  font-family: 'Maple Mono CN', 'KaiTi', serif;
  font-size: 3.5rem;
  line-height: 1;
  font-weight: 500;
  color: #81bb8f;
  opacity: 1;
  margin-right: 24px;
  padding-right: 24px;
  border-right: 1px solid rgba(115, 233, 144, 0.3);
  flex-shrink: 0;
  @include media-down(md) {
    border-right: none;
    border-bottom: 1px solid rgba(115, 233, 144, 0.3);
    padding-right: 0;
    margin-right: 0;
    padding-bottom: 12px;
    width: 100%;
    text-align: center;
  }
}
.hero .meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}
.hero .meta h1 {
  margin: 0 !important;
  border: none !important;
  padding: 0 !important;
  background: none !important;
  font-size: 1.5rem;
  line-height: 1.2;
  color: var(--fg-primary-color);
  font-weight: 700;
  display: block;
}
.hero .meta .pinyin {
  font-size: 1.1rem;
  font-family: 'Maple Mono CN', monospace;
  color: #61b576;
  margin-top: 4px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.hero .meta .desc {
  font-size: 0.9rem;
  color: var(--fg-secondary-color);
  margin-top: 6px;
  line-height: 1.4;
}
</style>
