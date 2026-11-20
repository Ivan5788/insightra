<script setup lang="ts">
/**
 * Sales — overview, trend, monthly target, categories, product ranking,
 * regions, sales channels and price/volume correlation.
 */
import { computed } from 'vue'
import { categoryLabel, getProduct } from '~/data/catalog'
import type { MetricKey } from '~/types/analytics'
import type { ChartClickEvent } from '~/types/charts'
import type { CategoryId, ChannelId } from '~/types/domain'
import type { DataColumn } from '~/types/table'
import { entityColor } from '~/utils/charts/colors'
import { barOption, donutOption, gaugeOption, scatterOption, trendLineOption } from '~/utils/charts/options'
import { formatBucketLabel, formatMonth } from '~/utils/date'
import { formatCurrency } from '~/utils/format'
import { metricInfo } from '~/utils/metrics'

const { t, tt } = useI18n()
const filters = useFilterStore()
const theme = useChartTheme()
const { openCategory, openProduct, openChannel } = useDrillDown()

// KPIs (shares the cached overview request with the dashboard)
const overview = useOverview()
const KPI_KEYS: MetricKey[] = ['revenue', 'orders', 'unitsSold', 'aov', 'refundRate']

// Trend
const series = useTimeSeries()
const trendOption = computed(() => {
  const d = series.data.value
  if (!d) return null
  return trendLineOption(
    {
      categories: d.current.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      current: d.current.map((p) => p.values.revenue),
      previous: filters.compare ? d.previous.map((p) => p.values.revenue) : undefined,
      name: tt('Revenue', '營收'),
      previousName: tt('Previous period', '前期'),
      format: 'currency',
      area: true,
      zoom: d.current.length > 45,
    },
    theme.value,
  )
})

// Target gauge
const target = useTarget()
const gauge = computed(() =>
  target.data.value
    ? gaugeOption(
        target.data.value.progress,
        tt('{m} target', '{m}目標', { m: formatMonth(target.data.value.month) }),
        theme.value,
      )
    : null,
)

// Category stacked bar (revenue per category over time)
const byCategory = useSeriesBy(
  () => 'category',
  () => 'revenue',
)
const categoryStack = computed(() => {
  const s = byCategory.data.value
  if (!s) return null
  return barOption(
    {
      categories: s.buckets.map((b) => formatBucketLabel(b, filters.effectiveGranularity)),
      series: s.series.map((x) => ({
        name: x.label,
        data: x.values,
        color: entityColor(theme.value, 'category', x.key),
      })),
      format: 'currency',
      stacked: true,
      zoom: s.buckets.length > 45,
    },
    theme.value,
  )
})

function onCategoryClick(e: ChartClickEvent): void {
  const key = byCategory.data.value?.series.find((s) => s.label === e.seriesName)?.key
  if (key) openCategory(key as CategoryId)
}

// Category donut
const categoryShare = useBreakdown(
  () => 'category',
  () => 'revenue',
)
const categoryDonut = computed(() => {
  const items = categoryShare.data.value?.items
  if (!items) return null
  return donutOption(
    {
      items: items.map((i) => ({
        name: i.label,
        value: i.value,
        color: entityColor(theme.value, 'category', i.key),
      })),
      format: 'currency',
      centerLabel: tt('Revenue', '營收'),
    },
    theme.value,
  )
})

function onDonutClick(e: ChartClickEvent): void {
  const item = categoryShare.data.value?.items.find((i) => i.label === e.name)
  if (item) openCategory(item.key as CategoryId)
}

