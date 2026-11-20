<script setup lang="ts">
/**
 * Analytics — deep-dive into trends.
 *  - metric tabs (revenue / orders / users / conversion / traffic)
 *  - granularity switch (day / week / month), compare toggle, zoom
 *  - summary statistics, multi-metric comparison (indexed = 100)
 *  - traffic sources, channel radar, conversion funnel, order heatmap
 *  - entry points into the three drill-down flows
 */
import { computed, ref } from 'vue'
import { CHANNELS, channelLabel } from '~/data/catalog'
import type { SeriesMetricKey } from '~/types/analytics'
import type { ChannelId } from '~/types/domain'
import { entityColor } from '~/utils/charts/colors'
import {
  funnelOption,
  heatmapOption,
  multiLineOption,
  radarOption,
  trendLineOption,
} from '~/utils/charts/options'
import { csvFilename, downloadTextFile, toCsv } from '~/utils/csv'
import { formatBucketLabel, formatHour, todayISO, weekdayLabels } from '~/utils/date'
import { formatDeltaPercent, formatDeltaPoints, formatValue } from '~/utils/format'
import { metricInfo } from '~/utils/metrics'
import { indexSeries, percentChange, summarizeSeries } from '~/utils/stats'
import type { GranularityOption } from '~/stores/filters'

const { t, tt } = useI18n()
const filters = useFilterStore()
const theme = useChartTheme()
const { openRevenue, openCategory, openChannel } = useDrillDown()

// ---- Metric tabs ------------------------------------------------------------
type Tab = 'revenue' | 'orders' | 'activeUsers' | 'conversionRate' | 'sessions'
const tab = ref<Tab>('revenue')
const tabs: { key: Tab; label: string }[] = [
  { key: 'revenue', label: tt('Revenue', '營收') },
  { key: 'orders', label: tt('Orders', '訂單') },
  { key: 'activeUsers', label: tt('Users', '用戶') },
  { key: 'conversionRate', label: tt('Conversion', '轉換') },
  { key: 'sessions', label: tt('Traffic', '流量') },
]
const metric = computed<SeriesMetricKey>(() => tab.value)
const def = computed(() => metricInfo(metric.value))

const GRANULARITY_LABEL = {
  day: tt('daily', '每日'),
  week: tt('weekly', '每週'),
  month: tt('monthly', '每月'),
} as const
const GRAIN_UNIT = { day: tt('day', '日'), week: tt('week', '週'), month: tt('month', '月') } as const

const granularityOptions: { value: GranularityOption; label: string }[] = [
  { value: 'auto', label: tt('Auto', '自動') },
  { value: 'day', label: tt('Day', '日') },
  { value: 'week', label: tt('Week', '週') },
  { value: 'month', label: tt('Month', '月') },
]

// ---- Main trend ---------------------------------------------------------------
const series = useTimeSeries()
const labels = computed(
  () =>
    series.data.value?.current.map((p) => formatBucketLabel(p.bucket, series.data.value!.granularity)) ?? [],
)
const currentValues = computed(() => series.data.value?.current.map((p) => p.values[metric.value]) ?? [])
const previousValues = computed(() => series.data.value?.previous.map((p) => p.values[metric.value]) ?? [])
const hiddenSeries = ref<string[]>([])
const zoomed = ref(false)

const trendOption = computed(() =>
  series.data.value
    ? trendLineOption(
        {
          categories: labels.value,
          current: currentValues.value,
          previous: filters.compare ? previousValues.value : undefined,
          previousLabels: series.data.value.previous.map((p) =>
            formatBucketLabel(p.bucket, series.data.value!.granularity),
          ),
          name: tt('{x} (current)', '{x}（本期）', { x: def.value.shortLabel }),
          previousName: tt('Previous period', '前期'),
          format: def.value.format,
          area: true,
          zoom: true,
        },
        theme.value,
      )
    : null,
)

const trendEmpty = computed(() => !!series.data.value && currentValues.value.every((v) => v === null))
const trendRows = computed(() =>
  (series.data.value?.current ?? []).map((p, i) => ({
    period: labels.value[i] ?? p.bucket,
    current: p.values[metric.value],
    previous: series.data.value?.previous[i]?.values[metric.value] ?? null,
  })),
)

