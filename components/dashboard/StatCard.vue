<script setup lang="ts">
/**
 * KPI card: label (+ tooltip), formatted value, change badge, previous
 * value and an optional sparkline. Purely presentational — receives
 * already-computed numbers through props (easy to test & reuse).
 */
import { computed } from 'vue'
import type { MetricComparison } from '~/types/analytics'
import { sparklineOption } from '~/utils/charts/options'
import { formatValue, type ValueFormat } from '~/utils/format'

import { tt } from '~/utils/locale'

const props = withDefaults(
  defineProps<{
    label: string
    value: number | null
    format: Exclude<ValueFormat, 'text' | 'date'>
    comparison?: MetricComparison | null
    deltaUnit?: 'percent' | 'pp'
    higherIsBetter?: boolean
    info?: string
    sparkline?: number[]
    sparklineColor?: string
    loading?: boolean
    showComparison?: boolean
    /** Text for the previous value, e.g. "previous period". */
    previousLabel?: string
  }>(),
  { deltaUnit: 'percent', higherIsBetter: true, showComparison: true, previousLabel: 'previous period' },
)

const displayValue = computed(() => formatValue(props.value, props.format, { compact: true }))
const fullValue = computed(() => formatValue(props.value, props.format))
const deltaValue = computed(() =>
  props.comparison
    ? props.deltaUnit === 'pp'
      ? props.comparison.delta
      : props.comparison.deltaPercent
    : null,
)
const previousText = computed(() =>
  props.comparison?.previous === null || props.comparison?.previous === undefined
    ? null
    : formatValue(props.comparison.previous, props.format, { compact: true }),
)
const spark = computed(() =>
  props.sparkline && props.sparkline.length > 1
    ? sparklineOption(props.sparkline, props.sparklineColor ?? '#2a78d6')
    : null,
)
</script>

<template>
  <article class="stat-card" :aria-busy="loading">
    <header class="stat-card__head">
      <h3 class="stat-card__label">{{ label }}</h3>
      <InfoTooltip
        v-if="info"
        :text="info"
        :label="tt('How {x} is calculated', '「{x}」的計算方式', { x: label })"
      />
      <slot name="actions" />
    </header>

    <template v-if="loading">
      <SkeletonBlock height="30px" width="70%" />
      <SkeletonBlock height="14px" width="50%" />
    </template>
    <template v-else>
      <p class="stat-card__value" :title="fullValue" data-testid="stat-value">{{ displayValue }}</p>
      <div v-if="showComparison && comparison" class="stat-card__compare">
        <DeltaBadge
          :direction="comparison.direction"
          :value="deltaValue"
          :unit="deltaUnit"
          :higher-is-better="higherIsBetter"
          size="sm"
        />
        <span v-if="previousText" class="stat-card__prev">{{
          tt('vs {x}', '前期 {x}', { x: previousText })
        }}</span>
      </div>
      <p v-else-if="value === null" class="stat-card__na">
        {{ tt('Not available for this filter', '此篩選條件下無法提供') }}
      </p>
    </template>

    <div v-if="spark && !loading" class="stat-card__spark" aria-hidden="true">
      <LazyBaseChart :option="spark" :height="36" label="" />
    </div>
  </article>
</template>

<style scoped lang="scss">
.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: space(1.5);
  height: 100%;
  min-width: 0;

  &__head {
    display: flex;
    align-items: center;
    gap: space(1);
    min-height: 22px;
  }

  &__label {
    font-size: fs('sm');
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    line-height: 1.3;
    // Allow two lines on narrow cards instead of cutting the label off.
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__value {
    font-size: fs('xl');
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--color-text);

    @include up('md') {
      font-size: fs('2xl');
    }
  }

  &__compare {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: space(1.5);
  }

  &__prev,
  &__na {
    font-size: fs('xs');
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  &__spark {
    margin-top: auto;
    padding-top: space(1);
  }
}
</style>
