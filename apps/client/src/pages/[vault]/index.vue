<script setup lang="ts">
import type { ContentNavItem } from '~/components/05.modules/content-viewer'
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { KitBtn } from '~/components/01.kit'
import { PluginSlot } from '~/components/02.shared/plugins'
import { usePluginStore } from '~/components/02.shared/plugins/store'
import { ContentNavItemType, useContentViewerStore } from '~/components/05.modules/content-viewer'
import { flattenNavItems } from '~/components/05.modules/content-viewer/lib/navigation'
import { useTypedRouteParams } from '~/shared/composables/use-typed-route'

const store = useContentViewerStore()
const pluginStore = usePluginStore()
const params = useTypedRouteParams()
const router = useRouter()
const { t } = useI18n()

const title = computed(() => store.vaultSettings?.info?.title || params.value.vault)
const description = computed(() => store.vaultSettings?.info?.description || t('vaultIndex.defaultDesc'))

const rootSections = computed(() => {
  return (store.navItems || []).filter((item: ContentNavItem) => item.type === ContentNavItemType.Directory)
})

const recentFiles = computed(() => {
  const allFiles = flattenNavItems(store.navItems || []).filter(item => item.type === ContentNavItemType.File)
  return allFiles
    .filter(item => item.meta?.lastModified)
    .sort((a, b) => new Date(b.meta!.lastModified).getTime() - new Date(a.meta!.lastModified).getTime())
    .slice(0, 10)
})

function navigateTo(path: string) {
  router.push(`/${params.value.vault}/${path}`)
}

function navigateToPlugin(pluginId: string) {
  router.push(`/${params.value.vault}/plugin/${pluginId}`)
}

function getFirstFile(section: ContentNavItem): string | null {
  const flat = flattenNavItems([section])
  return flat.length > 0 ? flat[0].path : null
}

function handleSectionClick(section: ContentNavItem) {
  const path = getFirstFile(section)
  if (path) {
    navigateTo(path)
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr)
    return ''
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }
  catch {
    return ''
  }
}
</script>

<template>
  <div class="vault-index-page custom-scrollbar">
    <div class="hero-header">
      <div class="hero-icon">
        <Icon icon="mdi:book-open-page-variant" />
      </div>
      <div class="hero-content">
        <h1 class="vault-title">
          {{ title }}
        </h1>
        <p class="vault-desc">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="content-stack">
      <section v-if="rootSections.length > 0" class="index-section">
        <h2 class="section-title">
          <Icon icon="mdi:folder-outline" class="mr-2" />
          {{ t('vaultIndex.sections') }}
        </h2>
        <div class="sections-grid">
          <div
            v-for="section in rootSections"
            :key="section.sysname"
            class="section-card"
            @click="handleSectionClick(section)"
          >
            <Icon icon="mdi:folder" class="section-icon" />
            <div class="section-info">
              <span class="section-name" :title="section.title">{{ section.title }}</span>
              <span v-if="section.children" class="section-count">{{ section.children.length }} {{ t('vaultIndex.items') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="recentFiles.length > 0" class="index-section">
        <h2 class="section-title">
          <Icon icon="mdi:clock-outline" class="mr-2" />
          {{ t('vaultIndex.recentChanges') }}
        </h2>
        <div class="recent-list">
          <div
            v-for="file in recentFiles"
            :key="file.path"
            class="recent-item"
            @click="navigateTo(file.path)"
          >
            <div class="file-info">
              <Icon icon="mdi:file-document-outline" class="file-icon" />
              <span class="file-name" :title="file.title">{{ file.title }}</span>
            </div>
            <div class="file-meta">
              <span v-if="file.meta?.readingTime" class="meta-tag">
                <Icon icon="mdi:clock-fast" /> {{ file.meta.readingTime }} {{ t('vaultIndex.min') }}
              </span>
              <span class="meta-date">{{ formatDate(file.meta?.lastModified) }}</span>
            </div>
          </div>
        </div>

        <div class="recent-actions">
          <KitBtn variant="tonal" color="secondary" size="md" @click="navigateTo('recent')">
            {{ t('vaultIndex.readMore') }}
          </KitBtn>
        </div>
      </section>

      <section class="index-section">
        <h2 class="section-title">
          <Icon icon="mdi:puzzle-outline" class="mr-2" />
          {{ t('vaultIndex.plugins') }}
        </h2>

        <div class="plugins-slot-wrapper">
          <PluginSlot name="vault-index" />
        </div>

        <div class="plugins-list">
          <div v-if="pluginStore.enabledPlugins.length === 0" class="empty-plugins">
            {{ t('vaultIndex.noActivePlugins') }}
          </div>
          <div
            v-for="plugin in pluginStore.enabledPlugins"
            :key="plugin.id"
            class="plugin-card"
            @click="navigateToPlugin(plugin.id)"
          >
            <Icon :icon="plugin.icon || 'mdi:puzzle'" class="plugin-icon" />
            <div class="plugin-details">
              <span class="plugin-name">{{ plugin.name }}</span>
              <span v-if="plugin.description" class="plugin-desc">{{ plugin.description }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vault-index-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;

  @include media-down(md) {
    padding: 20px 12px;
  }
}

.hero-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-secondary-color);

  @include media-down(md) {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    margin-bottom: 32px;
  }
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(var(--fg-accent-color-rgb), 0.2), rgba(var(--fg-accent-color-rgb), 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--fg-accent-color);
  flex-shrink: 0;
}

.hero-content {
  flex: 1;
}

.vault-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--fg-primary-color);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.vault-desc {
  font-size: 1.1rem;
  color: var(--fg-secondary-color);
  margin: 0;
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.index-section {
  background-color: transparent;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--fg-primary-color);
  margin: 0 0 16px 0;

  .mr-2 {
    margin-right: 8px;
    color: var(--fg-accent-color);
  }
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.section-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-hover-color);
    border-color: var(--fg-accent-color);
    transform: translateY(-2px);
  }
}

.section-icon {
  font-size: 2rem;
  color: var(--fg-muted-color);
  transition: color 0.2s;
  flex-shrink: 0;

  .section-card:hover & {
    color: var(--fg-accent-color);
  }
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.section-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--fg-primary-color);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.section-count {
  font-size: 0.8rem;
  color: var(--fg-muted-color);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: var(--bg-secondary-color);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    background-color: var(--bg-hover-color);
    border-color: var(--border-secondary-color);
  }

  @include media-down(sm) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.2rem;
  color: var(--fg-muted-color);
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  color: var(--fg-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  flex: 1;
  min-width: 0;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--fg-secondary-color);
  background-color: var(--bg-tertiary-color);
  padding: 2px 8px;
  border-radius: 4px;
}

.meta-date {
  font-size: 0.85rem;
  color: var(--fg-muted-color);
}

.recent-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.plugins-slot-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.plugins-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.plugin-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: var(--bg-hover-color);
    border-color: var(--fg-accent-color);
    transform: translateY(-2px);
  }
}

.plugin-icon {
  font-size: 1.8rem;
  color: var(--fg-accent-color);
  margin-top: 2px;
  flex-shrink: 0;
}

.plugin-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.plugin-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--fg-primary-color);
}

.plugin-desc {
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  line-height: 1.4;
}

.empty-plugins {
  grid-column: 1 / -1;
  padding: 24px;
  text-align: center;
  color: var(--fg-muted-color);
  font-size: 0.95rem;
  background-color: var(--bg-secondary-color);
  border-radius: 12px;
  border: 1px dashed var(--border-secondary-color);
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-color);
    border-radius: 4px;
  }
}
</style>
