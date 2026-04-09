<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { KitBtn } from '~/components/01.kit'
import { useContentViewerStore } from '~/components/05.modules/content-viewer'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'

const store = useContentViewerStore()
const router = useRouter()
const { t, locale } = useI18n()
const params = useTypedRouteParams()

// Используем готовую логику из хранилища
const allFiles = computed(() => store.recentFiles)

const groupedFiles = computed(() => {
  const groups: { dateStr: string, files: typeof allFiles.value }[] = []

  const dateFormatter = new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  allFiles.value.forEach((file) => {
    const d = new Date(file.meta!.lastModified)
    let dateStr = dateFormatter.format(d)
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

    const lastGroup = groups.at(-1)
    if (lastGroup && lastGroup.dateStr === dateStr) {
      lastGroup.files.push(file)
    }
    else {
      groups.push({ dateStr, files: [file] })
    }
  })

  return groups
})

function navigateTo(path: string) {
  router.push(`/${params.value.vault}/${path}`)
}

function getPathSegments(path: string): string[] {
  const parts = path.split('/')
  return parts.length > 1 ? parts.slice(0, -1) : []
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="recent-page custom-scrollbar">
    <header class="page-header">
      <KitBtn variant="tonal" color="secondary" size="md" icon="mdi:arrow-left" @click="router.back()" />
      <div class="title-group">
        <h1 class="page-title">
          {{ t('vaultIndex.historyTitle') }}
        </h1>
        <span class="subtitle">{{ allFiles.length }} {{ t('vaultIndex.items') }}</span>
      </div>
    </header>

    <div class="history-container">
      <div v-if="groupedFiles.length === 0" class="empty-state">
        <Icon icon="mdi:history" class="empty-icon" />
        <p>История изменений пуста</p>
      </div>

      <div v-for="group in groupedFiles" :key="group.dateStr" class="day-group">
        <h2 class="day-title">
          {{ group.dateStr }}
        </h2>

        <div class="history-list">
          <div
            v-for="file in group.files"
            :key="file.path"
            class="history-item"
            @click="navigateTo(file.path)"
          >
            <div class="item-icon-wrapper">
              <Icon icon="mdi:file-document-edit-outline" class="item-icon" />
            </div>

            <div class="item-content">
              <span class="file-name" :title="file.title">{{ file.title }}</span>

              <div v-if="getPathSegments(file.path).length > 0" class="file-path">
                <span v-for="(segment, index) in getPathSegments(file.path)" :key="index" class="path-segment">
                  {{ segment }}
                  <Icon v-if="index < getPathSegments(file.path).length - 1" icon="mdi:chevron-right" class="path-separator" />
                </span>
              </div>
            </div>

            <div class="item-meta">
              <div class="time-block">
                {{ formatTime(file.meta!.lastModified) }}
              </div>
              <div v-if="file.meta?.readingTime" class="read-time-block" :title="`${file.meta.readingTime} ${t('vaultIndex.min')}`">
                <Icon icon="mdi:clock-fast" />
                <span>{{ file.meta.readingTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recent-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 80px;

  @include media-down(md) {
    padding: 20px 12px 40px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}

.title-group {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  margin: 0;
  line-height: 1.1;

  @include media-down(md) {
    font-size: 1.6rem;
  }
}

.subtitle {
  font-size: 0.9rem;
  color: var(--fg-muted-color);
  margin-top: 4px;
}

.history-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--fg-muted-color);

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
    margin-bottom: 12px;
  }
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  margin: 0;
  background-color: rgba(var(--bg-primary-color-rgb), 0.9);
  backdrop-filter: blur(8px);
  padding: 8px 0;
  z-index: 10;
  border-bottom: 1px solid var(--border-secondary-color);
}

.history-list {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary-color);
  border-radius: 12px;
  border: 1px solid var(--border-secondary-color);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--border-secondary-color);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--bg-hover-color);
  }

  @include media-down(sm) {
    padding: 12px;
    gap: 12px;
  }
}

.item-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: var(--bg-tertiary-color);
  color: var(--fg-accent-color);
  flex-shrink: 0;

  .item-icon {
    font-size: 1.4rem;
  }

  @include media-down(sm) {
    width: 32px;
    height: 32px;

    .item-icon {
      font-size: 1.1rem;
    }
  }
}

.item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @include media-down(sm) {
    font-size: 0.95rem;
  }
}

.file-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

.path-segment {
  display: inline-flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--fg-muted-color);
  font-family: 'Maple Mono CN', sans-serif;

  .path-separator {
    margin: 0 2px;
    font-size: 1rem;
    opacity: 0.6;
  }
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.time-block {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--fg-secondary-color);
  font-family: 'Maple Mono CN', monospace;
}

.read-time-block {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  background-color: var(--bg-primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-secondary-color);
}
</style>
