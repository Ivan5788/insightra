<script setup lang="ts">
/**
 * Bar chart with two modes:
 *  - no dimension → metric per time bucket (e.g. orders per day)
 *  - dimension    → metric per channel / category / region (coloured by entity)
 */
import { computed } from 'vue'
import type { DimensionKey, SeriesMetricKey } from '~/types/analytics'
import type { ChartClickEvent } from '~/types/charts'
import type { CategoryId, ChannelId } from '~/types/domain'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { entityColor } from '~/utils/charts/colors'
import { barOption } from '~/utils/charts/options'
import { formatBucketLabel } from '~/utils/date'
import { metricInfo } from '~/utils/metrics'

const props = defineProps<{ widget: WidgetConfig }>()

const theme = useChartTheme()
const { openRevenueDay, openChannel, openCategory } = useDrillDown()

const metric = computed<SeriesMetricKey>(
  () => (props.widget.settings.metric as SeriesMetricKey | undefined) ?? 'orders',
)
const dimension = computed<DimensionKey | undefined>(() => props.widget.settings.dimension)

// Both queries are declared; the inactive one is disabled by returning a null key.
const filters = useFilterStore()
const api = useAnalyticsService()
const series = useApiQuery(
  () => (dimension.value ? null : 'timeseries:' + filters.effectiveGranularity + ':' + filters.filterKey),
  () => api.timeSeries(filters.apiFilter, filters.effectiveGranularity),
)
const breakdown = useApiQuery(
  () =>
    dimension.value ? 'breakdown:' + dimension.value + ':' + metric.value + ':' + filters.filterKey : null,
  () => api.breakdown(filters.apiFilter, dimension.value!, metric.value),
)

const active = computed(() => (dimension.value ? breakdown : series))
const format = computed(() => metricInfo(metric.value).format)

const option = computed(() => {
  if (dimension.value) {
    const b = breakdown.data.value
    if (!b) return null
    return barOption(
      {
        categories: b.items.map((i) => i.label),
        series: [{ name: metricInfo(metric.value).shortLabel, data: b.items.map((i) => i.value) }],
        itemColors: b.items.map((i) => entityColor(theme.value, dimension.value!, i.key)),
        format: format.value,
        horizontal: true,
      },
      theme.value,
    )
  }
  const d = series.data.value
  if (!d) return null
  return barOption(
    {
      categories: d.current.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      series: [
        { name: metricInfo(metric.value).shortLabel, data: d.current.map((p) => p.values[metric.value]) },
      ],
      format: format.value,
    },
    theme.value,
  )
})

const clickable = computed(
  () =>
    dimension.value === 'channel' ||
    dimension.value === 'category' ||
    (!dimension.value && series.data.value?.granularity === 'day'),
)

function onClick(event: ChartClickEvent): void {
  if (dimension.value) {
    const item = breakdown.data.value?.items[event.dataIndex]
    if (!item) return
    if (dimension.value === 'channel') openChannel(item.key as ChannelId)
    if (dimension.value === 'category') openCategory(item.key as CategoryId)
    return
  }
  const point = series.data.value?.current[event.dataIndex]
  if (point && series.data.value?.granularity === 'day') openRevenueDay(point.bucket)
}
</script>

<template>
  <div v-if="active.pending.value && !active.data.value"><SkeletonBlock height="260px" radius="8px" /></div>
  <ErrorState
    v-else-if="active.error.value"
    compact
    :message="active.error.value.message"
    @retry="active.refresh()"
  />
  <LazyBaseChart
    v-else-if="option"
    :option="option"
    :height="260"
    :clickable="clickable"
    :label="widgetTitle(widget)"
    @click="onClick"
  />
</template>
