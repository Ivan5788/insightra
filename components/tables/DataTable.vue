<script setup lang="ts" generic="T extends object">
/**
 * Generic, typed data table.
 *  - sortable headers (emits `sort`; parent decides client vs server sorting)
 *  - row selection with "select all on page" (+ indeterminate state)
 *  - custom cells through scoped slots: <template #cell-status="{ row }">
 *  - responsive: real <table> on desktop, stacked cards on phones
 *    (a wide table squeezed onto 375px is unusable)
 */
import { computed } from 'vue'
import type { SortDirection } from '~/types/analytics'
import type { DataColumn } from '~/types/table'
import { formatValue } from '~/utils/format'

import { tt } from '~/utils/locale'

const props = withDefaults(
  defineProps<{
    columns: DataColumn<T>[]
    rows: T[]
    rowKey: (row: T) => string
    sortBy?: string
    sortDir?: SortDirection
    selectable?: boolean
    selected?: string[]
    loading?: boolean
    caption: string
    emptyTitle?: string
    emptyText?: string
    clickableRows?: boolean
  }>(),
  { selected: () => [] },
)

const emit = defineEmits<{
  sort: [key: string]
  'update:selected': [ids: string[]]
  rowClick: [row: T]
}>()

const selectedSet = computed(() => new Set(props.selected))
const pageIds = computed(() => props.rows.map(props.rowKey))
const allSelected = computed(
  () => pageIds.value.length > 0 && pageIds.value.every((id) => selectedSet.value.has(id)),
)
const someSelected = computed(
  () => !allSelected.value && pageIds.value.some((id) => selectedSet.value.has(id)),
)

function cellValue(row: T, col: DataColumn<T>): string {
  const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key]
  return formatValue((raw ?? null) as string | number | null, col.format ?? 'text')
}

