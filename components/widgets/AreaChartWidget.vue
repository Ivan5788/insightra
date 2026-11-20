<script setup lang="ts">
/**
 * Area chart:
 *  - no dimension → cumulative total over the period (vs previous period)
 *  - dimension    → stacked areas per channel / category (composition over time)
 */
import { computed } from 'vue'
import type { DimensionKey, SeriesMetricKey } from '~/types/analytics'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { entityColor } from '~/utils/charts/colors'
import { multiLineOption, trendLineOption } from '~/utils/charts/options'
import { formatBucketLabel } from '~/utils/date'
import { metricInfo } from '~/utils/metrics'
import { cumulative } from '~/utils/stats'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()

const theme = useChartTheme()
const filters = useFilterStore()
const api = useAnalyticsService()

const metric = computed<SeriesMetricKey>(
  () => (props.widget.settings.metric as SeriesMetricKey | undefined) ?? 'revenue',
)
const dimension = computed<DimensionKey | undefined>(() => props.widget.settings.dimension)

const series = useApiQuery(
  () => (dimension.value ? null : 'timeseries:' + filters.effectiveGranularity + ':' + filters.filterKey),
  () => api.timeSeries(filters.apiFilter, filters.effectiveGranularity),
)
const stacked = useApiQuery(
  () =>
    dimension.value
      ? 'seriesBy:' +
        dimension.value +
        ':' +
        metric.value +
        ':' +
        filters.effectiveGranularity +
        ':' +
        filters.filterKey
      : null,
  () => api.seriesBy(filters.apiFilter, dimension.value!, metric.value, filters.effectiveGranularity),
)

const active = computed(() => (dimension.value ? stacked : series))
const format = computed(() => metricInfo(metric.value).format)

const option = computed(() => {
  if (dimension.value) {
    const s = stacked.data.value
    if (!s) return null
    const g = filters.effectiveGranularity
    return multiLineOption(
      {
        categories: s.buckets.map((b) => formatBucketLabel(b, g)),
        series: s.series.map((x) => ({
          name: x.label,
          data: x.values,
          color: entityColor(theme.value, dimension.value!, x.key),
        })),
        format: format.value,
        stacked: true,
        area: true,
      },
      theme.value,
    )
  }
  const d = series.data.value
  if (!d) return null
  const m = metric.value
  return trendLineOption(
    {
      categories: d.current.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      current: cumulative(d.current.map((p) => p.values[m] ?? 0)),
      previous: filters.compare ? cumulative(d.previous.map((p) => p.values[m] ?? 0)) : undefined,
      name: tt('Cumulative (current)', '累積（本期）'),
      previousName: tt('Cumulative (previous)', '累積（前期）'),
      format: format.value,
      area: true,
      color: theme.value.series[2],
    },
    theme.value,
  )
})
</script>

<template>
  <div v-if="active.pending.value && !active.data.value"><SkeletonBlock height="260px" radius="8px" /></div>
  <ErrorState
    v-else-if="active.error.value"
    compact
    :message="active.error.value.message"
    @retry="active.refresh()"
  />
  <LazyBaseChart v-else-if="option" :option="option" :height="260" :label="widgetTitle(widget)" />
</template>
