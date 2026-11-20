<script setup lang="ts">
/**
 * Insightra logo — a rounded "lens" square with three ascending bars and
 * an insight spark: data (bars) + insight (spark) = the product promise.
 */
import { useId } from 'vue'

withDefaults(defineProps<{ size?: number; showText?: boolean }>(), { size: 32, showText: true })

const gradientId = 'logo-grad-' + useId()
</script>

<template>
  <span class="app-logo">
    <svg :width="size" :height="size" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0f6e73" />
          <stop offset="1" stop-color="#1f9e96" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" :fill="'url(#' + gradientId + ')'" />
      <rect x="9" y="22" width="5" height="9" rx="2.5" fill="#fff" fill-opacity="0.65" />
      <rect x="17.5" y="16" width="5" height="15" rx="2.5" fill="#fff" fill-opacity="0.85" />
      <rect x="26" y="11" width="5" height="20" rx="2.5" fill="#fff" />
      <circle cx="28.5" cy="6.5" r="2" fill="#e3a12f" />
    </svg>
    <span v-if="showText" class="app-logo__text">Insightra</span>
  </span>
</template>

<style scoped lang="scss">
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: space(2.5);

  &__text {
    font-size: fs('lg');
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: var(--color-text);
  }
}
</style>
