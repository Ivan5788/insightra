<script setup lang="ts">
/**
 * Data Table — every order, with server-side search / filter / sort / pagination.
 * Table state (search, status, sort, page) lives in the URL query so the
 * view is shareable and survives refresh; column visibility is a saved preference.
 */
import { computed, ref, watch } from 'vue'
import { categoryLabel, channelLabel, regionLabel } from '~/data/catalog'
import { ordersService } from '~/services/orders.service'
import type { OrderRow, OrdersQuery, SortDirection } from '~/types/analytics'
import type { OrderStatus } from '~/types/domain'
import type { DataColumn } from '~/types/table'
import { csvFilename, downloadTextFile, toCsv, type CsvColumn } from '~/utils/csv'
import { formatHour, formatShortDate, isValidISODate, todayISO } from '~/utils/date'
import { formatNumber } from '~/utils/format'

const { t, tt } = useI18n()
const route = useRoute()
const router = useRouter()
const filters = useFilterStore()
const settings = useSettingsStore()
const flags = useOrderFlagsStore()
const toast = useToast()

type SortKey = OrdersQuery['sortBy']
const SORT_KEYS: SortKey[] = ['date', 'total', 'units', 'customerName', 'id', 'status']
const STATUSES: OrderStatus[] = ['completed', 'pending', 'refunded', 'cancelled']

// ---- URL-backed table state -------------------------------------------------
const q = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : '')

const search = ref(q('search'))
const status = ref<OrderStatus | ''>(
  STATUSES.includes(q('status') as OrderStatus) ? (q('status') as OrderStatus) : '',
)
const day = ref(isValidISODate(q('day')) ? q('day') : '')
const sortBy = ref<SortKey>(SORT_KEYS.includes(q('sort') as SortKey) ? (q('sort') as SortKey) : 'date')
const sortDir = ref<SortDirection>(q('dir') === 'asc' ? 'asc' : 'desc')
const page = ref(Math.max(1, Number(q('page')) || 1))
const pageSize = ref([10, 20, 50, 100].includes(Number(q('size'))) ? Number(q('size')) : 20)
const selected = ref<string[]>([])

watch([search, status, day, sortBy, sortDir, pageSize], () => {
  page.value = 1
})
watch(
  () => filters.filterKey,
  () => {
    page.value = 1
    selected.value = []
  },
)

watch([search, status, day, sortBy, sortDir, page, pageSize], () => {
  router.replace({
    query: {
      ...route.query,
      search: search.value || undefined,
      status: status.value || undefined,
      day: day.value || undefined,
      sort: sortBy.value !== 'date' ? sortBy.value : undefined,
      dir: sortDir.value !== 'desc' ? sortDir.value : undefined,
      page: page.value > 1 ? String(page.value) : undefined,
      size: pageSize.value !== 20 ? String(pageSize.value) : undefined,
    },
  })
})

// ---- Data ---------------------------------------------------------------
const query = computed<OrdersQuery>(() => ({
  ...filters.apiFilter,
  search: search.value || undefined,
  status: status.value || undefined,
  day: day.value || undefined,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  page: page.value,
  pageSize: pageSize.value,
}))

const orders = useApiQuery(
  () => 'orders:' + JSON.stringify(query.value),
  () => ordersService.list(query.value),
  { ttl: 30_000 },
)
const rows = computed(() => orders.data.value?.items ?? [])
const total = computed(() => orders.data.value?.total ?? 0)

// ---- Columns ------------------------------------------------------------
const ALL_COLUMNS: DataColumn<OrderRow>[] = [
  { key: 'id', label: tt('Order', '訂單'), sortable: true, required: true },
  {
    key: 'date',
    label: tt('Date', '日期'),
    sortable: true,
    value: (r) => formatShortDate(r.date) + ' ' + formatHour(r.hour),
  },
  { key: 'customerName', label: tt('Customer', '顧客'), sortable: true },
  { key: 'segment', label: tt('Segment', '顧客類型'), hideOnMobile: true },
  { key: 'channel', label: tt('Channel', '渠道'), value: (r) => channelLabel(r.channel) },
  { key: 'region', label: tt('Region', '地區'), value: (r) => regionLabel(r.region), hideOnMobile: true },
  { key: 'products', label: tt('Products', '商品'), hideOnMobile: true },
  { key: 'units', label: tt('Units', '件數'), sortable: true, align: 'right', format: 'number' },
  { key: 'status', label: tt('Status', '狀態'), sortable: true },
  {
    key: 'total',
    label: tt('Amount', '金額'),
    sortable: true,
    align: 'right',
    format: 'currency',
    required: true,
  },
]

