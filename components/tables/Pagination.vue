<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '~/utils/format'

import { tt } from '~/utils/locale'

/**
 * Pagination with page numbers + ellipsis, page-size selector and a
 * "Showing 21–40 of 3,521" summary. Pure: emits, never fetches.
 */
const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    pageSizes?: number[]
  }>(),
  { pageSizes: () => [10, 20, 50, 100] },
)

const emit = defineEmits<{ 'update:page': [page: number]; 'update:pageSize': [size: number] }>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.total, props.page * props.pageSize))

/** e.g. [1, '…', 4, 5, 6, '…', 20] */
const pages = computed<(number | '…')[]>(() => {
  const count = pageCount.value
  const current = props.page
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const result: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  if (start > 2) result.push('…')
  for (let p = start; p <= end; p++) result.push(p)
  if (end < count - 1) result.push('…')
  result.push(count)
  return result
})

function go(page: number): void {
  const next = Math.min(Math.max(1, page), pageCount.value)
  if (next !== props.page) emit('update:page', next)
}

function onSize(event: Event): void {
  emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
  emit('update:page', 1)
}
</script>

<template>
  <nav class="pagination" :aria-label="tt('Pagination', '分頁')">
    <p class="pagination__summary" aria-live="polite">
      {{ tt('Showing', '顯示第') }} <b>{{ formatNumber(from) }}–{{ formatNumber(to) }}</b>
      {{ tt('of', '筆，共') }} <b>{{ formatNumber(total) }}</b>{{ tt('', ' 筆') }}
    </p>
    <div class="pagination__controls">
      <label class="pagination__size">
        <span class="sr-only">{{ tt('Rows per page', '每頁筆數') }}</span>
        <select class="select" :value="pageSize" @change="onSize">
          <option v-for="s in pageSizes" :key="s" :value="s">
            {{ tt('{n} / page', '每頁 {n} 筆', { n: s }) }}
          </option>
        </select>
      </label>
      <button
        type="button"
        class="pagination__btn"
        :disabled="page <= 1"
        :aria-label="tt('Previous page', '上一頁')"
        data-testid="page-prev"
        @click="go(page - 1)"
      >
        <AppIcon name="chevron-left" :size="16" />
      </button>
      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '…'" class="pagination__ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pagination__btn pagination__num"
          :class="{ 'is-active': p === page }"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="tt('Page {n}', '第 {n} 頁', { n: p })"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        type="button"
        class="pagination__btn"
        :disabled="page >= pageCount"
        :aria-label="tt('Next page', '下一頁')"
        data-testid="page-next"
        @click="go(page + 1)"
      >
        <AppIcon name="chevron-right" :size="16" />
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: space(3);

  &__summary {
    font-size: fs('sm');
    color: var(--color-text-muted);

    b {
      color: var(--color-text);
      font-weight: $font-weight-semibold;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: space(1);
  }

  &__size .select {
    min-height: 32px;
    width: auto;
    font-size: fs('sm');
    margin-right: space(2);
  }

  &__btn {
    @include reset-button;
    display: grid;
    place-items: center;
    min-width: 32px;
    height: 32px;
    padding: 0 space(2);
    border-radius: $radius-md;
    font-size: fs('sm');
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    @include focus-ring(0);

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.is-active {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
  }

  &__num {
    @include down('sm') {
      &:not(.is-active) {
        display: none;
      }
    }
  }

  &__ellipsis {
    padding: 0 space(1);
    color: var(--color-text-muted);

    @include down('sm') {
      display: none;
    }
  }
}
</style>
