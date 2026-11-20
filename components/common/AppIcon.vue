<script setup lang="ts">
/**
 * Icon system — inline SVG, 24×24 grid, 2px stroke, round caps.
 * One component + a path dictionary: no icon font, no extra dependency,
 * icons inherit `currentColor` and scale with `size`.
 */
import { computed } from 'vue'
import { ICONS, type IconName } from '~/data/icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
    /** Accessible label. Without it the icon is decorative (aria-hidden). */
    label?: string
  }>(),
  { size: 18, strokeWidth: 2 },
)

const path = computed(() => ICONS[props.name])
const isDots = computed(() => props.name === 'grip' || props.name === 'more')
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="isDots ? 3 : strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped lang="scss">
.app-icon {
  flex-shrink: 0;
}
</style>