const columns = computed(() =>
  ALL_COLUMNS.filter((c) => c.required || !settings.settings.hiddenColumns.includes(c.key)),
)

function onSort(key: string): void {
  if (!SORT_KEYS.includes(key as SortKey)) return
  if (sortBy.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortBy.value = key as SortKey
    sortDir.value = key === 'customerName' || key === 'id' ? 'asc' : 'desc'
  }
}

// ---- Export & batch actions ----------------------------------------------
const CSV_COLUMNS: CsvColumn<OrderRow>[] = [
  { key: 'id', label: tt('Order ID', '訂單編號') },
  { key: 'date', label: tt('Date', '日期') },
  { key: 'hour', label: tt('Hour', '時段') },
  { key: 'customerId', label: tt('Customer ID', '顧客編號') },
  { key: 'customerName', label: tt('Customer', '顧客') },
  { key: 'segment', label: tt('Segment', '顧客類型') },
  { key: 'channel', label: tt('Channel', '渠道'), value: (r) => channelLabel(r.channel) },
  { key: 'region', label: tt('Region', '地區'), value: (r) => regionLabel(r.region) },
  {
    key: 'categories',
    label: tt('Categories', '品類'),
    value: (r) => r.categories.map((c) => categoryLabel(c)).join(' | '),
  },
  { key: 'products', label: tt('Products', '商品') },
  { key: 'units', label: tt('Units', '件數') },
  { key: 'status', label: tt('Status', '狀態'), value: (r) => statusLabel(r.status) },
  { key: 'total', label: tt('Amount (USD)', '金額（USD）') },
]

const exporting = ref(false)
const EXPORT_LIMIT = 5000

async function exportAll(): Promise<void> {
  exporting.value = true
  try {
    const result = await ordersService.list({ ...query.value, page: 1, pageSize: EXPORT_LIMIT })
    downloadTextFile(csvFilename('orders', todayISO()), toCsv(CSV_COLUMNS, result.items))
    if (result.total > EXPORT_LIMIT) {
      toast.warning(
        tt('Export limited', '匯出筆數受限'),
        tt(
          'First {a} of {b} rows exported. Narrow the filters to export the rest.',
          '已匯出 {b} 筆中的前 {a} 筆，請縮小篩選範圍以匯出其餘資料。',
          { a: formatNumber(EXPORT_LIMIT), b: formatNumber(result.total) },
        ),
      )
    } else {
      toast.success(
        tt('CSV exported', 'CSV 已匯出'),
        tt('{n} orders', '{n} 筆訂單', { n: formatNumber(result.total) }),
      )
    }
  } catch (e) {
    toast.error(tt('Export failed', '匯出失敗'), e instanceof Error ? e.message : undefined)
  } finally {
    exporting.value = false
  }
}

// Selected rows may span pages → keep the row objects we have seen.
const seen = new Map<string, OrderRow>()
watch(rows, (list) => list.forEach((r) => seen.set(r.id, r)), { immediate: true })

function exportSelected(): void {
  const list = selected.value.map((id) => seen.get(id)).filter((r): r is OrderRow => !!r)
  downloadTextFile(csvFilename('orders-selected', todayISO()), toCsv(CSV_COLUMNS, list))
  toast.success(
    tt('CSV exported', 'CSV 已匯出'),
    tt('{n} selected orders', '已選取的 {n} 筆訂單', { n: list.length }),
  )
}

function flagSelected(): void {
  flags.flag(selected.value)
  toast.success(
    tt('Flagged for review', '已標記待審查'),
    tt('{n} orders (saved in this browser)', '{n} 筆訂單（儲存在此瀏覽器）', { n: selected.value.length }),
  )
  selected.value = []
}