function onLegend(selected: Record<string, boolean>): void {
  hiddenSeries.value = Object.entries(selected)
    .filter(([, on]) => !on)
    .map(([name]) => name)
}

function exportTrend(): void {
  const csv = toCsv(
    [
      { key: 'period', label: tt('Period', '期間') },
      { key: 'current', label: tt('{x} (current)', '{x}（本期）', { x: def.value.label }) },
      { key: 'previous', label: tt('{x} (previous period)', '{x}（前期）', { x: def.value.label }) },
    ],
    trendRows.value,
  )
  downloadTextFile(csvFilename('analytics-' + metric.value, todayISO()), csv)
}

// ---- Summary statistics -----------------------------------------------------
const isRatio = computed(() => metric.value === 'conversionRate' || metric.value === 'activeUsers')
const summary = computed(() => {
  const overview = currentValues.value
  const s = summarizeSeries(overview)
  const p = summarizeSeries(previousValues.value)
  // For ratio metrics a sum is meaningless → compare averages.
  const cur = isRatio.value ? s.average : s.total
  const prev = isRatio.value ? p.average : p.total
  return {
    current: cur,
    previous: prev,
    difference: cur !== null && prev !== null ? cur - prev : null,
    growth: percentChange(cur, prev),
    average: s.average,
    peak: s.max,
    peakLabel: labels.value[s.maxIndex],
    low: s.min,
    lowLabel: labels.value[s.minIndex],
  }
})
const f = (v: number | null) => formatValue(v, def.value.format)

// ---- Multi-metric comparison (indexed) ------------------------------------
const COMPARE_METRICS: SeriesMetricKey[] = [
  'revenue',
  'orders',
  'sessions',
  'activeUsers',
  'newCustomers',
  'aov',
]
const compareSelection = ref<SeriesMetricKey[]>(['revenue', 'orders', 'sessions'])

function toggleCompare(m: SeriesMetricKey): void {
  const set = new Set(compareSelection.value)
  if (set.has(m)) set.delete(m)
  else if (set.size < 4) set.add(m)
  compareSelection.value = COMPARE_METRICS.filter((x) => set.has(x))
}

const compareOption = computed(() => {
  const d = series.data.value
  if (!d || compareSelection.value.length === 0) return null
  return multiLineOption(
    {
      categories: labels.value,
      series: compareSelection.value.map((m) => ({
        name: metricInfo(m).shortLabel,
        data: indexSeries(d.current.map((p) => p.values[m])),
        color: theme.value.series[COMPARE_METRICS.indexOf(m)],
      })),
      format: 'number',
      zoom: labels.value.length > 40,
    },
    theme.value,
  )
})

// ---- Traffic sources ------------------------------------------------------------
const traffic = useSeriesBy(
  () => 'channel',
  () => 'sessions',
)
const trafficOption = computed(() => {
  const s = traffic.data.value
  if (!s) return null
  return multiLineOption(
    {
      categories: s.buckets.map((b) => formatBucketLabel(b, filters.effectiveGranularity)),
      series: s.series.map((x) => ({
        name: x.label,
        data: x.values,
        color: entityColor(theme.value, 'channel', x.key),
      })),
      format: 'number',
      stacked: true,
      area: true,
    },
    theme.value,
  )
})

// ---- Channel radar (≤ 3 channels for legibility) --------------------------
const channelBreakdown = useBreakdown(
  () => 'channel',
  () => 'revenue',
)
const radarChannels = ref<ChannelId[]>(['organic', 'paid', 'email'])

function toggleRadar(id: ChannelId): void {
  const set = new Set(radarChannels.value)
  if (set.has(id)) {
    if (set.size > 1) set.delete(id)
  } else if (set.size < 3) set.add(id)
  radarChannels.value = CHANNELS.map((c) => c.id).filter((c) => set.has(c))
}

