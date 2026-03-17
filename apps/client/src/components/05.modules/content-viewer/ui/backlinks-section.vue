<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useContentViewerStore } from '../store'

const store = useContentViewerStore()
const links = computed(() => store.currentBacklinks)
const route = useRoute()
</script>

<template>
  <div v-if="links.length > 0" class="backlinks-section">
    <div class="backlinks-title">
      <Icon icon="mdi:link-variant" class="icon" />
      <span>Ссылки сюда</span>
    </div>

    <div class="backlinks-grid">
      <NuxtLink
        v-for="link in links"
        :key="link.url"
        :to="link.url"
        class="backlink-card"
      >
        <span class="link-title">{{ link.title }}</span>
        <span class="link-path">{{ link.url.replace(`/${route.params.vault}`, '') }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.backlinks-section {
  margin-top: 60px;
  padding-top: 24px;
  border-top: 1px dashed var(--border-secondary-color);
}

.backlinks-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--fg-muted-color);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  .icon {
    font-size: 1.1rem;
  }
}

.backlinks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.backlink-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--bg-secondary-color);
  border: 1px solid transparent;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-hover-color);
    border-color: var(--border-primary-color);
    transform: translateY(-2px);
    box-shadow: var(--s-s);
  }
}

.link-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--fg-primary-color);
  margin-bottom: 4px;
}

.link-path {
  font-size: 0.75rem;
  color: var(--fg-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Maple Mono CN', monospace;
}
</style>
