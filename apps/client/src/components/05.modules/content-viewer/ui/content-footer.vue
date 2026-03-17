<script lang="ts" setup>
import type { ContentNavItem } from '~/components/05.modules/content-viewer'
import { KitBtn } from '~/components/01.kit'
import { flattenNavItems } from '../lib/navigation'

interface Props {
  items: ContentNavItem[] | null
  vault: string
  currentItemPath: string
}

const props = defineProps<Props>()

const navigableItems = computed(() => flattenNavItems(props.items || []))

const currentIndex = computed(() => {
  return navigableItems.value.findIndex(item => item.path === props.currentItemPath || item.path === 'index')
})

const previousItem = computed(() => currentIndex.value > 0 ? navigableItems.value[currentIndex.value - 1] : undefined)
const nextItem = computed(() => (currentIndex.value !== -1 && currentIndex.value < navigableItems.value.length - 1) ? navigableItems.value[currentIndex.value + 1] : undefined)
</script>

<template>
  <div class="content-footer">
    <KitBtn
      v-if="previousItem"
      variant="tonal"
      color="secondary"
      prepend-icon="mdi:arrow-left"
      class="footer-btn"
      @click="navigateTo(`/${vault}/${previousItem.path}`)"
    >
      {{ previousItem.title }}
    </KitBtn>

    <div class="spacer" />

    <KitBtn
      v-if="nextItem"
      variant="tonal"
      color="secondary"
      append-icon="mdi:arrow-right"
      class="footer-btn"
      @click="navigateTo(`/${vault}/${nextItem.path}`)"
    >
      {{ nextItem.title }}
    </KitBtn>
  </div>
</template>

<style lang="scss" scoped>
.content-footer {
  display: flex;
  gap: 4px;
  padding: 32px 20px;
  border-top: 1px solid var(--border-secondary-color);
  max-width: 900px;
  margin: 0 auto;
  width: 100%;

  @include mobile {
    padding: 16px 8px;
  }
}

.spacer {
  flex: 1;
}

.footer-btn {
  min-width: 150px;
  max-width: 45%;
}

@include mobile {
  .content-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .footer-btn {
    max-width: 100%;
  }
}
</style>
