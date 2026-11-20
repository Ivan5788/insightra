<script setup lang="ts">
/**
 * Generic renderer for ANY drill level (DrillView from the API):
 *   current filters · KPI row · chart (switchable type / tabs) · detail table
 * Clicking a chart point or a table row emits `drill` with the next level.
 * Because every level has the same shape, no level needs its own component.
 */
import { computed, ref, watch } from 'vue'
import type { ChartClickEvent } from '~/types/charts'
import type { DrillChartType, DrillLevel, DrillRow, DrillView } from '~/types/drilldown'
import { drillChartHeight, drillChartOption } from '~/utils/charts/drill'
import { csvFilename, downloadTextFile, toCsv } from '~/utils/csv'
import { todayISO } from '~/utils/date'
import { formatValue } from '~/utils/format'

const { tt } = useI18n()

const props = defineProps<{ view: DrillView }>()
const emit = defineEmits<{ drill: [level: DrillLevel] }>()

const theme = useChartTheme()
const activeChartId = ref(props.view.charts[0]?.id ?? '')
const chartType = ref<DrillChartType>(props.view.charts[0]?.type ?? 'bar')

// New level loaded → reset chart tabs/type.
watch(
  () => props.view,
  (v) => {
    activeChartId.value = v.charts[0]?.id ?? ''
    chartType.value = v.charts[0]?.type ?? 'bar'
  },
)

const activeChart = computed(
  () => props.view.charts.find((c) => c.id === activeChartId.value) ?? props.view.charts[0],
)

watch(activeChartId, () => {
  if (activeChart.value) chartType.value = activeChart.value.type
})

const option = computed(() =>
  activeChart.value ? drillChartOption(activeChart.value, chartType.value, theme.value) : null,
)
const height = computed(() =>
  activeChart.value ? drillChartHeight(activeChart.value, chartType.value) : 280,
)

const typeLabels: Record<DrillChartType, string> = {
  bar: tt('Bar', '長條'),
  line: tt('Line', '折線'),
  pie: tt('Pie', '圓餅'),
  funnel: tt('Funnel', '漏斗'),
}

function onChartClick(event: ChartClickEvent): void {
  const chart = activeChart.value
  if (!chart?.linkedToRows) return
  // Pie charts may fold small slices into "Other" → match by name instead of index.
  const row =
    chartType.value === 'pie'
      ? props.view.rows.find((r) => Object.values(r.cells).includes(event.name))
      : props.view.rows[event.dataIndex]
  if (row?.next) emit('drill', row.next)
}

function onRow(row: DrillRow): void {
  if (row.next) emit('drill', row.next)
}

function exportCsv(): void {
  const csv = toCsv(
    props.view.columns.map((c) => ({
      key: c.key,
      label: c.label,
      value: (row: DrillRow) => row.cells[c.key],
    })),
    props.view.rows,
  )
  downloadTextFile(csvFilename(props.view.title, todayISO()), csv)
}
</script>