// Products (ranking table + scatter)
const products = useBreakdown(
  () => 'product',
  () => 'revenue',
)
interface ProductRow {
  rank: number
  key: string
  label: string
  category: string
  units: number
  orders: number
  revenue: number
  share: number
  deltaPercent: number | null
}
const productRows = computed<ProductRow[]>(() =>
  (products.data.value?.items ?? []).slice(0, 10).map((i, idx) => ({
    rank: idx + 1,
    key: i.key,
    label: i.label,
    category: categoryLabel(getProduct(i.key)?.category ?? ''),
    units: Number(i.extra.unitsSold ?? 0),
    orders: Number(i.extra.orders ?? 0),
    revenue: i.value,
    share: i.share,
    deltaPercent: i.deltaPercent,
  })),
)
const productColumns: DataColumn<ProductRow>[] = [
  { key: 'label', label: tt('Product', '商品'), required: true },
  { key: 'category', label: tt('Category', '品類'), hideOnMobile: true },
  { key: 'units', label: tt('Units', '件數'), align: 'right', format: 'number' },
  { key: 'orders', label: tt('Orders', '訂單'), align: 'right', format: 'number', hideOnMobile: true },
  { key: 'revenue', label: tt('Revenue', '營收'), align: 'right', format: 'currency' },
  { key: 'share', label: tt('Share', '占比'), align: 'right', format: 'percent', hideOnMobile: true },
  { key: 'deltaPercent', label: tt('vs prev.', '較前期'), align: 'right' },
]

// Scatter: one colour (no category colouring: > 3 colours fail CVD checks on scatter)
const scatter = computed(() => {
  const items = products.data.value?.items
  if (!items?.length) return null
  return scatterOption(
    {
      groups: [{ name: tt('Products', '商品'), color: theme.value.series[0]! }],
      points: items
        .filter((i) => (i.extra.unitsSold ?? 0) > 0)
        .map((i) => ({
          name: i.label,
          x: Number(i.extra.price ?? 0),
          y: Number(i.extra.unitsSold ?? 0),
          size: i.value,
          group: tt('Products', '商品'),
        })),
      xName: tt('List price', '定價'),
      yName: tt('Units sold', '銷售件數'),
      xFormat: 'currency',
      yFormat: 'number',
      sizeFormat: 'currency',
    },
    theme.value,
  )
})

// Regions (horizontal bar = geographic distribution)
const regions = useBreakdown(
  () => 'region',
  () => 'revenue',
)
const regionBar = computed(() => {
  const items = regions.data.value?.items
  if (!items) return null
  return barOption(
    {
      categories: items.map((i) => i.label),
      series: [{ name: tt('Revenue', '營收'), data: items.map((i) => i.value) }],
      format: 'currency',
      horizontal: true,
    },
    theme.value,
  )
})

// Sales channels
const channels = useBreakdown(
  () => 'channel',
  () => 'revenue',
)
const channelBar = computed(() => {
  const items = channels.data.value?.items
  if (!items) return null
  return barOption(
    {
      categories: items.map((i) => i.label),
      series: [{ name: tt('Revenue', '營收'), data: items.map((i) => i.value) }],
      itemColors: items.map((i) => entityColor(theme.value, 'channel', i.key)),
      format: 'currency',
      horizontal: true,
    },
    theme.value,
  )
})

