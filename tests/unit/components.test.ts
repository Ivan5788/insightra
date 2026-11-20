import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from '~/components/common/AppIcon.vue'
import DeltaBadge from '~/components/common/DeltaBadge.vue'
import StatCard from '~/components/dashboard/StatCard.vue'
import Pagination from '~/components/tables/Pagination.vue'
import DataTable from '~/components/tables/DataTable.vue'
import { compareMetric } from '~/utils/stats'
import { toCsv } from '~/utils/csv'

// Nuxt auto-imports components; in plain Vitest we register/stub them explicitly.
const global = {
  components: { AppIcon, DeltaBadge },
  stubs: { LazyBaseChart: true, InfoTooltip: true, SkeletonBlock: true, EmptyState: true },
}

describe('StatCard', () => {
  it('formats the value and shows the change vs previous period', () => {
    const w = mount(StatCard, {
      props: {
        label: 'Total Revenue',
        value: 342163,
        format: 'currency',
        comparison: compareMetric('revenue', 342163, 287096),
      },
      global,
    })
    expect(w.get('[data-testid="stat-value"]').text()).toBe('$342.2K')
    expect(w.text()).toContain('+19.2%')
    expect(w.text()).toContain('vs $287.1K')
    expect(w.find('.delta--positive').exists()).toBe(true)
  })

  it('colours a falling refund rate as positive', () => {
    const w = mount(StatCard, {
      props: {
        label: 'Refund Rate',
        value: 4.8,
        format: 'percent',
        deltaUnit: 'pp',
        higherIsBetter: false,
        comparison: compareMetric('refundRate', 4.8, 5.2),
      },
      global,
    })
    expect(w.find('.delta--positive').exists()).toBe(true)
    expect(w.text()).toContain('−0.4 pp')
  })

  it('explains when a metric is not available', () => {
    const w = mount(StatCard, {
      props: { label: 'Conversion', value: null, format: 'percent', comparison: null },
      global,
    })
    expect(w.text()).toContain('Not available')
  })
})

describe('Pagination', () => {
  it('shows a summary and emits page changes', async () => {
    const w = mount(Pagination, { props: { page: 2, pageSize: 20, total: 95 }, global })
    expect(w.text()).toContain('21–40')
    expect(w.text()).toContain('95')
    await w.get('[data-testid="page-next"]').trigger('click')
    expect(w.emitted('update:page')![0]).toEqual([3])
  })

  it('disables "previous" on the first page', () => {
    const w = mount(Pagination, { props: { page: 1, pageSize: 20, total: 95 }, global })
    expect(w.get('[data-testid="page-prev"]').attributes('disabled')).toBeDefined()
  })
})

describe('DataTable', () => {
  const rows = [
    { id: 'a', name: 'Alpha', total: 10 },
    { id: 'b', name: 'Beta', total: 20 },
  ]
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'total', label: 'Total', format: 'currency' as const, align: 'right' as const },
  ]

  it('renders rows and emits sort on header click', async () => {
    const w = mount(DataTable, {
      props: {
        columns,
        rows,
        rowKey: (r: object) => (r as (typeof rows)[number]).id,
        caption: 'Test',
        sortBy: 'name',
        sortDir: 'asc' as const,
      },
      global,
    })
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.text()).toContain('$20')
    expect(w.get('th[aria-sort]').attributes('aria-sort')).toBe('ascending')
    await w.get('.data-table__sort').trigger('click')
    expect(w.emitted('sort')![0]).toEqual(['name'])
  })

  it('selects all rows on the page', async () => {
    const w = mount(DataTable, {
      props: {
        columns,
        rows,
        rowKey: (r: object) => (r as (typeof rows)[number]).id,
        caption: 'Test',
        selectable: true,
        selected: [],
      },
      global,
    })
    await w.get('[data-testid="select-all"]').trigger('change')
    expect(w.emitted('update:selected')![0]).toEqual([['a', 'b']])
  })
})

describe('CSV export', () => {
  it('escapes commas, quotes, new lines and formula injection', () => {
    const csv = toCsv(
      [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
      [
        { a: 'x,y', b: 'say "hi"' },
        { a: '=SUM(1)', b: 'line\nbreak' },
      ],
    )
    expect(csv.split('\r\n')).toEqual(['A,B', '"x,y","say ""hi"""', '\'=SUM(1),"line\nbreak"'])
  })
})
