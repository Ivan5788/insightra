<script setup lang="ts">
/** Honest labelling: every screen shows that the numbers are simulated. */
const { t } = useI18n()
</script>

<template>
  <span class="mock-pill" :title="t('app.mockDataHint')">
    <AppIcon name="database" :size="12" />
    {{ t('app.mockData') }}
  </span>
</template>
