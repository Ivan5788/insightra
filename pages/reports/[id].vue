<script setup lang="ts">
/**
 * Report detail — uses the REPORT's own period (not the global filter),
 * so a "Last month" report always shows last month.
 * Export: CSV (data table) and PDF (browser print → "Save as PDF").
 */
import { computed, onMounted, ref } from 'vue'
import { presetLabel, REPORT_GRANULARITIES, REPORT_SCHEDULES, REPORT_TYPES } from '~/data/report-options'
import { analyticsService } from '~/services/analytics.service'
import type { MetricKey, SeriesMetricKey } from '~/types/analytics'
import type { ReportDefinition } from '~/types/app'
import { multiLineOption } from '~/utils/charts/options'
import { csvFilename, downloadTextFile, toCsv } from '~/utils/csv'
import { formatBucketLabel, formatLongDate, formatRange, resolvePreset, todayISO } from '~/utils/date'
import { formatValue } from '~/utils/format'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const route = useRoute()
const theme = useChartTheme()
const { confirm } = useConfirm()
const toast = useToast()
const reportsStore = useReportsStore()

const report = ref<ReportDefinition | null>(null)
const notFound = ref(false)

onMounted(async () => {
  await reportsStore.load()
  report.value = reportsStore.reports.find((r) => r.id === route.params.id) ?? null
  notFound.value = !report.value
})

useHead(() => ({ title: (report.value?.name ?? tt('Report', '報表')) + ' · Insightra' }))

const range = computed(() =>
  report.value ? resolvePreset(report.value.preset, todayISO(), report.value.customRange) : null,
)
const filter = computed(() => (range.value ? { from: range.value.from, to: range.value.to } : null))

const overview = useApiQuery(
  () =>
    filter.value
      ? 'overview:' +
        JSON.stringify({ ...filter.value, channel: undefined, category: undefined, region: undefined })
      : null,
  () => analyticsService.overview(filter.value!),
)
const series = useApiQuery(
  () =>
    filter.value && report.value
      ? 'report-ts:' + report.value.granularity + ':' + JSON.stringify(filter.value)
      : null,
  () => analyticsService.timeSeries(filter.value!, report.value!.granularity),
)

const seriesMetrics = computed(() =>
  (report.value?.metrics ?? []).filter((m): m is SeriesMetricKey => m !== 'revenueGrowth'),
)
const chartMetric = ref<SeriesMetricKey | null>(null)
const activeChartMetric = computed(() => chartMetric.value ?? seriesMetrics.value[0] ?? 'revenue')

const chartOption = computed(() => {
  const d = series.data.value
  if (!d) return null
  const m = activeChartMetric.value
  return multiLineOption(
    {
      categories: d.current.map((p) => formatBucketLabel(p.bucket, d.granularity)),
      series: [
        { name: metricInfo(m).label, data: d.current.map((p) => p.values[m]), color: theme.value.series[0] },
      ],
      format: metricInfo(m).format,
      area: true,
    },
    theme.value,
  )
})

const tableRows = computed(() =>
  (series.data.value?.current ?? []).map((p) => {
    const row: Record<string, string | number | null> = {
      period: formatBucketLabel(p.bucket, series.data.value!.granularity),
    }
    seriesMetrics.value.forEach((m) => (row[m] = p.values[m]))
    return row
  }),
)
const tableColumns = computed(() => [
  { key: 'period', label: tt('Period', '期間') },
  ...seriesMetrics.value.map((m) => ({
    key: m,
    label: metricInfo(m).shortLabel,
    format: metricInfo(m).format,
  })),
])

function exportCsv(): void {
  if (!report.value) return
  const csv = toCsv(
    tableColumns.value.map((c) => ({ key: c.key, label: c.label })),
    tableRows.value,
  )
  downloadTextFile(csvFilename(report.value.name, todayISO()), csv)
  toast.success(tt('CSV exported', 'CSV 已匯出'))
}

function exportPdf(): void {
  // Uses the print stylesheet (assets/scss/layout/_print.scss): the shell is hidden
  // and the browser dialog offers "Save as PDF".
  window.print()
}

async function remove(): Promise<void> {
  if (!report.value) return
  const ok = await confirm({
    title: tt('Delete report?', '刪除報表？'),
    message: tt('"{x}" will be deleted.', '「{x}」將被刪除。', { x: report.value.name }),
    confirmLabel: tt('Delete', '刪除'),
    danger: true,
  })
  if (!ok) return
  await reportsStore.remove([report.value.id])
  toast.success(tt('Report deleted', '報表已刪除'))
  await navigateTo('/reports')
}

const kpiKeys = computed<MetricKey[]>(() => report.value?.metrics ?? [])
</script>

