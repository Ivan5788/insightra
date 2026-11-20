<script setup lang="ts">
/**
 * Users — customer growth, acquisition sources, regions, segments and
 * purchase-cohort retention. Total users and new users are shown in two
 * separate charts on purpose: their scales differ by 100× (no dual axis).
 */
import { computed } from 'vue'
import type { ChartClickEvent } from '~/types/charts'
import type { ChannelId } from '~/types/domain'
import { entityColor } from '~/utils/charts/colors'
import { barOption, donutOption, heatmapOption, trendLineOption } from '~/utils/charts/options'
import { formatBucketLabel, formatMonth, suggestGranularity } from '~/utils/date'
import { formatNumber } from '~/utils/format'

const { t, tt } = useI18n()
const filters = useFilterStore()
const theme = useChartTheme()
const { openChannel } = useDrillDown()

const users = useUsersOverview()
const retention = useRetention(6)
const g = computed(() => suggestGranularity(filters.range))
const GRAIN: Record<string, string> = {
  day: tt('day', '日'),
  week: tt('week', '週'),
  month: tt('month', '月'),
}

const kpis = computed(() => {
  const d = users.data.value
  return [
    {
      label: tt('Total users', '總用戶數'),
      value: d?.totalUsers,
      format: 'number' as const,
      unit: 'percent' as const,
      info: tt('Registered customers up to the end of the period.', '截至期間結束的累計註冊顧客數。'),
    },
    {
      label: tt('New users', '新用戶'),
      value: d?.newUsers,
      format: 'number' as const,
      unit: 'percent' as const,
      info: tt(
        'Registrations during the period (incl. first-time buyers).',
        '期間內的新註冊數（含首次購買者）。',
      ),
    },
    {
      label: tt('Active users (DAU)', '活躍用戶（DAU）'),
      value: d?.activeUsers,
      format: 'number' as const,
      unit: 'percent' as const,
      info: tt('Average daily active users.', '平均每日活躍用戶數。'),
    },
    {
      label: tt('Returning-customer orders', '回購訂單占比'),
      value: d?.returningRate,
      format: 'percent' as const,
      unit: 'pp' as const,
      info: tt(
        'Share of orders placed by customers who had ordered before.',
        '由曾經下過單的顧客所產生的訂單比例。',
      ),
    },
  ]
})

const totalOption = computed(() => {
  const d = users.data.value
  if (!d) return null
  return trendLineOption(
    {
      categories: d.growth.map((p) => formatBucketLabel(p.bucket, g.value)),
      current: d.growth.map((p) => p.total),
      name: tt('Total users', '總用戶數'),
      format: 'number',
      area: true,
      color: theme.value.series[6],
    },
    { ...theme.value },
  )
})

const newOption = computed(() => {
  const d = users.data.value
  if (!d) return null
  return barOption(
    {
      categories: d.growth.map((p) => formatBucketLabel(p.bucket, g.value)),
      series: [
        { name: tt('New users', '新用戶'), data: d.growth.map((p) => p.new), color: theme.value.series[0] },
      ],
      format: 'number',
    },
    theme.value,
  )
})

const sourceOption = computed(() => {
  const items = users.data.value?.bySource
  if (!items) return null
  return donutOption(
    {
      items: items.map((i) => ({
        name: i.label,
        value: i.value,
        color: entityColor(theme.value, 'channel', i.key),
      })),
      format: 'number',
      centerLabel: tt('New users', '新用戶'),
    },
    theme.value,
  )
})

function onSourceClick(e: ChartClickEvent): void {
  const item = users.data.value?.bySource.find((i) => i.label === e.name)
  if (item) openChannel(item.key as ChannelId)
}

const regionOption = computed(() => {
  const items = users.data.value?.byRegion
  if (!items) return null
  return barOption(
    {
      categories: items.map((i) => i.label),
      series: [{ name: tt('Customers', '顧客'), data: items.map((i) => i.value) }],
      format: 'number',
      horizontal: true,
    },
    theme.value,
  )
})

const segmentOption = computed(() => {
  const items = users.data.value?.bySegment
  if (!items) return null
  return donutOption(
    {
      items: items.map((i) => ({
        name: i.label,
        value: i.value,
        color: entityColor(theme.value, 'segment', i.key),
      })),
      format: 'number',
      centerLabel: tt('Customers', '顧客'),
    },
    theme.value,
  )
})

const retentionOption = computed(() => {
  const r = retention.data.value
  if (!r) return null
  const cells: [number, number, number | null][] = []
  r.cohorts.forEach((c, y) => c.retention.forEach((v, x) => cells.push([x, y, v])))
  return heatmapOption(
    {
      xLabels: Array.from({ length: r.months }, (_, i) => tt('Month {n}', '第 {n} 個月', { n: i })),
      yLabels: r.cohorts.map((c) => formatMonth(c.cohort) + ' (' + formatNumber(c.size) + ')'),
      cells,
      max: 40,
      format: 'percent',
      valueLabel: tt('Retention', '留存率'),
      showLabels: true,
    },
    theme.value,
  )
})

