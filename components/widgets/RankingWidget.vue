<script setup lang="ts">
import { computed } from 'vue'
import { categoryLabel, getProduct } from '~/data/catalog'
import type { DimensionKey, SeriesMetricKey } from '~/types/analytics'
import type { CategoryId, ChannelId } from '~/types/domain'
import type { WidgetConfig } from '~/types/widgets'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()
const { openProduct, openCategory, openChannel } = useDrillDown()

const metric = computed<SeriesMetricKey>(
  () => (props.widget.settings.metric as SeriesMetricKey | undefined) ?? 'revenue',
)
const dimension = computed<DimensionKey>(() => props.widget.settings.dimension ?? 'product')
const limit = computed(() => props.widget.settings.limit ?? 5)

const breakdown = useBreakdown(
  () => dimension.value,
  () => metric.value,
)

const items = computed(() =>
  (breakdown.data.value?.items ?? []).slice(0, limit.value).map((i) => ({
    key: i.key,
    label: i.label,
    value: i.value,
    deltaPercent: i.deltaPercent,
    sublabel:
      dimension.value === 'product'
        ? categoryLabel(getProduct(i.key)?.category ?? '')
        : tt('{x}% share', '占比 {x}%', { x: i.share.toFixed(1) }),
  })),
)

const clickable = computed(() => ['product', 'category', 'channel'].includes(dimension.value))

function onSelect(key: string): void {
  if (dimension.value === 'product') openProduct(key)
  else if (dimension.value === 'category') openCategory(key as CategoryId)
  else if (dimension.value === 'channel') openChannel(key as ChannelId)
}
</script>

<template>
  <div v-if="breakdown.pending.value && !breakdown.data.value" class="rank-skel">
    <SkeletonBlock v-for="i in limit" :key="i" height="40px" />
  </div>
  <ErrorState
    v-else-if="breakdown.error.value"
    compact
    :message="breakdown.error.value.message"
    @retry="breakdown.refresh()"
  />
  <EmptyState
    v-else-if="items.length === 0"
    compact
    :title="tt('No data for this period', '此期間沒有資料')"
  />
  <RankingList
    v-else
    :items="items"
    :format="metricInfo(metric).format"
    :clickable="clickable"
    @select="onSelect"
  />
</template>

<style scoped lang="scss">
.rank-skel {
  display: grid;
  gap: space(2);
}
</style>
