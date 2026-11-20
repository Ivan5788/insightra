import { beforeAll, describe, expect, it } from 'vitest'
import { generateDataset, type Dataset } from '~/server/mock/generator'
import {
  deriveMetrics,
  getBreakdown,
  getFunnel,
  getOverview,
  getTimeSeries,
  rangeTotals,
} from '~/server/utils/analytics'
import { queryOrders } from '~/server/utils/orders'
import { getRetention, getUsersOverview } from '~/server/utils/users'

const TODAY = '2026-11-20'
const NOW = new Date('2026-11-20T23:00:00')
const RANGE = { from: '2026-10-22', to: '2026-11-20' }

let ds: Dataset

beforeAll(() => {
  ds = generateDataset({ today: TODAY, days: 400, now: NOW })
})

describe('mock data generator', () => {
  it('is deterministic for the same input', () => {
    const again = generateDataset({ today: TODAY, days: 400, now: NOW })
    expect(again.orders.size).toBe(ds.orders.size)
    expect(again.days.get('2026-11-11')!.orders[0]).toEqual(ds.days.get('2026-11-11')!.orders[0])
  })

  it('keeps orders consistent with the traffic funnel', () => {
    const day = ds.days.get('2026-11-01')!
    const purchases = Object.values(day.traffic).reduce((acc, t) => acc + t.purchases, 0)
    expect(day.orders.length).toBe(purchases)
    for (const t of Object.values(day.traffic)) {
      expect(t.productViews).toBeLessThanOrEqual(t.sessions)
      expect(t.addToCart).toBeLessThanOrEqual(t.productViews)
      expect(t.checkout).toBeLessThanOrEqual(t.addToCart)
    }
  })

  it('references existing customers in every order', () => {
    for (const order of ds.days.get('2026-11-15')!.orders) {
      expect(ds.customers.has(order.customerId)).toBe(true)
    }
  })

  it('models the 11.11 shopping festival as a spike', () => {
    const festival = ds.days.get('2026-11-11')!.orders.length
    const normal = ds.days.get('2026-11-04')!.orders.length
    expect(festival).toBeGreaterThan(normal * 1.5)
  })
})

describe('aggregation consistency', () => {
  it('daily time series sums to the range total', () => {
    const series = getTimeSeries(ds, RANGE, 'day')
    const revenueSum = series.current.reduce((acc, p) => acc + (p.values.revenue ?? 0), 0)
    const totals = deriveMetrics(rangeTotals(ds, RANGE, RANGE), RANGE)
    expect(revenueSum).toBeCloseTo(totals.revenue!, 0)
    expect(series.current).toHaveLength(30)
    expect(series.previous).toHaveLength(30)
  })

  it('weekly buckets keep the same totals as daily buckets', () => {
    const daily = getTimeSeries(ds, RANGE, 'day').current.reduce((a, p) => a + (p.values.orders ?? 0), 0)
    const weekly = getTimeSeries(ds, RANGE, 'week').current.reduce((a, p) => a + (p.values.orders ?? 0), 0)
    expect(weekly).toBe(daily)
  })

  it('overview KPIs match the time series and the orders table', () => {
    const overview = getOverview(ds, RANGE)
    const orders = queryOrders(ds, { ...RANGE, page: 1, pageSize: 1, sortBy: 'date', sortDir: 'desc' })
    expect(overview.metrics.orders.current).toBe(orders.total)
    expect(overview.previousRange).toEqual({ from: '2026-09-22', to: '2026-10-21' })
    expect(overview.metrics.conversionRate.current).toBeGreaterThan(0)
  })

  it('channel breakdown shares sum to 100 % and to the total', () => {
    const b = getBreakdown(ds, RANGE, 'channel', 'revenue')
    const shares = b.items.reduce((acc, i) => acc + i.share, 0)
    expect(shares).toBeCloseTo(100, 5)
    const overview = getOverview(ds, RANGE)
    expect(b.total).toBeCloseTo(overview.metrics.revenue.current!, 0)
  })

  it('category breakdown adds up to total revenue', () => {
    const b = getBreakdown(ds, RANGE, 'category', 'revenue')
    const overview = getOverview(ds, RANGE)
    expect(b.total).toBeCloseTo(overview.metrics.revenue.current!, 0)
  })

  it('a category filter narrows revenue and disables traffic metrics', () => {
    const all = getOverview(ds, RANGE)
    const books = getOverview(ds, { ...RANGE, category: 'books' })
    expect(books.metrics.revenue.current!).toBeLessThan(all.metrics.revenue.current!)
    expect(books.metrics.conversionRate.current).toBeNull()
    expect(books.metrics.sessions.current).toBeNull()
  })

  it('the funnel ends with the number of orders', () => {
    const funnel = getFunnel(ds, { ...RANGE, channel: 'email' })
    const overview = getOverview(ds, { ...RANGE, channel: 'email' })
    expect(funnel.stages.at(-1)!.value).toBe(overview.metrics.orders.current)
    expect(funnel.stages[0]!.rateFromTop).toBe(100)
  })
})

describe('orders query', () => {
  it('filters, sorts and paginates', () => {
    const page = queryOrders(ds, { ...RANGE, page: 2, pageSize: 10, sortBy: 'total', sortDir: 'desc' })
    expect(page.items).toHaveLength(10)
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i - 1]!.total).toBeGreaterThanOrEqual(page.items[i]!.total)
    }
    const refunded = queryOrders(ds, {
      ...RANGE,
      page: 1,
      pageSize: 50,
      sortBy: 'date',
      sortDir: 'desc',
      status: 'refunded',
    })
    expect(refunded.items.every((r) => r.status === 'refunded')).toBe(true)
  })

  it('searches by order id', () => {
    const id = ds.days.get('2026-11-10')!.orders[3]!.id
    const result = queryOrders(ds, {
      ...RANGE,
      page: 1,
      pageSize: 10,
      sortBy: 'date',
      sortDir: 'desc',
      search: id,
    })
    expect(result.total).toBe(1)
    expect(result.items[0]!.id).toBe(id)
  })
})

describe('users', () => {
  it('total users grow by the number of new users', () => {
    const u = getUsersOverview(ds, RANGE)
    expect(u.totalUsers.current! - u.totalUsers.previous!).toBe(u.newUsers.current)
    expect(u.growth.at(-1)!.total).toBe(u.totalUsers.current)
  })

  it('retention cohorts start at 100 % and are null in the future', () => {
    const r = getRetention(ds, TODAY, 6)
    expect(r.cohorts).toHaveLength(6)
    expect(r.cohorts[0]!.retention[0]).toBe(100)
    expect(r.cohorts.at(-1)!.retention[1]).toBeNull()
  })
})