function unflagSelected(): void {
  flags.unflag(selected.value)
  toast.info(tt('Flags removed', '已移除標記'), tt('{n} orders', '{n} 筆訂單', { n: selected.value.length }))
  selected.value = []
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: tt('Completed', '已完成'),
  pending: tt('Pending', '處理中'),
  refunded: tt('Refunded', '已退款'),
  cancelled: tt('Cancelled', '已取消'),
}
function statusLabel(s: OrderStatus): string {
  return STATUS_LABEL[s] ?? s
}
const statusOptions = STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.data.title')" :subtitle="t('page.data.subtitle')">
      <template #actions>
        <GlobalFilterBar />
      </template>
    </PageHeader>

    <section class="card data-card">
      <div class="data-toolbar">
        <SearchInput
          v-model="search"
          class="data-toolbar__search"
          :placeholder="tt('Search order ID, customer or product…', '搜尋訂單編號、顧客或商品…')"
          :label="tt('Search orders', '搜尋訂單')"
        />
        <SelectInput
          v-model="status"
          :label="tt('Status', '狀態')"
          hide-label
          :placeholder="tt('All statuses', '所有狀態')"
          :options="statusOptions"
          class="data-toolbar__status"
        />
        <div class="data-toolbar__right">
          <ColumnToggle
            :columns="ALL_COLUMNS.map((c) => ({ key: c.key, label: c.label, required: c.required }))"
            :hidden="settings.settings.hiddenColumns"
            @toggle="settings.toggleColumn"
          />
          <BaseButton icon="download" :loading="exporting" data-testid="export-csv" @click="exportAll">{{
            t('common.exportCsv')
          }}</BaseButton>
        </div>
      </div>

      <div v-if="day" class="data-dayfilter">
        {{ tt('Showing orders on', '顯示訂單日期：') }} <b>{{ formatShortDate(day) }}</b>
        <button type="button" class="btn btn--ghost btn--sm" @click="day = ''">
          {{ tt('Clear day filter', '清除日期篩選') }}
        </button>
      </div>

      <Transition name="fade">
        <div
          v-if="selected.length"
          class="batch-bar"
          role="region"
          :aria-label="tt('Batch actions', '批次操作')"
        >
          <span class="batch-bar__count" data-testid="selected-count">{{
            tt('{n} selected', '已選取 {n} 筆', { n: selected.length })
          }}</span>
          <BaseButton size="sm" icon="download" @click="exportSelected">{{
            tt('Export selected', '匯出所選')
          }}</BaseButton>
          <BaseButton size="sm" icon="flag" @click="flagSelected">{{
            tt('Flag for review', '標記待審查')
          }}</BaseButton>
          <BaseButton size="sm" variant="ghost" @click="unflagSelected">{{
            tt('Remove flag', '移除標記')
          }}</BaseButton>
          <BaseButton size="sm" variant="ghost" icon="x" @click="selected = []">{{
            tt('Clear', '清除')
          }}</BaseButton>
        </div>
      </Transition>

      <ErrorState v-if="orders.error.value" :message="orders.error.value.message" @retry="orders.refresh()" />
      <template v-else>
        <div class="data-card__table" :class="{ 'is-refreshing': orders.pending.value && rows.length }">
          <DataTable
            v-model:selected="selected"
            :columns="columns"
            :rows="rows"
            :row-key="(r) => r.id"
            :sort-by="sortBy"
            :sort-dir="sortDir"
            :loading="orders.pending.value"
            selectable
            :caption="tt('Orders', '訂單')"
            :empty-title="tt('No orders found', '找不到訂單')"
            :empty-text="
              tt('Try a different search, status or date range.', '請嘗試其他關鍵字、狀態或日期範圍。')
            "
            @sort="onSort"
          >
            <template #cell-id="{ row }">
              <span class="order-id">
                <AppIcon
                  v-if="flags.isFlagged(row.id)"
                  name="flag"
                  :size="13"
                  class="order-id__flag"
                  :label="tt('Flagged for review', '已標記待審查')"
                />
                {{ row.id }}
              </span>
            </template>
            <template #cell-status="{ row }">
              <StatusBadge :status="row.status" />
            </template>
            <template #cell-products="{ row }">
              <span class="products-cell" :title="row.products">{{ row.products }}</span>
            </template>
          </DataTable>
        </div>
        <Pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="total"
          class="data-card__pagination"
        />
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
.data-card {
  display: flex;
  flex-direction: column;
  gap: space(4);

  &__table {
    margin: 0 calc(-1 * space(4));
    transition: opacity $transition-fast;

    @include up('md') {
      margin: 0 calc(-1 * space(5));
    }

    &.is-refreshing {
      opacity: 0.6;
    }

    @include down('md') {
      margin: 0;
    }
  }
}

.data-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: space(2);

  &__search {
    flex: 1 1 260px;
  }

  &__status {
    flex: 0 1 180px;
  }

  &__right {
    display: flex;
    gap: space(2);
    margin-left: auto;
  }
}

.data-dayfilter {
  display: flex;
  align-items: center;
  gap: space(2);
  font-size: fs('sm');
}

.batch-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: space(2);
  padding: space(2.5) space(3);
  border-radius: $radius-md;
  background: var(--color-primary-soft);

  &__count {
    font-weight: $font-weight-semibold;
    color: var(--color-primary-soft-text);
    margin-right: space(2);
  }
}

.order-id {
  display: inline-flex;
  align-items: center;
  gap: space(1);
  font-family: $font-mono;
  font-size: fs('xs');

  &__flag {
    color: var(--color-warning);
  }
}

.products-cell {
  display: inline-block;
  max-width: 220px;
  @include truncate;
  vertical-align: bottom;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-fast;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
