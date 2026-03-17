<script lang="ts" setup>
import type { ContentNavItem } from '~/components/05.modules/content-viewer'
import { useSwipe } from '@vueuse/core'
import { KitBtn, KitInput } from '~/components/01.kit'
import { findPathBySysname } from '../lib/navigation'
import NavigationTree from './navigation-tree.vue'

interface Props {
  items: ContentNavItem[] | null
  menu: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:menu'])
const menu = defineModel<boolean>('menu', { required: true })
const sidebarRef = ref<HTMLElement | null>(null)
const sidebarWidth = ref(300)
const resizing = ref(false)
const searchQuery = ref('')

const params = useTypedRouteParams()

useSwipe(sidebarRef, {
  passive: true,
  onSwipeEnd: (_, direction) => {
    if (props.menu && direction === 'left') {
      emit('update:menu', false)
    }
  },
})

async function selectItem(item: ContentNavItem) {
  const path = findPathBySysname(props.items || [], item.sysname)
  if (path) {
    if (window.innerWidth < 768) {
      menu.value = false
    }
    await navigateTo(`/${params.value.vault}/${path.join('/')}`)
  }
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  resizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

function handleMouseMove(e: MouseEvent) {
  if (!resizing.value)
    return
  sidebarWidth.value = Math.max(250, Math.min(600, e.clientX))
}

function stopResize() {
  resizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}
</script>

<template>
  <div
    v-if="menu"
    class="sidebar-scrim"
    @click="menu = false"
  />

  <aside
    ref="sidebarRef"
    class="sidebar-wrapper"
    :class="{ 'is-closed': !menu }"
    :style="{ width: menu ? `${sidebarWidth}px` : '0px' }"
  >
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <KitBtn
          variant="text"
          size="sm"
          icon="mdi:arrow-left"
          class="mobile-close-btn"
          @click="menu = false"
        />

        <KitInput
          v-model="searchQuery"
          variant="solo"
          placeholder="Поиск..."
          rounded
        />
      </div>

      <div class="sidebar-content custom-scrollbar">
        <NavigationTree
          v-if="items"
          :items="items"
          :search-query="searchQuery"
          @select="selectItem"
        />
      </div>

      <div class="sidebar-footer">
        <KitBtn
          variant="text"
          color="secondary"
          size="sm"
          class="w-full"
          @click="navigateTo('/')"
        >
          Вернуться к хранилищам
        </KitBtn>
      </div>
    </div>

    <!-- Ресайзер -->
    <div
      v-show="menu"
      class="resizer"
      :class="{ resizing }"
      @mousedown="startResize"
    />
  </aside>
</template>

<style lang="scss" scoped>
.sidebar-wrapper {
  position: relative;
  height: 100%;
  background-color: var(--bg-secondary-color);
  border-right: 1px solid var(--border-secondary-color);
  flex-shrink: 0;
  will-change: width;
  z-index: 20;

  &.is-closed {
    overflow: hidden;
    border: none;
  }

  @include mobile {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 9999;
    border-right: none;

    width: 100% !important;
    max-width: 100vw;

    &.is-closed {
      width: 0 !important;
    }
  }
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  min-width: 250px;
  font-size: 1rem;

  @include mobile {
    width: 100vw;
    font-size: 1.5rem;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--border-secondary-color);
  height: 50px;
  flex-shrink: 0;

  @include mobile {
    :deep(input) {
      font-size: 1.1rem !important;
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border-secondary-color);
  flex-shrink: 0;
  .w-full {
    width: 100%;
  }
}

.resizer {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 30;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover,
  &.resizing {
    opacity: 1;
    background-color: var(--fg-accent-color);
  }

  @include mobile {
    display: none !important;
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-color);
    border-radius: 4px;
  }
}

.sidebar-scrim {
  display: none;
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.mobile-close-btn {
  display: none;
}

@include mobile {
  .sidebar-scrim {
    display: block;
  }

  .mobile-close-btn {
    display: inline-flex;
  }
}
</style>
