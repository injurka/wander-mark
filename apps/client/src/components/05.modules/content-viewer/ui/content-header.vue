<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { KitBtn } from '~/components/01.kit'
import ViewerSettingsMenu from './viewer-settings-menu.vue'

interface Props {
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'openSearch'): void
}>()
const menu = defineModel('menu', { required: true })

const route = useRoute()

const breadcrumbsTrackRef = ref<HTMLElement | null>(null)

const breadcrumbs = computed(() => {
  const vault = route.params.vault as string
  const pwd = (Array.isArray(route.params.pwd) ? route.params.pwd : [route.params.pwd].filter(Boolean)) as string[]

  let currentPath = `/${vault}`
  const items = [] as {
    title: string
    to: string
    disabled: boolean
  }[]

  pwd.forEach((segment, index) => {
    currentPath += `/${segment}`
    items.push({ title: segment, to: currentPath, disabled: index === pwd.length - 1 })
  })

  return items
})

watch(
  () => route.path,
  async () => {
    await nextTick()
    if (breadcrumbsTrackRef.value) {
      breadcrumbsTrackRef.value.scrollLeft = breadcrumbsTrackRef.value.scrollWidth
    }
  },
  { immediate: true },
)

const currentVault = computed(() => route.params.vault as string)
</script>

<template>
  <header class="content-header" :class="{ 'is-hidden': !visible }">
    <div class="header-left">
      <KitBtn
        variant="text"
        size="sm"
        :icon="menu ? 'mdi:arrow-left' : 'mdi:menu'"
        class="menu-btn flex-shrink-0"
        @click="menu = !menu"
      />

      <nav class="breadcrumbs">
        <div ref="breadcrumbsTrackRef" class="breadcrumb-track">
          <template v-for="(item, i) in breadcrumbs" :key="i">
            <Icon v-if="i > 0" icon="mdi:chevron-right" size="14" class="separator" />
            <span
              class="breadcrumb-item"
              :class="{ 'is-active': item.disabled }"
            >

              <span>{{ item.title }}</span>
            </span>
          </template>
        </div>
      </nav>
    </div>

    <div class="header-right flex-shrink-0">
      <KitBtn
        variant="text"
        size="sm"
        icon="mdi:magnify"
        title="Поиск (Ctrl+K)"
        @click="emit('openSearch')"
      />

      <ViewerSettingsMenu :vault="currentVault" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.content-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  border-bottom: 1px solid var(--border-secondary-color);
  background-color: rgba(var(--bg-header-color), 0.85);
  backdrop-filter: blur(12px);
  z-index: 10;
  gap: 16px;
  flex-shrink: 0;

  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;

  &.is-hidden {
    transform: translateY(-100%);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.menu-btn {
  margin-right: 0;
}

.breadcrumbs {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(90deg, black 85%, transparent 100%);
}

.breadcrumb-track {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  padding-right: 20px;
}

.separator {
  color: var(--fg-muted-color);
  margin: 0 4px;
  flex-shrink: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--fg-secondary-color);
  background-color: transparent;
  transition: all 0.2s ease;
  font-weight: 500;
  flex-shrink: 0;

  &.is-active {
    background-color: var(--bg-secondary-color);
    color: var(--fg-primary-color);
    pointer-events: none;
    border: 1px solid var(--border-secondary-color);
  }
}

.breadcrumb-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--fg-primary-color);
  }
}

@include mobile {
  .content-header {
    padding: 0 12px;
    gap: 8px;
  }

  .breadcrumb-item {
    font-size: 0.8rem;
    padding: 2px 6px;
  }
}
</style>
