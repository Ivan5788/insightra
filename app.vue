<script setup lang="ts">
// Re-render the whole UI when the language changes (pure helpers such as
// date and label formatters are not reactive on their own).
const settings = useSettingsStore()
</script>

<template>
  <NuxtLoadingIndicator color="#0f6e73" :height="2" />
  <NuxtLayout :key="settings.settings.locale">
    <NuxtPage />
  </NuxtLayout>
  <ToastContainer />
  <ConfirmDialog />
</template>