function toggleRow(id: string): void {
  const next = new Set(selectedSet.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:selected', [...next])
}

function toggleAll(): void {
  const next = new Set(selectedSet.value)
  if (allSelected.value) pageIds.value.forEach((id) => next.delete(id))
  else pageIds.value.forEach((id) => next.add(id))
  emit('update:selected', [...next])
}

function ariaSort(col: DataColumn<T>): 'ascending' | 'descending' | 'none' | undefined {
  if (!col.sortable) return undefined
  if (props.sortBy !== col.key) return 'none'
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="data-table" :aria-busy="loading">
    <!-- Desktop / tablet: semantic table -->
    <div class="data-table__scroll">
      <table class="data-table__table">
        <caption class="sr-only">
          {{
            caption
          }}
        </caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="data-table__check">
              <input
                type="checkbox"
                class="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                :aria-label="tt('Select all rows on this page', '全選本頁')"
                data-testid="select-all"
                @change="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :class="['align-' + (col.align ?? 'left')]"
              :style="col.width ? { width: col.width } : undefined"
              :aria-sort="ariaSort(col)"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="data-table__sort"
                @click="emit('sort', col.key)"
              >
                {{ col.label }}
                <AppIcon
                  :name="
                    sortBy === col.key ? (sortDir === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevron-down'
                  "
                  :size="13"
                  :class="{ 'is-idle': sortBy !== col.key }"
                />
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading && rows.length === 0">
            <tr v-for="i in 6" :key="'sk' + i">
              <td :colspan="columns.length + (selectable ? 1 : 0)"><SkeletonBlock height="18px" /></td>
            </tr>
          </template>
          <tr
            v-for="row in rows"
            v-else
            :key="rowKey(row)"
            :class="{ 'is-selected': selectedSet.has(rowKey(row)), 'is-clickable': clickableRows }"
            @click="clickableRows && emit('rowClick', row)"
          >
            <td v-if="selectable" class="data-table__check" @click.stop>
              <input
                type="checkbox"
                class="checkbox"
                :checked="selectedSet.has(rowKey(row))"
                :aria-label="tt('Select row {x}', '選取 {x}', { x: rowKey(row) })"
                @change="toggleRow(rowKey(row))"
              />
            </td>
            <td v-for="col in columns" :key="col.key" :class="['align-' + (col.align ?? 'left')]">
              <slot :name="'cell-' + col.key" :row="row" :value="cellValue(row, col)">{{
                cellValue(row, col)
              }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phones: one card per row -->
    <ul class="data-table__cards" role="list" :aria-label="caption">
      <li
        v-for="row in rows"
        :key="rowKey(row)"
        class="data-table__card"
        :class="{ 'is-selected': selectedSet.has(rowKey(row)) }"
        @click="clickableRows && emit('rowClick', row)"
      >
        <div class="data-table__card-head">
          <input
            v-if="selectable"
            type="checkbox"
            class="checkbox"
            :checked="selectedSet.has(rowKey(row))"
            :aria-label="tt('Select row {x}', '選取 {x}', { x: rowKey(row) })"
            @click.stop
            @change="toggleRow(rowKey(row))"
          />
          <span class="data-table__card-title">
            <slot :name="'cell-' + columns[0]!.key" :row="row" :value="cellValue(row, columns[0]!)">
              {{ cellValue(row, columns[0]!) }}
            </slot>
          </span>
        </div>
        <dl class="data-table__card-body">
          <template v-for="col in columns.slice(1).filter((c) => !c.hideOnMobile)" :key="col.key">
            <dt>{{ col.label }}</dt>
            <dd>
              <slot :name="'cell-' + col.key" :row="row" :value="cellValue(row, col)">{{
                cellValue(row, col)
              }}</slot>
            </dd>
          </template>
        </dl>
      </li>
    </ul>

    <EmptyState
      v-if="!loading && rows.length === 0"
      :title="emptyTitle ?? tt('No results', '沒有結果')"
      :description="emptyText ?? tt('Try changing the search or filters.', '請調整搜尋或篩選條件。')"
      icon="search"
    />
  </div>
</template>

<style scoped lang="scss">
.data-table {
  position: relative;

  &__scroll {
    display: none;
    overflow-x: auto;
    @include scrollbar-thin;

    @include up('md') {
      display: block;
    }
  }

  &__table {
    font-size: fs('sm');

    th,
    td {
      padding: space(3) space(3);
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
      vertical-align: middle;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--color-surface-2);
      font-size: fs('xs');
      font-weight: $font-weight-semibold;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      text-align: left;
    }

    tbody tr {
      transition: background-color $transition-fast;

      &:hover {
        background: var(--color-surface-hover);
      }

      &.is-selected {
        background: var(--color-primary-soft);
      }

      &.is-clickable {
        cursor: pointer;
      }
    }

    .align-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .align-center {
      text-align: center;
    }
  }

  &__check {
    width: 44px;
  }

  &__sort {
    @include reset-button;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: inherit;
    text-transform: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: $radius-sm;
    @include focus-ring(1px);

    &:hover {
      color: var(--color-text);
    }

    .is-idle {
      opacity: 0.35;
    }
  }

  &__cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: space(2.5);
    margin: 0;
    padding: 0;

    @include up('md') {
      display: none;
    }
  }

  &__card {
    min-width: 0;
    padding: space(3.5);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    background: var(--color-surface);

    &.is-selected {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
    }
  }

  &__card-head {
    display: flex;
    align-items: center;
    gap: space(3);
    margin-bottom: space(2.5);

    .checkbox {
      width: 20px;
      height: 20px;
    }
  }

  &__card-title {
    flex: 1;
    font-weight: $font-weight-semibold;
    min-width: 0;
    overflow: hidden;
  }

  &__card-body {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: space(1.5) space(4);
    margin: 0;
    font-size: fs('sm');

    dt {
      color: var(--color-text-muted);
    }

    dd {
      margin: 0;
      text-align: right;
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }
}
</style>