const retentionRows = computed(() =>
  (retention.data.value?.cohorts ?? []).map((c) => {
    const row: Record<string, string | number | null> = { cohort: formatMonth(c.cohort), size: c.size }
    c.retention.forEach((v, i) => (row['m' + i] = v))
    return row
  }),
)
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.users.title')" :subtitle="t('page.users.subtitle')">
      <template #actions>
        <GlobalFilterBar />
      </template>
    </PageHeader>

    <ErrorState v-if="users.error.value" :message="users.error.value.message" @retry="users.refresh()" />

    <div class="page-grid page-grid--kpi">
      <div v-for="k in kpis" :key="k.label" class="card">
        <StatCard
          :label="k.label"
          :value="k.value?.current ?? null"
          :format="k.format"
          :comparison="k.value"
          :delta-unit="k.unit"
          :info="k.info"
          :loading="users.pending.value && !users.data.value"
          :show-comparison="filters.compare"
        />
      </div>
    </div>

    <div class="page-grid page-grid--2">
      <ChartCard
        :title="tt('User growth', '用戶成長')"
        :subtitle="tt('Total registered users (cumulative)', '累計註冊用戶數')"
        :loading="users.pending.value && !users.data.value"
        :height="280"
      >
        <LazyBaseChart
          v-if="totalOption"
          :option="totalOption"
          :height="280"
          :label="tt('Total users growth chart', '總用戶成長圖')"
        />
      </ChartCard>
      <ChartCard
        :title="tt('New users', '新用戶')"
        :subtitle="tt('New registrations per {g}', '每{g}新註冊數', { g: GRAIN[g] })"
        :loading="users.pending.value && !users.data.value"
        :height="280"
      >
        <LazyBaseChart
          v-if="newOption"
          :option="newOption"
          :height="280"
          :label="tt('New users per period bar chart', '各期新用戶長條圖')"
        />
      </ChartCard>
    </div>

    <div class="page-grid page-grid--3">
      <ChartCard
        :title="tt('User sources', '用戶來源')"
        :subtitle="tt('New users by channel · click to drill down', '各渠道新用戶 · 點擊可鑽取')"
        :loading="users.pending.value && !users.data.value"
        :height="300"
        table-toggle
      >
        <LazyBaseChart
          v-if="sourceOption"
          :option="sourceOption"
          :height="300"
          clickable
          :label="tt('User sources donut chart', '用戶來源環圈圖')"
          @click="onSourceClick"
        />
        <template #table>
          <ChartDataTable
            :caption="tt('New users by channel', '各渠道新用戶')"
            :columns="[
              { key: 'label', label: tt('Channel', '渠道') },
              { key: 'value', label: tt('New users', '新用戶'), format: 'number' },
              { key: 'share', label: tt('Share', '占比'), format: 'percent' },
            ]"
            :rows="
              (users.data.value?.bySource ?? []).map((i) => ({
                label: i.label,
                value: i.value,
                share: i.share,
              }))
            "
          />
        </template>
      </ChartCard>
      <ChartCard
        :title="tt('Customers by region', '各地區顧客')"
        :subtitle="tt('Customers who ordered in the period', '期間內有下單的顧客')"
        :loading="users.pending.value && !users.data.value"
        :height="300"
      >
        <LazyBaseChart
          v-if="regionOption"
          :option="regionOption"
          :height="300"
          :label="tt('Customers by region bar chart', '各地區顧客長條圖')"
        />
      </ChartCard>
      <ChartCard
        :title="tt('Customer types', '顧客類型')"
        :subtitle="tt('Loyalty tier of active customers', '活躍顧客的會員等級')"
        :loading="users.pending.value && !users.data.value"
        :height="300"
      >
        <LazyBaseChart
          v-if="segmentOption"
          :option="segmentOption"
          :height="300"
          :label="tt('Customer types donut chart', '顧客類型環圈圖')"
        />
      </ChartCard>
    </div>

    <ChartCard
      :title="tt('Retention by purchase cohort', '購買世代留存')"
      :subtitle="
        tt(
          '% of customers (grouped by first-order month) who ordered again in later months',
          '依首購月份分群，之後各月份再次下單的顧客比例',
        )
      "
      :info="
        tt(
          'Month 0 is the month of the first purchase (100% by definition). Empty cells are months that have not happened yet.',
          '第 0 個月為首購當月（依定義為 100%）。空白格代表尚未到來的月份。',
        )
      "
      :loading="retention.pending.value && !retention.data.value"
      :error="retention.error.value?.message"
      :height="320"
      table-toggle
      @retry="retention.refresh()"
    >
      <LazyBaseChart
        v-if="retentionOption"
        :option="retentionOption"
        :height="320"
        :label="tt('Retention cohort heatmap', '世代留存熱力圖')"
      />
      <template #table>
        <ChartDataTable
          :caption="tt('Retention cohorts', '留存世代')"
          :columns="[
            { key: 'cohort', label: tt('Cohort', '世代') },
            { key: 'size', label: tt('Customers', '顧客'), format: 'number' },
            ...Array.from({ length: retention.data.value?.months ?? 6 }, (_, i) => ({
              key: 'm' + i,
              label: tt('M{n}', '第{n}月', { n: i }),
              format: 'percent' as const,
            })),
          ]"
          :rows="retentionRows"
        />
      </template>
    </ChartCard>
  </div>
</template>
