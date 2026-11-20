<script setup lang="ts">
/**
 * Trend line: current period vs previous period (same length).
 * Data flow: filter store → useTimeSeries → trendLineOption() → BaseChart
 * Click a point on a revenue/orders chart → drill-down opens at that date.
 */
import { computed } from 'vue'
import type { SeriesMetricKey } from '~/types/analytics'
import type { ChartClickEvent } from '~/types/charts'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { trendLineOption } from '~/utils/charts/options'
import { formatBucketLabel, monthKey } from '~/utils/date'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()

const series = useTimeSeries()
const filters = useFilterStore()
const theme = useChartTheme()
const { openRevenue, openRevenueDay } = useDrillDown()

const metric = computed<SeriesMetricKey>(
  () => (props.widget.settings.metric as SeriesMetricKey | undefined) ?? 'revenue',
)
const drillable = computed(() => metric.value === 'revenue' || metric.value === 'orders')

const option = computed(() => {
  const d = series.data.value
  if (!d) return null
  const m = metric.value
  return trendLineOption(
    {
      categories: d.current.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      current: d.current.map((p) => p.values[m]),
      previous: filters.compare ? d.previous.map((p) => p.values[m]) : undefined,
      previousLabels: d.previous.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      name: tt('Current period', '本期'),
      previousName: tt('Previous period', '前期'),
      format: metricInfo(m).format,
      area: true,
    },
    theme.value,
  )
})

const isEmpty = computed(() => {
  const d = series.data.value
  return !!d && d.current.every((p) => !p.values[metric.value])
})

function onClick(event: ChartClickEvent): void {
  const d = series.data.value
  if (!d || !drillable.value || event.seriesName === tt('Previous period', '前期')) return
  const point = d.current[event.dataIndex]
  if (!point) return
  if (d.granularity === 'day') openRevenueDay(point.bucket)
  else openRevenue(monthKey(point.bucket))
}
</script>

<template>
  <div class="widget-chart">
    <div v-if="series.pending.value && !series.data.value"><SkeletonBlock height="260px" radius="8px" /></div>
    <ErrorState
      v-else-if="series.error.value"
      compact
      :message="series.error.value.message"
      @retry="series.refresh()"
    />
    <EmptyState v-else-if="isEmpty" compact :title="tt('No data for this period', '此期間沒有資料')" />
    <template v-else-if="option">
      <LazyBaseChart
        :option="option"
        :height="260"
        :clickable="drillable"
        :label="widgetTitle(widget)"
        @click="onClick"
      />
      <p v-if="drillable" class="widget-chart__hint">
        <AppIcon name="layers" :size="12" /> {{ tt('Click a point to drill down', '點擊資料點即可鑽取明細') }}
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.widget-chart__hint {
  display: flex;
  align-items: center;
  gap: space(1);
  margin-top: space(1);
  font-size: fs('xs');
  color: var(--color-text-muted);
}
</style>
