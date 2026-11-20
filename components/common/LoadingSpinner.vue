<script setup lang="ts">
const { tt } = useI18n()
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 18 })
</script>

<template>
  <span class="spinner" :style="{ width: size + 'px', height: size + 'px' }" role="status">
    <span class="sr-only">{{ label ?? tt('Loading', '載入中') }}</span>
  </span>
</template>

<style scoped lang="scss">
.spinner {
  display: inline-block;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.8;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
