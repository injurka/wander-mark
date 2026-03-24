<script setup lang="ts">
import { watch } from 'vue'
import { KitDialog, KitBtn } from '~/components/01.kit'
import { useConfirm } from '~/shared/composables/use-confirm'

const { isOpen, options, respond } = useConfirm()

watch(isOpen, (val) => {
  if (!val) {
    respond(false)
  }
})
</script>

<template>
  <KitDialog
    v-model:visible="isOpen"
    :title="options.title || 'Подтверждение'"
    icon="mdi:help-circle-outline"
    :persistent="options.persistent"
    :max-width="400"
  >
    <div class="confirm-message">
      {{ options.message }}
    </div>

    <template #footer>
      <KitBtn variant="text" color="secondary" @click="respond(false)">
        {{ options.cancelText || 'Отмена' }}
      </KitBtn>
      <KitBtn color="primary" @click="respond(true)">
        {{ options.confirmText || 'ОК' }}
      </KitBtn>
    </template>
  </KitDialog>
</template>

<style lang="scss" scoped>
.confirm-message {
  font-size: 0.95rem;
  color: var(--fg-primary-color);
  line-height: 1.5;
  margin-bottom: 8px;
}
</style>
