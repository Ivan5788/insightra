<script setup lang="ts">
import { computed } from 'vue'
import type { IconName } from '~/data/icons'

/**
 * Button with variants / sizes / loading state.
 * Renders <NuxtLink> when `to` is given so links look like buttons
 * but keep correct semantics (navigation = link, action = button).
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    icon?: IconName
    iconRight?: IconName
    /** Icon-only button. `label` is then required for screen readers. */
    iconOnly?: boolean
    label?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
    to?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'secondary', size: 'md', type: 'button' },
)

const classes = computed(() => [
  'btn',
  'btn--' + props.variant,
  props.size !== 'md' && 'btn--' + props.size,
  props.iconOnly && 'btn--icon',
  props.block && 'btn--block',
])

const iconSize = computed(() => (props.size === 'sm' ? 16 : 18))
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes" :aria-label="iconOnly ? label : undefined">
    <AppIcon v-if="icon" :name="icon" :size="iconSize" />
    <span v-if="!iconOnly"
      ><slot>{{ label }}</slot></span
    >
    <AppIcon v-if="iconRight" :name="iconRight" :size="iconSize" />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="iconOnly ? label : undefined"
    :title="iconOnly ? label : undefined"
  >
    <LoadingSpinner v-if="loading" :size="iconSize" />
    <AppIcon v-else-if="icon" :name="icon" :size="iconSize" />
    <span v-if="!iconOnly"
      ><slot>{{ label }}</slot></span
    >
    <AppIcon v-if="iconRight && !loading" :name="iconRight" :size="iconSize" />
  </button>
</template>