const radarOptionComputed = computed(() => {
  const items = channelBreakdown.data.value?.items
  if (!items?.length) return null
  const dims: {
    key: 'sessions' | 'conversionRate' | 'aov' | 'revenue' | 'newCustomers'
    name: string
    format: 'number' | 'percent' | 'currency'
  }[] = [
    { key: 'sessions', name: tt('Sessions', '工作階段'), format: 'number' },
    { key: 'conversionRate', name: tt('Conversion', '轉換率'), format: 'percent' },
    { key: 'aov', name: tt('AOV', '客單價'), format: 'currency' },
    { key: 'revenue', name: tt('Revenue', '營收'), format: 'currency' },
    { key: 'newCustomers', name: tt('New customers', '新顧客'), format: 'number' },
  ]
  const max = dims.map((d) => Math.max(...items.map((i) => Number(i.extra[d.key] ?? 0)), 1))
  return radarOption(
    {
      indicators: dims.map((d) => ({ name: d.name, max: 100 })),
      series: items
        .filter((i) => radarChannels.value.includes(i.key as ChannelId))
        .map((i) => ({
          name: i.label,
          color: entityColor(theme.value, 'channel', i.key),
          values: dims.map((d, di) => Math.round((Number(i.extra[d.key] ?? 0) / max[di]!) * 100)),
          raw: dims.map((d) => formatValue(i.extra[d.key] ?? null, d.format)),
        })),
    },
    theme.value,
  )
})

// ---- Funnel & heatmap --------------------------------------------------------
const funnel = useFunnel()
const funnelOptionComputed = computed(() =>
  funnel.data.value?.stages.length
    ? funnelOption(
        {
          stages: funnel.data.value.stages.map((s) => ({
            name: s.label,
            value: s.value,
            rate: s.rateFromPrevious,
          })),
        },
        theme.value,
      )
    : null,
)

