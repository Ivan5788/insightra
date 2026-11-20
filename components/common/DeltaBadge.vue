<script setup lang="ts">
/**
 * Shows change vs previous period: arrow icon + signed value.
 * Colour means good/bad (not up/down): for refund rate, "down" is green.
 * Never colour-only — the arrow and the sign carry the meaning too.
 */
import { computed } from 'vue'
import type { TrendDirection } from '~/types/analytics'
import { formatDeltaPercent, formatDeltaPoints } from '~/utils/format'

import { tt } from '~/utils/locale'

const props = withDefaults(
  defineProps<{
    direction: TrendDirection
    /** % change (for 'percent') or absolute pp change (for 'pp'). */
    value: number | null
    unit?: 'percent' | 'pp'
    higherIsBetter?: boolean
    size?: 'sm' | 'md'
  }>(),
  { unit: 'percent', higherIsBetter: true, size: 'md' },
)

const tone = computed(() => {
  if (props.direction === 'none' || props.direction === 'flat') return 'neutral'
  const good = props.direction === 'up' ? props.higherIsBetter : !props.higherIsBetter
  return good ? 'positive' : 'negative'
})

const icon = computed(() =>
  props.direction === 'up' ? 'trend-up' : props.direction === 'down' ? 'trend-down' : 'minus',
)

const text = computed(() => {
  if (props.direction === 'none' || props.value === null) return tt('n/a', '無法比較')
  return props.unit === 'pp' ? formatDeltaPoints(props.value) : formatDeltaPercent(props.value)
})

const srText = computed(() => {
  if (props.direction === 'none') return tt('No comparison available', '無可比較資料')
  const verb =
    props.direction === 'up'
      ? tt('Increased', '增加')
      : props.direction === 'down'
        ? tt('Decreased', '減少')
        : tt('Unchanged', '持平')
  return tt('{v} {x} vs previous period', '較前期{v} {x}', { v: verb, x: text.value })
})
</script>

<template>
  <span class="delta" :class="['delta--' + tone, 'delta--' + size]" :title="srText">
    <AppIcon :name="icon" :size="size === 'sm' ? 12 : 14" />
    <span aria-hidden="true">{{ text }}</span>
    <span class="sr-only">{{ srText }}</span>
  </span>
</template>

<style scoped lang="scss">
.delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px space(1.5);
  border-radius: $radius-full;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &--md {
    font-size: fs('xs');
  }

  &--sm {
    font-size: 11px;
  }

  &--positive {
    color: var(--color-success);
    background: var(--color-success-soft);
  }

  &--negative {
    color: var(--color-danger);
    background: var(--color-danger-soft);
  }

  &--neutral {
    color: var(--color-text-muted);
    background: var(--color-surface-2);
  }
}
</style>
