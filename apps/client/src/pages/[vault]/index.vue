<script lang="ts" setup>
definePageMeta({
  layout: 'nav-content',
  pageTransition: {
    name: 'fade',
    mode: 'out-in',
  },
})
</script>

<template>
  <div style="padding: 20px;">
    <div class="alert">
      <strong class="alert__title">Ничего не выбрано</strong>
      <p>Выберите интересующую вас тему в меню слева.</p>
    </div>
  </div>
</template>
