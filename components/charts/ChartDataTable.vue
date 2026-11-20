<script setup lang="ts">
/**
 * Simple table used as the accessible alternative view of a chart
 * (and for chart CSV exports). Columns are formatted with the shared formatters.
 */
import { formatValue, type ValueFormat } from '~/utils/format'

defineProps<{
  columns: { key: string; label: string; format?: ValueFormat }[]
  rows: Record<string, string | number | null>[]
  caption: string
}>()
</script>

<template>
  <table class="mini-table">
    <caption class="sr-only">
      {{
        caption
      }}
    </caption>
    <thead>
      <tr>
        <th v-for="c in columns" :key="c.key" scope="col" :class="{ num: c.format && c.format !== 'text' }">
          {{ c.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i">
        <td v-for="c in columns" :key="c.key" :class="{ num: c.format && c.format !== 'text' }">
          {{ formatValue(row[c.key] ?? null, c.format ?? 'text') }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.mini-table {
  font-size: fs('sm');

  th,
  td {
    padding: space(2) space(2.5);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    background: var(--color-surface);
    font-weight: $font-weight-semibold;
    color: var(--color-text-muted);
    font-size: fs('xs');
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}
</style>
