import { beforeAll, describe, expect, it } from 'vitest'
import { generateDataset, type Dataset } from '~/server/mock/generator'
import { getDrillView, productRevenueOnDay } from '~/server/utils/drilldown'

let ds: Dataset

beforeAll(() => {
  ds = generateDataset({ today: '2026-11-20', days: 400, now: new Date('2026-11-20T23:00:00') })
})

describe('revenue drill-down (month → day → product → orders)', () => {
  it('month total equals the sum of its days', () => {
    const months = getDrillView(ds, 'revenue-months', { to: '2026-11-20' })
    expect(months.rows).toHaveLength(12)
    const october = months.rows.find((r) => r.id === '2026-10')!
    expect(october.next).toEqual({ kind: 'revenue-days', label: 'Oct 2026', params: { month: '2026-10' } })

    const days = getDrillView(ds, 'revenue-days', october.next!.params)
    expect(days.rows).toHaveLength(31)
    const dailySum = days.rows.reduce((acc, r) => acc + Number(r.cells.revenue), 0)
    expect(dailySum).toBeCloseTo(Number(october.cells.revenue), 0)
  })

  it('day total equals the sum of product revenue', () => {
    const days = getDrillView(ds, 'revenue-days', { month: '2026-11' })
    const nov11 = days.rows.find((r) => r.id === '2026-11-11')!
    const products = getDrillView(ds, 'revenue-products', nov11.next!.params)
    const productSum = products.rows.reduce((acc, r) => acc + Number(r.cells.revenue), 0)
    expect(productSum).toBeCloseTo(Number(nov11.cells.revenue), 0)
  })

  it('product orders add up to the product revenue of that day', () => {
    const products = getDrillView(ds, 'revenue-products', { day: '2026-11-11' })
    const top = products.rows[0]!
    const orders = getDrillView(ds, 'product-orders', top.next!.params)
    const settled = orders.rows
      .filter((r) => r.cells.status === 'completed' || r.cells.status === 'pending')
      .reduce((acc, r) => acc + Number(r.cells.total), 0)
    expect(settled).toBeCloseTo(Number(top.cells.revenue), 1)
    expect(settled).toBeCloseTo(productRevenueOnDay(ds, top.id, '2026-11-11'), 1)
  })

  it('links chart categories to table rows', () => {
    const view = getDrillView(ds, 'revenue-months', { to: '2026-11-20' })
    const chart = view.charts[0]!
    expect(chart.linkedToRows).toBe(true)
    expect(chart.categories).toHaveLength(view.rows.length)
  })
})

describe('category and channel drill-down', () => {
  const range = { from: '2026-10-22', to: '2026-11-20' }

  it('category products only contain products of that category', () => {
    const cats = getDrillView(ds, 'categories', range)
    const beauty = cats.rows.find((r) => r.id === 'beauty')!
    const products = getDrillView(ds, 'category-products', beauty.next!.params)
    expect(products.rows.every((r) => r.id.startsWith('p-4'))).toBe(true)
    const sum = products.rows.reduce((acc, r) => acc + Number(r.cells.revenue), 0)
    expect(sum).toBeCloseTo(Number(beauty.cells.revenue), 0)
    expect(products.rows[0]!.next!.kind).toBe('product-detail')
  })

  it('channel detail exposes a funnel with conversion rates', () => {
    const channels = getDrillView(ds, 'channels', range)
    const email = channels.rows.find((r) => r.id === 'email')!
    const detail = getDrillView(ds, 'channel-detail', email.next!.params)
    expect(detail.charts.map((c) => c.type)).toContain('funnel')
    expect(detail.rows).toHaveLength(5)
    expect(detail.rows[4]!.cells.value).toBe(email.cells.orders)
  })
})
