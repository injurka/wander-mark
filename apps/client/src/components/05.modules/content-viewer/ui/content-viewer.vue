<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { MarkdownContent } from '~/components/02.shared/markdown-content'
import { useContentViewerStore } from '../store'
import BacklinksSection from './backlinks-section.vue'

interface Props {
  content: string
  imageBasePath: string
}
defineProps<Props>()

const store = useContentViewerStore()
const { t, locale } = useI18n()

const meta = computed(() => store.activeItem?.meta)

const formattedDate = computed(() => {
  if (!meta.value?.lastModified)
    return ''
  try {
    return new Date(meta.value.lastModified).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  catch {
    return ''
  }
})

function getMinString(n: number) {
  if (locale.value === 'ru') {
    if (n % 10 === 1 && n % 100 !== 11)
      return 'минута'
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100))
      return 'минуты'
    return 'минут'
  }
  else if (locale.value === 'en') {
    return n === 1 ? 'minute' : 'minutes'
  }
  else {
    return '分钟'
  }
}
</script>

<template>
  <div class="content-viewer">
    <div class="markdown-body-wrapper">
      <!-- Блок метаданных -->
      <div v-if="meta" class="content-meta">
        <div v-if="meta.readingTime" class="meta-item" :title="t('contentViewer.readingTime')">
          <Icon icon="mdi:clock-outline" class="meta-icon" />
          <span>{{ meta.readingTime }} {{ getMinString(meta.readingTime) }}</span>
        </div>

        <div v-if="meta.words" class="meta-item" :title="t('contentViewer.wordCount')">
          <Icon icon="mdi:file-document-outline" class="meta-icon" />
          <span>{{ meta.words }} {{ t('contentViewer.words') }}</span>
        </div>

        <div v-if="formattedDate" class="meta-item" :title="t('contentViewer.lastModified')">
          <Icon icon="mdi:calendar-blank-outline" class="meta-icon" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>

      <!-- Контент -->
      <MarkdownContent
        :content="content"
        :image-base-path="imageBasePath"
      />

      <!-- Обратные ссылки -->
      <BacklinksSection />
    </div>
  </div>
</template>

<style lang="scss">
.content-viewer {
  margin: 0 auto;
  width: 1200px;
  max-width: 100%;
}

.markdown-body-wrapper {
  padding: 20px;
  background-color: var(--bg-primary-color);

  @include media-down(md) {
    padding: 8px;
  }
}

.content-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .meta-icon {
    font-size: 1.1rem;
    color: var(--fg-muted-color);
  }

  @include media-down(md) {
    gap: 12px;
    font-size: 0.8rem;
    margin-bottom: 16px;
    padding-bottom: 8px;
  }
}
</style>