<template>
  <div class="page">
    <EmptyState
      v-if="notFound"
      icon="file-text"
      :title="tt('Report not found', '找不到報表')"
      :description="tt('It may have been deleted.', '它可能已被刪除。')"
    >
      <BaseButton to="/reports" icon="arrow-left">{{ tt('Back to reports', '返回報表列表') }}</BaseButton>
    </EmptyState>

    <template v-else-if="report && range">
      <PageHeader
        :title="report.name"
        :subtitle="report.description"
        :breadcrumb="[{ label: tt('Reports', '報表'), to: '/reports' }, { label: report.name }]"
      >
        <template #actions>
          <div class="no-print report-actions">
            <BaseButton icon="download" @click="exportCsv">CSV</BaseButton>
            <BaseButton icon="printer" data-testid="export-pdf" @click="exportPdf">PDF</BaseButton>
            <BaseButton
              icon="trash"
              variant="ghost"
              icon-only
              :label="tt('Delete report', '刪除報表')"
              @click="remove"
            />
          </div>
        </template>
      </PageHeader>

      <dl class="report-meta card">
        <div>
          <dt>{{ tt('Type', '類型') }}</dt>
          <dd>{{ REPORT_TYPES.find((x) => x.value === report!.type)?.label }}</dd>
        </div>
        <div>
          <dt>{{ tt('Period', '期間') }}</dt>
          <dd>{{ presetLabel(report.preset) }} · {{ formatRange(range) }}</dd>
        </div>
        <div>
          <dt>{{ tt('Granularity', '時間粒度') }}</dt>
          <dd>{{ REPORT_GRANULARITIES.find((g) => g.value === report!.granularity)?.label }}</dd>
        </div>
        <div>
          <dt>{{ tt('Schedule', '排程') }}</dt>
          <dd>{{ REPORT_SCHEDULES.find((s) => s.value === report!.schedule)?.label }}</dd>
        </div>
        <div>
          <dt>{{ tt('Owner', '擁有者') }}</dt>
          <dd>{{ report.owner }}</dd>
        </div>
        <div>
          <dt>{{ tt('Generated', '產生時間') }}</dt>
          <dd>{{ formatLongDate(todayISO()) }} · {{ tt('simulated data', '模擬資料') }}</dd>
        </div>
      </dl>

      <div class="page-grid page-grid--kpi">
        <div v-for="key in kpiKeys" :key="key" class="card">
          <StatCard
            :label="metricInfo(key).label"
            :value="overview.data.value?.metrics[key].current ?? null"
            :format="metricInfo(key).format"
            :comparison="overview.data.value?.metrics[key]"
            :delta-unit="metricInfo(key).deltaUnit"
            :higher-is-better="metricInfo(key).higherIsBetter"
            :loading="overview.pending.value && !overview.data.value"
          />
        </div>
      </div>

      <ChartCard
        :title="tt('{x} over time', '{x}趨勢', { x: metricInfo(activeChartMetric).label })"
        :loading="series.pending.value && !series.data.value"
        :error="series.error.value?.message"
        :height="300"
        @retry="series.refresh()"
      >
        <template #actions>
          <SelectInput
            v-if="seriesMetrics.length > 1"
            :model-value="activeChartMetric"
            :label="tt('Chart metric', '圖表指標')"
            hide-label
            size="sm"
            :options="seriesMetrics.map((m) => ({ value: m, label: metricInfo(m).label }))"
            class="no-print"
            @update:model-value="(v) => (chartMetric = (v || null) as SeriesMetricKey | null)"
          />
        </template>
        <LazyBaseChart
          v-if="chartOption"
          :option="chartOption"
          :height="300"
          :label="tt('{x} report chart', '{x}報表圖表', { x: metricInfo(activeChartMetric).label })"
        />
      </ChartCard>

      <section class="card">
        <div class="card__header">
          <h2 class="card__title">{{ tt('Report data', '報表資料') }}</h2>
          <span class="text-sm text-muted">{{ tt('{n} rows', '{n} 列', { n: tableRows.length }) }}</span>
        </div>
        <div class="report-table">
          <ChartDataTable
            :caption="tt('{x} data', '{x}資料', { x: report.name })"
            :columns="tableColumns"
            :rows="tableRows"
          />
        </div>
        <p v-if="tableRows.length" class="report-total text-sm text-muted">
          {{ tt('Totals for the period:', '本期合計：') }}
          <template v-for="m in seriesMetrics" :key="m">
            <b>{{ metricInfo(m).shortLabel }}</b>
            {{ formatValue(overview.data.value?.metrics[m].current ?? null, metricInfo(m).format) }} ·
          </template>
        </p>
      </section>
    </template>

    <div v-else class="page-grid">
      <SkeletonBlock height="60px" />
      <SkeletonBlock height="300px" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.report-actions {
  display: flex;
  gap: space(2);
}

.report-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: space(3) space(5);
  margin: 0;

  dt {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  dd {
    margin: 0;
    font-weight: $font-weight-medium;
  }
}

.capitalize {
  text-transform: capitalize;
}

.report-table {
  overflow-x: auto;
}

.report-total {
  margin-top: space(3);
}
</style>
