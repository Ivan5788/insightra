<script setup lang="ts">
/** Part-to-whole donut. Click a channel/category slice → drill-down. */
import { computed } from 'vue'
import type { DimensionKey, SeriesMetricKey } from '~/types/analytics'
import type { ChartClickEvent } from '~/types/charts'
import type { CategoryId, ChannelId } from '~/types/domain'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { entityColor } from '~/utils/charts/colors'
import { donutOption, foldOther } from '~/utils/charts/options'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()

const theme = useChartTheme()
const { openChannel, openCategory } = useDrillDown()

const metric = computed<SeriesMetricKey>(
  () => (props.widget.settings.metric as SeriesMetricKey | undefined) ?? 'revenue',
)
const dimension = computed<DimensionKey>(() => props.widget.settings.dimension ?? 'channel')
const breakdown = useBreakdown(
  () => dimension.value,
  () => metric.value,
)

const items = computed(() => {
  const b = breakdown.data.value
  if (!b) return []
  return foldOther(
    b.items.filter((i) => i.value > 0).map((i) => ({ name: i.label, value: i.value, key: i.key })),
    6,
  )
})

const option = computed(() =>
  items.value.length
    ? donutOption(
        {
          items: items.value.map((i) => ({
            name: i.name,
            value: i.value,
            color: 'key' in i ? entityColor(theme.value, dimension.value, i.key) : theme.value.previous,
          })),
          format: metricInfo(metric.value).format,
          centerLabel: metricInfo(metric.value).shortLabel,
        },
        theme.value,
      )
    : null,
)

const clickable = computed(() => dimension.value === 'channel' || dimension.value === 'category')

function onClick(event: ChartClickEvent): void {
  const item = breakdown.data.value?.items.find((i) => i.label === event.name)
  if (!item) return
  if (dimension.value === 'channel') openChannel(item.key as ChannelId)
  if (dimension.value === 'category') openCategory(item.key as CategoryId)
}
</script>

<template>
  <div v-if="breakdown.pending.value && !breakdown.data.value">
    <SkeletonBlock height="260px" radius="8px" />
  </div>
  <ErrorState
    v-else-if="breakdown.error.value"
    compact
    :message="breakdown.error.value.message"
    @retry="breakdown.refresh()"
  />
  <EmptyState v-else-if="!option" compact :title="tt('No data for this period', '此期間沒有資料')" />
  <LazyBaseChart
    v-else
    :option="option"
    :height="260"
    :clickable="clickable"
    :label="widgetTitle(widget)"
    @click="onClick"
  />
</template>