const heatmap = useHeatmap()
const WEEKDAYS = weekdayLabels()
const heatmapOptionComputed = computed(() => {
  const h = heatmap.data.value
  if (!h) return null
  return heatmapOption(
    {
      xLabels: Array.from({ length: 24 }, (_, i) => formatHour(i)),
      yLabels: WEEKDAYS,
      cells: h.cells.map(([hour, wd, v]) => [hour, wd, v]),
      max: h.max,
      format: 'number',
      valueLabel: tt('Orders', '訂單'),
    },
    theme.value,
  )
})
const busiest = computed(() => {
  const h = heatmap.data.value
  if (!h || !h.max) return null
  const top = h.cells.reduce((a, b) => (b[2] > a[2] ? b : a))
  return WEEKDAYS[top[1]] + ' ' + formatHour(top[0])
})
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.analytics.title')" :subtitle="t('page.analytics.subtitle')">
      <template #actions>
        <GlobalFilterBar />
      </template>
    </PageHeader>

    <div class="an-controls">
      <BaseTabs v-model="tab" :tabs="tabs" :label="tt('Metric', '指標')" class="an-controls__tabs" />
      <div class="an-controls__right">
        <SegmentedControl
          :model-value="filters.granularity"
          :options="granularityOptions"
          :label="tt('Time granularity', '時間粒度')"
          size="sm"
          @update:model-value="filters.setGranularity"
        />
        <ToggleSwitch
          :model-value="filters.compare"
          :label="tt('Compare', '比較')"
          @update:model-value="filters.setCompare"
        />
      </div>
    </div>

    <div class="page-grid page-grid--wide-left">
      <ChartCard
        :title="tt('{x} trend', '{x}趨勢', { x: def.label })"
        :subtitle="
          tt('Current vs previous period · {g}', '本期與前期比較 · {g}', {
            g: GRANULARITY_LABEL[filters.effectiveGranularity],
          })
        "
        :info="def.description"
        :loading="series.pending.value && !series.data.value"
        :refreshing="series.pending.value && !!series.data.value"
        :error="series.error.value?.message"
        :empty="trendEmpty"
        :height="320"
        table-toggle
        @retry="series.refresh()"
      >
        <template #actions>
          <BaseButton size="sm" icon="download" variant="ghost" @click="exportTrend">CSV</BaseButton>
        </template>
        <LazyBaseChart
          v-if="trendOption"
          :option="trendOption"
          :height="320"
          :label="tt('{x} trend chart', '{x}趨勢圖', { x: def.label })"
          @legendselectchanged="onLegend"
          @datazoom="(z) => (zoomed = (z.start ?? 0) > 0 || (z.end ?? 100) < 100)"
        />
        <template #table>
          <ChartDataTable
            :caption="tt('{x} by period', '各期間{x}', { x: def.label })"
            :columns="[
              { key: 'period', label: tt('Period', '期間') },
              { key: 'current', label: tt('Current', '本期'), format: def.format },
              { key: 'previous', label: tt('Previous', '前期'), format: def.format },
            ]"
            :rows="trendRows"
          />
        </template>
        <template #footer>
          <span>
            <AppIcon name="zoom-in" :size="12" />
            {{ tt('Drag the slider or Ctrl + scroll to zoom.', '拖曳滑桿或按住 Ctrl 捲動即可縮放。') }}
            <template v-if="zoomed"> {{ tt('Zoomed in.', '目前已放大。') }}</template>
            <template v-if="hiddenSeries.length">
              {{
                tt('Hidden: {x} (click the legend to show).', '已隱藏：{x}（點擊圖例可顯示）。', {
                  x: hiddenSeries.join(', '),
                })
              }}</template
            >
          </span>
        </template>
      </ChartCard>

      <section class="card an-summary" aria-labelledby="summary-title">
        <h2 id="summary-title" class="card__title">{{ tt('Period summary', '期間摘要') }}</h2>
        <p class="card__subtitle">
          {{
            isRatio
              ? tt('Average per {g}', '每{g}平均', { g: GRAIN_UNIT[filters.effectiveGranularity] })
              : tt('Total for the period', '期間合計')
          }}
        </p>
        <dl class="an-summary__list">
          <div>
            <dt>{{ tt('Current', '本期') }}</dt>
            <dd class="an-summary__big">{{ f(summary.current) }}</dd>
          </div>
          <div>
            <dt>{{ tt('Previous period', '前期') }}</dt>
            <dd>{{ f(summary.previous) }}</dd>
          </div>
          <div>
            <dt>{{ tt('Difference', '差額') }}</dt>
            <dd>
              {{
                summary.difference === null
                  ? '—'
                  : (summary.difference >= 0 ? '+' : '−') + f(Math.abs(summary.difference))
              }}
            </dd>
          </div>
          <div>
            <dt>{{ tt('Growth', '成長') }}</dt>
            <dd>
              <DeltaBadge
                :direction="
                  summary.growth === null
                    ? 'none'
                    : summary.growth > 0
                      ? 'up'
                      : summary.growth < 0
                        ? 'down'
                        : 'flat'
                "
                :value="def.deltaUnit === 'pp' ? summary.difference : summary.growth"
                :unit="def.deltaUnit"
                :higher-is-better="def.higherIsBetter"
              />
            </dd>
          </div>
          <div>
            <dt>{{ tt('Average per {g}', '每{g}平均', { g: GRAIN_UNIT[filters.effectiveGranularity] }) }}</dt>
            <dd>{{ f(summary.average) }}</dd>
          </div>
          <div>
            <dt>{{ tt('Peak', '最高') }}</dt>
            <dd>
              {{ f(summary.peak) }} <span class="text-muted">{{ summary.peakLabel }}</span>
            </dd>
          </div>
          <div>
            <dt>{{ tt('Lowest', '最低') }}</dt>
            <dd>
              {{ f(summary.low) }} <span class="text-muted">{{ summary.lowLabel }}</span>
            </dd>
          </div>
        </dl>
        <p class="an-summary__note text-xs text-muted">
          {{
            tt(
              'Growth for percentage metrics is shown in percentage points ({p} = one point), otherwise in % ({c}).',
              '百分比類指標的成長以百分點表示（{p} = 一個百分點），其餘以 % 表示（{c}）。',
              { p: formatDeltaPoints(1), c: formatDeltaPercent(10) },
            )
          }}
        </p>
      </section>
    </div>

    <ChartCard
      :title="tt('Multi-metric comparison', '多指標比較')"
      :subtitle="
        tt(
          'Each metric indexed to 100 at the start of the period, so different units share one axis',
          '各指標以期初 = 100 指數化，讓不同單位能共用同一個座標軸',
        )
      "
      :info="
        tt(
          'Indexing avoids misleading dual-axis charts: a line at 120 means +20% vs the first period.',
          '指數化可避免雙軸圖造成誤讀：數值 120 代表比第一期 +20%。',
        )
      "
      :loading="series.pending.value && !series.data.value"
      :error="series.error.value?.message"
      :height="300"
      @retry="series.refresh()"
    >
      <template #actions>
        <div
          class="chip-group"
          role="group"
          :aria-label="tt('Metrics to compare (max 4)', '要比較的指標（最多 4 個）')"
        >
          <button
            v-for="m in COMPARE_METRICS"
            :key="m"
            type="button"
            class="chip"
            :class="{ 'is-on': compareSelection.includes(m) }"
            :aria-pressed="compareSelection.includes(m)"
            @click="toggleCompare(m)"
          >
            {{ metricInfo(m).shortLabel }}
          </button>
        </div>
      </template>
      <LazyBaseChart
        v-if="compareOption"
        :option="compareOption"
        :height="300"
        :label="tt('Indexed metric comparison chart', '指數化多指標比較圖')"
      />
      <EmptyState v-else compact :title="tt('Select at least one metric', '請至少選擇一個指標')" />
    </ChartCard>

    <div class="page-grid page-grid--2">
      <ChartCard
        :title="tt('Traffic sources', '流量來源')"
        :subtitle="tt('Sessions by acquisition channel (stacked)', '各獲客渠道的工作階段（堆疊）')"
        :loading="traffic.pending.value && !traffic.data.value"
        :error="traffic.error.value?.message"
        :height="300"
        @retry="traffic.refresh()"
      >
        <LazyBaseChart
          v-if="trafficOption"
          :option="trafficOption"
          :height="300"
          :label="tt('Sessions by channel stacked area chart', '各渠道工作階段堆疊面積圖')"
        />
      </ChartCard>

      <ChartCard
        :title="tt('Channel performance', '渠道成效')"
        :subtitle="
          tt(
            'Each axis scaled to the best channel (=100). Pick up to 3 channels.',
            '每個軸以表現最佳的渠道為 100；最多可選 3 個渠道。',
          )
        "
        :loading="channelBreakdown.pending.value && !channelBreakdown.data.value"
        :error="channelBreakdown.error.value?.message"
        :height="300"
        @retry="channelBreakdown.refresh()"
      >
        <template #actions>
          <div
            class="chip-group"
            role="group"
            :aria-label="tt('Channels on radar (max 3)', '雷達圖上的渠道（最多 3 個）')"
          >
            <button
              v-for="c in CHANNELS"
              :key="c.id"
              type="button"
              class="chip"
              :class="{ 'is-on': radarChannels.includes(c.id) }"
              :aria-pressed="radarChannels.includes(c.id)"
              @click="toggleRadar(c.id)"
            >
              {{ channelLabel(c.id) }}
            </button>
          </div>
        </template>
        <LazyBaseChart
          v-if="radarOptionComputed"
          :option="radarOptionComputed"
          :height="300"
          :label="tt('Channel performance radar chart', '渠道成效雷達圖')"
        />
      </ChartCard>
    </div>

    <div class="page-grid page-grid--2">
      <ChartCard
        :title="tt('Conversion funnel', '轉換漏斗')"
        :subtitle="tt('Sessions → purchase', '工作階段 → 購買')"
        :info="
          tt(
            'Only available without product, category or region filters (traffic is tracked per channel).',
            '僅在未套用商品、品類或地區篩選時提供（流量只依渠道追蹤）。',
          )
        "
        :loading="funnel.pending.value && !funnel.data.value"
        :error="funnel.error.value?.message"
        :empty="!!funnel.data.value && funnel.data.value.stages.length === 0"
        :height="300"
        table-toggle
        @retry="funnel.refresh()"
      >
        <LazyBaseChart
          v-if="funnelOptionComputed"
          :option="funnelOptionComputed"
          :height="300"
          :label="tt('Conversion funnel chart', '轉換漏斗圖')"
        />
        <template #table>
          <ChartDataTable
            :caption="tt('Funnel stages', '漏斗階段')"
            :columns="[
              { key: 'label', label: tt('Stage', '階段') },
              { key: 'value', label: tt('Users', '用戶'), format: 'number' },
              { key: 'rateFromPrevious', label: tt('Step conv.', '階段轉換率'), format: 'percent' },
              { key: 'rateFromTop', label: tt('From sessions', '相對工作階段'), format: 'percent' },
            ]"
            :rows="(funnel.data.value?.stages ?? []).map((s) => ({ ...s }))"
          />
        </template>
      </ChartCard>

      <ChartCard
        :title="tt('When do customers order?', '顧客都在什麼時候下單？')"
        :subtitle="
          busiest
            ? tt('Busiest slot: {x}', '最忙碌時段：{x}', { x: busiest })
            : tt('Orders by weekday and hour', '依星期與時段的訂單數')
        "
        :loading="heatmap.pending.value && !heatmap.data.value"
        :error="heatmap.error.value?.message"
        :height="300"
        @retry="heatmap.refresh()"
      >
        <LazyBaseChart
          v-if="heatmapOptionComputed"
          :option="heatmapOptionComputed"
          :height="300"
          :label="tt('Orders by weekday and hour heatmap', '星期與時段訂單熱力圖')"
        />
      </ChartCard>
    </div>

    <section class="card" aria-labelledby="drill-title">
      <h2 id="drill-title" class="card__title">{{ tt('Drill-down explorer', '鑽取探索') }}</h2>
      <p class="card__subtitle">
        {{
          tt(
            'Start from a summary and click through to the underlying records.',
            '從彙總數據開始，逐層點擊到底層的明細紀錄。',
          )
        }}
      </p>
      <div class="drill-cards">
        <button type="button" class="drill-card" data-testid="drill-revenue" @click="openRevenue()">
          <AppIcon name="dollar" :size="20" />
          <b>{{ tt('Revenue', '營收') }}</b>
          <span>{{ tt('Month → day → product → orders', '月 → 日 → 商品 → 訂單') }}</span>
        </button>
        <button type="button" class="drill-card" data-testid="drill-category" @click="openCategory()">
          <AppIcon name="layers" :size="20" />
          <b>{{ tt('Product categories', '商品品類') }}</b>
          <span>{{ tt('Category → product ranking → product detail', '品類 → 商品排行 → 商品明細') }}</span>
        </button>
        <button type="button" class="drill-card" data-testid="drill-channel" @click="openChannel()">
          <AppIcon name="users" :size="20" />
          <b>{{ tt('Acquisition channels', '獲客渠道') }}</b>
          <span>{{ tt('Channel → funnel, conversion & behaviour', '渠道 → 漏斗、轉換與行為') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.an-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: space(3);

  &__tabs {
    min-width: 0;
    max-width: 100%;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: space(4);
  }
}

.an-summary {
  &__list {
    display: grid;
    gap: space(3);
    margin: space(4) 0 0;

    div {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: space(3);
      padding-bottom: space(3);
      border-bottom: 1px solid var(--color-border);
    }

    dt {
      color: var(--color-text-muted);
      font-size: fs('sm');
    }

    dd {
      margin: 0;
      font-weight: $font-weight-semibold;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
  }

  &__big {
    font-size: fs('xl');
  }

  &__note {
    margin-top: space(3);
  }
}

.drill-cards {
  display: grid;
  gap: space(3);
  margin-top: space(4);

  @include up('md') {
    grid-template-columns: repeat(3, 1fr);
  }
}

.drill-card {
  @include reset-button;
  display: grid;
  gap: space(1);
  padding: space(4);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  text-align: left;
  color: var(--color-primary);
  transition:
    border-color $transition-fast,
    background-color $transition-fast;
  @include focus-ring;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  b {
    color: var(--color-text);
  }

  span {
    font-size: fs('sm');
    color: var(--color-text-muted);
  }
}
</style>