<template>
  <div class="drill-view">
    <ul class="drill-view__filters" role="list" :aria-label="tt('Current filters', '目前篩選條件')">
      <li v-for="f in view.filters" :key="f.label" class="drill-view__filter">
        <span>{{ f.label }}</span> <b>{{ f.value }}</b>
      </li>
    </ul>

    <div class="drill-view__kpis">
      <div v-for="k in view.kpis" :key="k.label" class="drill-view__kpi">
        <span class="drill-view__kpi-label">{{ k.label }}</span>
        <span class="drill-view__kpi-value">{{ formatValue(k.value, k.format, { compact: true }) }}</span>
        <span v-if="k.hint" class="drill-view__kpi-hint">{{ k.hint }}</span>
      </div>
    </div>

    <section v-if="activeChart && option" class="card drill-view__chart">
      <div class="drill-view__chart-head">
        <SegmentedControl
          v-if="view.charts.length > 1"
          v-model="activeChartId"
          size="sm"
          :label="tt('Chart', '圖表')"
          :options="view.charts.map((c) => ({ value: c.id, label: c.label }))"
        />
        <h3 v-else class="drill-view__chart-title">{{ activeChart.label }}</h3>
        <SegmentedControl
          v-if="activeChart.allowedTypes.length > 1"
          v-model="chartType"
          size="sm"
          :label="tt('Chart type', '圖表類型')"
          :options="activeChart.allowedTypes.map((t) => ({ value: t, label: typeLabels[t] }))"
        />
      </div>
      <EmptyState
        v-if="activeChart.categories.length === 0"
        compact
        :title="tt('No data for this selection', '此選擇沒有資料')"
      />
      <LazyBaseChart
        v-else
        :option="option"
        :height="height"
        :clickable="activeChart.linkedToRows"
        :label="activeChart.label"
        @click="onChartClick"
      />
    </section>

    <section class="card drill-view__table-card">
      <div class="drill-view__table-head">
        <div>
          <h3 class="drill-view__chart-title">{{ tt('Details', '明細') }}</h3>
          <p v-if="view.nextHint" class="drill-view__hint">
            <AppIcon name="layers" :size="14" /> {{ view.nextHint }}
          </p>
        </div>
        <BaseButton size="sm" icon="download" @click="exportCsv">CSV</BaseButton>
      </div>
      <EmptyState v-if="view.rows.length === 0" compact :title="tt('No rows', '沒有資料列')" />
      <div v-else class="drill-view__table-wrap">
        <table class="drill-table">
          <caption class="sr-only">
            {{
              view.title
            }}
            details
          </caption>
          <thead>
            <tr>
              <th v-for="c in view.columns" :key="c.key" scope="col" :class="{ num: c.align === 'right' }">
                {{ c.label }}
              </th>
              <th v-if="view.rows.some((r) => r.next)" scope="col">
                <span class="sr-only">{{ tt('Drill down', '往下鑽取') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in view.rows"
              :key="row.id"
              :class="{ 'is-clickable': !!row.next }"
              @click="onRow(row)"
            >
              <td v-for="c in view.columns" :key="c.key" :class="{ num: c.align === 'right' }">
                <StatusBadge
                  v-if="c.key === 'status' && row.cells.status"
                  :status="String(row.cells.status)"
                />
                <template v-else>{{ formatValue(row.cells[c.key] ?? null, c.format) }}</template>
              </td>
              <td v-if="view.rows.some((r) => r.next)" class="drill-table__go">
                <button
                  v-if="row.next"
                  type="button"
                  class="drill-table__btn"
                  :aria-label="tt('Drill into {x}', '鑽取「{x}」', { x: row.next.label })"
                  @click.stop="onRow(row)"
                >
                  <AppIcon name="chevron-right" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.drill-view {
  display: grid;
  gap: space(4);

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
    margin: 0;
    padding: 0;
  }

  &__filter {
    padding: space(1) space(2.5);
    border-radius: $radius-full;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    font-size: fs('xs');

    span {
      color: var(--color-text-muted);
    }
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: space(3);

    @include up('md') {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }

  &__kpi {
    @include card-surface;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: space(3) space(4);
  }

  &__kpi-label {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  &__kpi-value {
    font-size: fs('lg');
    font-weight: $font-weight-bold;
    font-variant-numeric: tabular-nums;
  }

  &__kpi-hint {
    font-size: fs('xs');
    color: var(--color-text-secondary);
  }

  &__chart-head,
  &__table-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(2);
    margin-bottom: space(3);
  }

  &__chart-title {
    font-size: fs('md');
    font-weight: $font-weight-semibold;
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: space(1);
    margin-top: 2px;
    font-size: fs('xs');
    color: var(--color-primary);
  }

  &__table-wrap {
    overflow-x: auto;
    margin: 0 calc(-1 * space(4));
    @include scrollbar-thin;

    @include up('md') {
      margin: 0 calc(-1 * space(5));
    }
  }
}

.drill-table {
  font-size: fs('sm');

  th,
  td {
    padding: space(2.5) space(4);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    white-space: nowrap;

    @include up('md') {
      padding: space(2.5) space(5);
    }
  }

  th {
    font-size: fs('xs');
    font-weight: $font-weight-semibold;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  tr.is-clickable {
    cursor: pointer;

    &:hover td {
      background: var(--color-surface-hover);
    }
  }

  &__go {
    width: 40px;
    padding-left: 0 !important;
  }

  &__btn {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: $radius-md;
    color: var(--color-primary);
    @include focus-ring(0);

    &:hover {
      background: var(--color-primary-soft);
    }
  }
}
</style>
