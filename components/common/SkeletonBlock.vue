<script setup lang="ts">
/** Placeholder shown while content loads — keeps layout stable (no jumping). */
withDefaults(defineProps<{ width?: string; height?: string; radius?: string }>(), {
  width: '100%',
  height: '16px',
  radius: '6px',
})
</script>

<template>
  <span class="skeleton" :style="{ width, height, borderRadius: radius }" aria-hidden="true" />
</template>

<style scoped lang="scss">
.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 25%,
    var(--color-surface-hover) 37%,
    var(--color-surface-2) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
