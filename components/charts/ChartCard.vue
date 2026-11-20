<script setup lang="ts">
/**
 * ChartCard — the frame around every chart.
 * Handles the four states so individual charts don't have to:
 *   loading (skeleton) · error (retry) · empty · ready
 * Optional "Table" view gives an accessible, non-visual alternative to the chart.
 */
import { ref } from 'vue'

const { tt } = useI18n()

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    info?: string
    loading?: boolean
    error?: string | null
    empty?: boolean
    /** True when data is already shown and a refresh is in progress. */
    refreshing?: boolean
    height?: number
    /** Show the Chart/Table toggle (requires the #table slot). */
    tableToggle?: boolean
    flush?: boolean
  }>(),
  { height: 300 },
)

const emit = defineEmits<{ retry: [] }>()
const view = ref<'chart' | 'table'>('chart')
</script>

<template>
  <section class="chart-card card" :class="{ 'chart-card--flush': flush }" :aria-busy="loading || refreshing">
    <header class="chart-card__header">
      <div class="chart-card__titles">
        <h2 class="chart-card__title">
          {{ title }}
          <InfoTooltip v-if="info" :text="info" :label="tt('About {x}', '關於「{x}」', { x: title })" />
        </h2>
        <p v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</p>
      </div>
      <div class="chart-card__actions">
        <LoadingSpinner
          v-if="refreshing && !loading"
          :size="14"
          class="chart-card__refresh"
          :label="tt('Updating', '更新中')"
        />
        <slot name="actions" />
        <SegmentedControl
          v-if="tableToggle && $slots.table"
          v-model="view"
          size="sm"
          :label="tt('View as', '檢視方式')"
          :options="[
            { value: 'chart', label: tt('Chart', '圖表') },
            { value: 'table', label: tt('Table', '表格') },
          ]"
        />
      </div>
    </header>

    <div class="chart-card__body" :style="{ minHeight: height + 'px' }">
      <div v-if="loading" class="chart-card__skeleton" :style="{ height: height + 'px' }">
        <SkeletonBlock height="100%" radius="8px" />
      </div>
      <ErrorState v-else-if="error" compact :message="error" @retry="emit('retry')" />
      <EmptyState
        v-else-if="empty"
        compact
        :title="tt('No data for this period', '此期間沒有資料')"
        :description="
          tt('Try a different date range or clear the filters.', '請嘗試其他日期區間或清除篩選條件。')
        "
      />
      <div v-else-if="view === 'table' && $slots.table" class="chart-card__table">
        <slot name="table" />
      </div>
      <slot v-else />
    </div>

    <footer v-if="$slots.footer" class="chart-card__footer"><slot name="footer" /></footer>
  </section>
</template>

<style scoped lang="scss">
.chart-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;

  &--flush {
    padding: 0;
    border: 0;
    box-shadow: none;
    background: transparent;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: space(2) space(3);
    margin-bottom: space(3);
  }

  &__titles {
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: space(1.5);
    font-size: fs('md');
    font-weight: $font-weight-semibold;
  }

  &__subtitle {
    margin-top: 2px;
    font-size: fs('sm');
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: space(2);
  }

  &__refresh {
    color: var(--color-text-muted);
  }

  &__body {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  &__table {
    max-height: 360px;
    overflow: auto;
    @include scrollbar-thin;
  }

  &__footer {
    margin-top: space(3);
    padding-top: space(3);
    border-top: 1px solid var(--color-border);
    font-size: fs('sm');
    color: var(--color-text-muted);
  }
}
</style>
