<script setup lang="ts">
/** Ranked list with proportional bars. Items are buttons when `clickable` (drill-down). */
import { computed } from 'vue'
import { formatDeltaPercent, formatValue, type ValueFormat } from '~/utils/format'

const { tt } = useI18n()

const props = defineProps<{
  items: { key: string; label: string; value: number; deltaPercent: number | null; sublabel?: string }[]
  format: Exclude<ValueFormat, 'text' | 'date'>
  clickable?: boolean
  color?: string
}>()

const emit = defineEmits<{ select: [key: string] }>()
const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
</script>

<template>
  <ol class="ranking" role="list">
    <li v-for="(item, i) in items" :key="item.key">
      <component
        :is="clickable ? 'button' : 'div'"
        :type="clickable ? 'button' : undefined"
        class="ranking__row"
        :class="{ 'is-clickable': clickable }"
        @click="clickable && emit('select', item.key)"
      >
        <span class="ranking__pos">{{ i + 1 }}</span>
        <span class="ranking__main">
          <span class="ranking__top">
            <span class="ranking__label">{{ item.label }}</span>
            <span class="ranking__value">{{ formatValue(item.value, format, { compact: true }) }}</span>
          </span>
          <span class="ranking__bar-track">
            <span
              class="ranking__bar"
              :style="{ width: (item.value / max) * 100 + '%', background: color }"
            />
          </span>
          <span class="ranking__meta">
            <span v-if="item.sublabel">{{ item.sublabel }}</span>
            <span
              v-if="item.deltaPercent !== null"
              :class="item.deltaPercent >= 0 ? 'is-up' : 'is-down'"
              :title="tt('vs previous period', '較前期')"
            >
              {{ formatDeltaPercent(item.deltaPercent) }}
            </span>
          </span>
        </span>
        <AppIcon v-if="clickable" name="chevron-right" :size="16" class="ranking__chev" />
      </component>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.ranking {
  display: grid;
  gap: space(1);
  margin: 0;
  padding: 0;

  &__row {
    @include reset-button;
    display: flex;
    align-items: center;
    gap: space(3);
    width: 100%;
    padding: space(2);
    border-radius: $radius-md;
    text-align: left;

    &.is-clickable {
      @include focus-ring(0);

      &:hover {
        background: var(--color-surface-hover);
      }
    }
  }

  &__pos {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: $radius-sm;
    background: var(--color-surface-2);
    font-size: fs('xs');
    font-weight: $font-weight-semibold;
    color: var(--color-text-secondary);
  }

  &__main {
    flex: 1;
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  &__top {
    display: flex;
    justify-content: space-between;
    gap: space(2);
  }

  &__label {
    font-weight: $font-weight-medium;
    @include truncate;
  }

  &__value {
    font-weight: $font-weight-semibold;
    font-variant-numeric: tabular-nums;
  }

  &__bar-track {
    height: 6px;
    border-radius: $radius-full;
    background: var(--color-surface-2);
    overflow: hidden;
  }

  &__bar {
    display: block;
    height: 100%;
    border-radius: $radius-full;
    background: var(--chart-1);
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: fs('xs');
    color: var(--color-text-muted);

    .is-up {
      color: var(--color-success);
    }

    .is-down {
      color: var(--color-danger);
    }
  }

  &__chev {
    color: var(--color-text-muted);
  }
}
</style>