function onChannelClick(e: ChartClickEvent): void {
  const item = channels.data.value?.items[e.dataIndex]
  if (item) openChannel(item.key as ChannelId)
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.sales.title')" :subtitle="t('page.sales.subtitle')">
      <template #actions>
        <GlobalFilterBar />
      </template>
    </PageHeader>

    <div class="page-grid page-grid--kpi">
      <div v-for="key in KPI_KEYS" :key="key" class="card">
        <StatCard
          :label="metricInfo(key).label"
          :value="overview.data.value?.metrics[key].current ?? null"
          :format="metricInfo(key).format"
          :comparison="overview.data.value?.metrics[key]"
          :delta-unit="metricInfo(key).deltaUnit"
          :higher-is-better="metricInfo(key).higherIsBetter"
          :info="metricInfo(key).description"
          :loading="overview.pending.value && !overview.data.value"
          :show-comparison="filters.compare"
        />
      </div>
    </div>

    <div class="page-grid page-grid--wide-left">
      <ChartCard
        :title="tt('Sales trend', '銷售趨勢')"
        :subtitle="tt('Net revenue, current vs previous period', '淨營收，本期與前期比較')"
        :loading="series.pending.value && !series.data.value"
        :refreshing="series.pending.value && !!series.data.value"
        :error="series.error.value?.message"
        :height="300"
        @retry="series.refresh()"
      >
        <LazyBaseChart
          v-if="trendOption"
          :option="trendOption"
          :height="300"
          :label="tt('Sales trend chart', '銷售趨勢圖')"
        />
      </ChartCard>

      <ChartCard
        :title="tt('Monthly target', '月目標')"
        :info="
          tt(
            'Target = previous full month revenue × 1.10. Progress counts net revenue month-to-date.',
            '目標 = 上個完整月份營收 × 1.10；進度以本月至今的淨營收計算。',
          )
        "
        :loading="target.pending.value && !target.data.value"
        :error="target.error.value?.message"
        :height="300"
        @retry="target.refresh()"
      >
        <LazyBaseChart
          v-if="gauge"
          :option="gauge"
          :height="220"
          :label="tt('Monthly revenue target gauge', '月營收目標儀表')"
        />
        <dl v-if="target.data.value" class="target-facts">
          <div>
            <dt>{{ tt('Achieved', '已達成') }}</dt>
            <dd>{{ formatCurrency(target.data.value.achieved, { compact: true }) }}</dd>
          </div>
          <div>
            <dt>{{ tt('Target', '目標') }}</dt>
            <dd>{{ formatCurrency(target.data.value.target, { compact: true }) }}</dd>
          </div>
          <div>
            <dt>{{ tt('Days left', '剩餘天數') }}</dt>
            <dd>{{ target.data.value.daysInMonth - target.data.value.daysElapsed }}</dd>
          </div>
        </dl>
      </ChartCard>
    </div>

    <div class="page-grid page-grid--wide-left">
      <ChartCard
        :title="tt('Revenue by category', '各品類營收')"
        :subtitle="tt('Stacked by period · click a segment to drill down', '依期間堆疊 · 點擊區段可鑽取')"
        :loading="byCategory.pending.value && !byCategory.data.value"
        :error="byCategory.error.value?.message"
        :height="320"
        @retry="byCategory.refresh()"
      >
        <LazyBaseChart
          v-if="categoryStack"
          :option="categoryStack"
          :height="320"
          clickable
          :label="tt('Revenue by category stacked bar chart', '各品類營收堆疊長條圖')"
          @click="onCategoryClick"
        />
      </ChartCard>

      <ChartCard
        :title="tt('Category share', '品類占比')"
        :subtitle="tt('Click a slice to see its products', '點擊扇區查看該品類商品')"
        :loading="categoryShare.pending.value && !categoryShare.data.value"
        :error="categoryShare.error.value?.message"
        :height="320"
        table-toggle
        @retry="categoryShare.refresh()"
      >
        <LazyBaseChart
          v-if="categoryDonut"
          :option="categoryDonut"
          :height="320"
          clickable
          :label="tt('Category share donut chart', '品類占比環圈圖')"
          @click="onDonutClick"
        />
        <template #table>
          <ChartDataTable
            :caption="tt('Revenue by category', '各品類營收')"
            :columns="[
              { key: 'label', label: tt('Category', '品類') },
              { key: 'value', label: tt('Revenue', '營收'), format: 'currency' },
              { key: 'share', label: tt('Share', '占比'), format: 'percent' },
            ]"
            :rows="
              (categoryShare.data.value?.items ?? []).map((i) => ({
                label: i.label,
                value: i.value,
                share: i.share,
              }))
            "
          />
        </template>
      </ChartCard>
    </div>

    <section class="card">
      <div class="card__header">
        <div>
          <h2 class="card__title">{{ tt('Top 10 products', '前 10 名商品') }}</h2>
          <p class="card__subtitle">
            {{
              tt(
                'Ranked by net revenue · click a product for its sales detail',
                '依淨營收排名 · 點擊商品查看銷售明細',
              )
            }}
          </p>
        </div>
      </div>
      <ErrorState
        v-if="products.error.value"
        compact
        :message="products.error.value.message"
        @retry="products.refresh()"
      />
      <DataTable
        v-else
        :columns="productColumns"
        :rows="productRows"
        :row-key="(r) => r.key"
        :loading="products.pending.value && !products.data.value"
        :caption="tt('Top products by revenue', '營收最高的商品')"
        clickable-rows
        @row-click="(r) => openProduct(r.key)"
      >
        <template #cell-label="{ row }">
          <span class="product-cell"
            ><span class="product-cell__rank">{{ row.rank }}</span
            >{{ row.label }}</span
          >
        </template>
        <template #cell-deltaPercent="{ row }">
          <DeltaBadge
            :direction="
              row.deltaPercent === null
                ? 'none'
                : row.deltaPercent > 0
                  ? 'up'
                  : row.deltaPercent < 0
                    ? 'down'
                    : 'flat'
            "
            :value="row.deltaPercent"
            size="sm"
          />
        </template>
      </DataTable>
    </section>

    <div class="page-grid page-grid--3">
      <ChartCard
        :title="tt('Sales by region', '各地區銷售')"
        :subtitle="tt('Geographic distribution of revenue', '營收的地理分布')"
        :info="
          tt(
            'Shown as ranked bars instead of a map: 7 markets of very different size compare more precisely by length than by colour on a map.',
            '以排序長條取代地圖：7 個規模差異很大的市場，用長度比較比地圖上的顏色更精確。',
          )
        "
        :loading="regions.pending.value && !regions.data.value"
        :error="regions.error.value?.message"
        :height="280"
        @retry="regions.refresh()"
      >
        <LazyBaseChart
          v-if="regionBar"
          :option="regionBar"
          :height="280"
          :label="tt('Revenue by region bar chart', '各地區營收長條圖')"
        />
      </ChartCard>

      <ChartCard
        :title="tt('Sales channels', '銷售渠道')"
        :subtitle="tt('Revenue by acquisition source · click to drill down', '各獲客來源營收 · 點擊可鑽取')"
        :loading="channels.pending.value && !channels.data.value"
        :error="channels.error.value?.message"
        :height="280"
        @retry="channels.refresh()"
      >
        <LazyBaseChart
          v-if="channelBar"
          :option="channelBar"
          :height="280"
          clickable
          :label="tt('Revenue by channel bar chart', '各渠道營收長條圖')"
          @click="onChannelClick"
        />
      </ChartCard>

      <ChartCard
        :title="tt('Price vs volume', '價格與銷量')"
        :subtitle="tt('Each bubble is a product · size = revenue', '每個泡泡代表一項商品 · 大小 = 營收')"
        :info="
          tt(
            'Correlation between list price and units sold. Use the Category filter to focus on one category.',
            '定價與銷售件數的相關性。可用品類篩選聚焦單一品類。',
          )
        "
        :loading="products.pending.value && !products.data.value"
        :error="products.error.value?.message"
        :height="280"
        @retry="products.refresh()"
      >
        <LazyBaseChart
          v-if="scatter"
          :option="scatter"
          :height="280"
          :label="tt('Price versus units sold scatter chart', '價格與銷售件數散佈圖')"
        />
      </ChartCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.target-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: space(2);
  margin: 0;
  text-align: center;

  dt {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
    font-weight: $font-weight-semibold;
  }
}

.product-cell {
  display: inline-flex;
  align-items: center;
  gap: space(2.5);
  font-weight: $font-weight-medium;

  &__rank {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: $radius-sm;
    background: var(--color-surface-2);
    font-size: fs('xs');
    color: var(--color-text-secondary);
  }
}
</style>
