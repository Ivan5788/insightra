<script setup lang="ts">
/**
 * KPI widget. All KPI widgets call useOverview() with the same cache key,
 * so 6 KPI cards = 1 HTTP request (de-duplicated in useApiQuery).
 */
import { computed } from 'vue'
import type { MetricKey } from '~/types/analytics'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()

const overview = useOverview()
const filters = useFilterStore()
const theme = useChartTheme()
const { openRevenue } = useDrillDown()

const metric = computed<MetricKey>(() => (props.widget.settings.metric as MetricKey | undefined) ?? 'revenue')
const def = computed(() => metricInfo(metric.value))
const comparison = computed(() => overview.data.value?.metrics[metric.value] ?? null)
const sparkline = computed(() => overview.data.value?.sparklines[metric.value])
</script>

<template>
  <ErrorState
    v-if="overview.error.value && !overview.data.value"
    compact
    :message="overview.error.value.message"
    @retry="overview.refresh()"
  />
  <StatCard
    v-else
    :label="widgetTitle(widget)"
    :value="comparison?.current ?? null"
    :format="def.format"
    :comparison="comparison"
    :delta-unit="def.deltaUnit"
    :higher-is-better="def.higherIsBetter"
    :info="def.description"
    :sparkline="sparkline"
    :sparkline-color="theme.series[0]"
    :loading="overview.pending.value && !overview.data.value"
    :show-comparison="filters.compare"
  >
    <template v-if="metric === 'revenue'" #actions>
      <button
        type="button"
        class="kpi-drill"
        :aria-label="tt('Drill down into revenue', '鑽取營收明細')"
        :title="tt('Drill down', '鑽取明細')"
        data-testid="kpi-revenue-drill"
        @click="openRevenue()"
      >
        <AppIcon name="layers" :size="14" />
      </button>
    </template>
  </StatCard>
</template>

<style scoped lang="scss">
.kpi-drill {
  @include reset-button;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-left: auto;
  border-radius: $radius-sm;
  color: var(--color-primary);
  @include focus-ring(0);

  &:hover {
    background: var(--color-primary-soft);
  }
}
</style>
