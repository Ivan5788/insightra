import {
  CATEGORIES,
  CHANNELS,
  PRODUCTS,
  REGIONS,
  SEGMENTS,
  categoryLabel,
  channelLabel,
  getProduct,
  productLabel,
  regionLabel,
  segmentLabel,
} from '~/data/catalog'
import { byLang, getLang, type Lang } from '~/utils/locale'
import type {
  AnalyticsFilter,
  BreakdownData,
  BreakdownItem,
  DateRange,
  DimensionKey,
  FunnelData,
  FunnelStage,
  Granularity,
  HeatmapData,
  MetricKey,
  OverviewData,
  SeriesByDimensionData,
  SeriesMetricKey,
  TargetData,
  TimeSeriesData,
  TimeSeriesPoint,
} from '~/types/analytics'
import type { ChannelId, CustomerSegment, ISODate, Order, OrderLine } from '~/types/domain'
import {
  addDays,
  bucketStart,
  daysInMonth,
  diffDays,
  eachDay,
  endOfMonth,
  minDate,
  monthKey,
  previousRange,
  startOfMonth,
  suggestGranularity,
  weekdayIndex,
} from '~/utils/date'
import { compareMetric, percentChange, safeDivide, shareOf } from '~/utils/stats'
import type { Dataset } from '../mock/generator'

/**
 * AGGREGATION ENGINE
 * ------------------
 * Every number shown in the UI is produced by the functions in this file.
 *
 *   raw orders + traffic ──► Totals (additive sums) ──► derived metrics
 *
 * "Totals" only contain values that can be safely added together (sums and
 * counts). Ratios such as AOV or conversion rate are derived *afterwards*
 * from the summed totals. This is important: averaging daily conversion
 * rates would give a wrong answer; dividing total orders by total sessions
 * is correct.
 */

/** Internal filter — adds dimensions that only the server needs. */
export interface QueryFilter extends AnalyticsFilter {
  segment?: CustomerSegment
}

export interface Totals {
  revenue: number
  orders: number
  /** Orders that count towards revenue (completed + pending). */
  revenueOrders: number
  units: number
  refunded: number
  newCustomers: number
  sessions: number
  activeUsersSum: number
  productViews: number
  addToCart: number
  checkout: number
  purchases: number
  /** Days with data — used to average DAU. */
  days: number
}

export const SERIES_METRICS: SeriesMetricKey[] = [
  'revenue',
  'orders',
  'activeUsers',
  'conversionRate',
  'aov',
  'sessions',
  'unitsSold',
  'newCustomers',
  'refundRate',
]

export function emptyTotals(): Totals {
  return {
    revenue: 0,
    orders: 0,
    revenueOrders: 0,
    units: 0,
    refunded: 0,
    newCustomers: 0,
    sessions: 0,
    activeUsersSum: 0,
    productViews: 0,
    addToCart: 0,
    checkout: 0,
    purchases: 0,
    days: 0,
  }
}

export function addTotals(target: Totals, source: Totals): Totals {
  for (const key of Object.keys(target) as (keyof Totals)[]) target[key] += source[key]
  return target
}

/**
 * Traffic (sessions, funnel) is tracked per channel only. When the user
 * filters by product / category / region / segment, traffic metrics can't be
 * attributed and are reported as null instead of a misleading number.
 */
export function hasTrafficScope(filter: QueryFilter): boolean {
  return !filter.category && !filter.productId && !filter.region && !filter.segment
}

/** Order lines that match product/category filters. */
export function matchingLines(order: Order, filter: QueryFilter): OrderLine[] {
  if (!filter.category && !filter.productId) return order.lines
  return order.lines.filter((line) => {
    if (filter.productId && line.productId !== filter.productId) return false
    if (filter.category && getProduct(line.productId)?.category !== filter.category) return false
    return true
  })
}

/** Does the order itself (not its lines) match the filter? */
export function orderMatches(ds: Dataset, order: Order, filter: QueryFilter): boolean {
  if (filter.channel && order.channel !== filter.channel) return false
  if (filter.region && order.region !== filter.region) return false
  if (filter.segment && ds.customers.get(order.customerId)?.segment !== filter.segment) return false
  return true
}

export function lineRevenue(lines: readonly OrderLine[]): number {
  let total = 0
  for (const l of lines) total += l.quantity * l.unitPrice
  return total
}

export function isRevenueStatus(order: Order): boolean {
  return order.status === 'completed' || order.status === 'pending'
}

/** Sum everything for ONE day. */
export function dayTotals(ds: Dataset, date: ISODate, filter: QueryFilter): Totals {
  const t = emptyTotals()
  const record = ds.days.get(date)
  if (!record) return t
  t.days = 1

  if (hasTrafficScope(filter)) {
    const channels: ChannelId[] = filter.channel
      ? [filter.channel]
      : (Object.keys(record.traffic) as ChannelId[])
    for (const c of channels) {
      const tr = record.traffic[c]
      t.sessions += tr.sessions
      t.activeUsersSum += tr.activeUsers
      t.productViews += tr.productViews
      t.addToCart += tr.addToCart
      t.checkout += tr.checkout
      t.purchases += tr.purchases
    }
  }

  for (const order of record.orders) {
    if (!orderMatches(ds, order, filter)) continue
    const lines = matchingLines(order, filter)
    if (lines.length === 0) continue
    t.orders++
    if (order.isNewCustomer) t.newCustomers++
    if (order.status === 'refunded') t.refunded++
    if (isRevenueStatus(order)) {
      t.revenueOrders++
      t.revenue += lineRevenue(lines)
      for (const l of lines) t.units += l.quantity
    }
  }
  return t
}

export function rangeTotals(ds: Dataset, range: DateRange, filter: QueryFilter): Totals {
  const total = emptyTotals()
  for (const date of eachDay(range)) addTotals(total, dayTotals(ds, date, filter))
  return total
}

/** Turn additive totals into the metrics users see. */
export function deriveMetrics(t: Totals, filter: QueryFilter): Record<SeriesMetricKey, number | null> {
  const traffic = hasTrafficScope(filter)
  const conversion = traffic ? safeDivide(t.orders, t.sessions) : null
  const refund = safeDivide(t.refunded, t.orders)
  return {
    revenue: round2(t.revenue),
    orders: t.orders,
    unitsSold: t.units,
    newCustomers: t.newCustomers,
    aov: nullableRound(safeDivide(t.revenue, t.revenueOrders)),
    refundRate: refund === null ? null : round4(refund * 100),
    sessions: traffic ? t.sessions : null,
    activeUsers: traffic ? nullableRound(safeDivide(t.activeUsersSum, t.days), 0) : null,
    conversionRate: conversion === null ? null : round4(conversion * 100),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

function nullableRound(n: number | null, digits = 2): number | null {
  if (n === null) return null
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** Restrict a range to days that exist in the dataset. */
export function clampToDataset(ds: Dataset, range: DateRange): DateRange {
  return {
    from: range.from < ds.firstDate ? ds.firstDate : range.from,
    to: range.to > ds.lastDate ? ds.lastDate : range.to,
  }
}

// ---- Overview -------------------------------------------------------------

export function getOverview(ds: Dataset, filter: QueryFilter): OverviewData {
  const range: DateRange = { from: filter.from, to: filter.to }
  const prevRange = previousRange(range)
  const prevPrevRange = previousRange(prevRange)

  const current = deriveMetrics(rangeTotals(ds, range, filter), filter)
  const previous = deriveMetrics(rangeTotals(ds, prevRange, filter), filter)
  const prevPrev = deriveMetrics(rangeTotals(ds, prevPrevRange, filter), filter)

  const metrics = {} as Record<MetricKey, ReturnType<typeof compareMetric>>
  for (const key of SERIES_METRICS) metrics[key] = compareMetric(key, current[key], previous[key])

  // Growth of the current period vs growth of the previous period.
  metrics.revenueGrowth = compareMetric(
    'revenueGrowth',
    percentChange(current.revenue, previous.revenue),
    percentChange(previous.revenue, prevPrev.revenue),
  )

  // Sparklines (≤ ~60 points so they stay readable)
  const series = getTimeSeries(ds, filter, suggestGranularity(range), false)
  const sparklines: OverviewData['sparklines'] = {}
  for (const key of SERIES_METRICS) sparklines[key] = series.current.map((p) => p.values[key] ?? 0)

  return { range, previousRange: prevRange, metrics, sparklines }
}

// ---- Time series ----------------------------------------------------------

function bucketize(
  ds: Dataset,
  range: DateRange,
  filter: QueryFilter,
  granularity: Granularity,
): TimeSeriesPoint[] {
  const buckets = new Map<ISODate, { end: ISODate; totals: Totals }>()
  for (const date of eachDay(range)) {
    const key = bucketStart(date, granularity)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { end: date, totals: emptyTotals() }
      buckets.set(key, bucket)
    }
    bucket.end = date
    addTotals(bucket.totals, dayTotals(ds, date, filter))
  }
  return [...buckets.entries()].map(([bucket, { end, totals }]) => ({
    bucket,
    bucketEnd: end,
    values: deriveMetrics(totals, filter),
  }))
}

export function getTimeSeries(
  ds: Dataset,
  filter: QueryFilter,
  granularity: Granularity,
  includePrevious = true,
): TimeSeriesData {
  const range: DateRange = { from: filter.from, to: filter.to }
  const prevRange = previousRange(range)
  return {
    granularity,
    range,
    previousRange: prevRange,
    current: bucketize(ds, range, filter, granularity),
    previous: includePrevious ? bucketize(ds, prevRange, filter, granularity) : [],
  }
}

// ---- Breakdown ------------------------------------------------------------

export function dimensionMembers(
  dimension: DimensionKey,
  lang: Lang = getLang(),
): { key: string; label: string }[] {
  switch (dimension) {
    case 'channel':
      return CHANNELS.map((c) => ({ key: c.id, label: channelLabel(c.id, lang) }))
    case 'category':
      return CATEGORIES.map((c) => ({ key: c.id, label: categoryLabel(c.id, lang) }))
    case 'region':
      return REGIONS.map((r) => ({ key: r.id, label: regionLabel(r.id, lang) }))
    case 'segment':
      return SEGMENTS.map((s) => ({ key: s.id, label: segmentLabel(s.id, lang) }))
    case 'product':
      return PRODUCTS.map((p) => ({ key: p.id, label: productLabel(p.id, lang) }))
  }
}

/** Narrow the filter to one member of a dimension. */
export function withMember(filter: QueryFilter, dimension: DimensionKey, key: string): QueryFilter {
  switch (dimension) {
    case 'channel':
      return { ...filter, channel: key as QueryFilter['channel'] }
    case 'category':
      return { ...filter, category: key as QueryFilter['category'] }
    case 'region':
      return { ...filter, region: key as QueryFilter['region'] }
    case 'segment':
      return { ...filter, segment: key as CustomerSegment }
    case 'product':
      return { ...filter, productId: key }
  }
}

/** Members that are compatible with the active filter (e.g. only products of the selected category). */
function compatibleMembers(dimension: DimensionKey, filter: QueryFilter) {
  const members = dimensionMembers(dimension, filter.lang ?? getLang())
  if (dimension === 'product' && filter.category) {
    return members.filter((m) => getProduct(m.key)?.category === filter.category)
  }
  if (dimension === 'product' && filter.productId) return members.filter((m) => m.key === filter.productId)
  if (dimension === 'channel' && filter.channel) return members.filter((m) => m.key === filter.channel)
  if (dimension === 'category' && filter.category) return members.filter((m) => m.key === filter.category)
  if (dimension === 'region' && filter.region) return members.filter((m) => m.key === filter.region)
  return members
}

export function getBreakdown(
  ds: Dataset,
  filter: QueryFilter,
  dimension: DimensionKey,
  metric: SeriesMetricKey,
): BreakdownData {
  const range: DateRange = { from: filter.from, to: filter.to }
  const prevRange = previousRange(range)

  const raw = compatibleMembers(dimension, filter).map((m) => {
    const f = withMember(filter, dimension, m.key)
    const cur = deriveMetrics(rangeTotals(ds, range, f), f)
    const prev = deriveMetrics(rangeTotals(ds, prevRange, f), f)
    const extra: BreakdownItem['extra'] = { ...cur }
    if (dimension === 'product') extra.price = getProduct(m.key)?.price ?? null
    return { member: m, value: cur[metric] ?? 0, previous: prev[metric] ?? 0, extra }
  })

  const total = raw.reduce((acc, r) => acc + r.value, 0)
  const items: BreakdownItem[] = raw
    .map((r) => ({
      key: r.member.key,
      label: r.member.label,
      value: r.value,
      previous: r.previous,
      share: shareOf(r.value, total),
      deltaPercent: percentChange(r.value, r.previous),
      extra: r.extra,
    }))
    .sort((a, b) => b.value - a.value)

  return { dimension, metric, total: round2(total), items }
}

export function getSeriesByDimension(
  ds: Dataset,
  filter: QueryFilter,
  dimension: DimensionKey,
  metric: SeriesMetricKey,
  granularity: Granularity,
): SeriesByDimensionData {
  const range: DateRange = { from: filter.from, to: filter.to }
  const members = compatibleMembers(dimension, filter).slice(0, 8)
  let buckets: ISODate[] = []
  const series = members.map((m) => {
    const points = bucketize(ds, range, withMember(filter, dimension, m.key), granularity)
    buckets = points.map((p) => p.bucket)
    return { key: m.key, label: m.label, values: points.map((p) => p.values[metric] ?? 0) }
  })
  return { dimension, metric, buckets, series }
}

// ---- Funnel / heatmap / target ---------------------------------------------

const FUNNEL_LABELS: Record<FunnelStage['key'], [en: string, zh: string]> = {
  sessions: ['Sessions', '工作階段'],
  productViews: ['Product views', '瀏覽商品'],
  addToCart: ['Add to cart', '加入購物車'],
  checkout: ['Checkout', '結帳'],
  purchases: ['Purchase', '完成購買'],
}

export function getFunnel(ds: Dataset, filter: QueryFilter): FunnelData {
  if (!hasTrafficScope(filter)) return { stages: [] }
  const t = rangeTotals(ds, { from: filter.from, to: filter.to }, filter)
  const keys: FunnelStage['key'][] = ['sessions', 'productViews', 'addToCart', 'checkout', 'purchases']
  const top = t.sessions
  const stages = keys.map((key, i) => {
    const value = t[key]
    const prevValue = i === 0 ? null : t[keys[i - 1]!]
    const fromPrev = prevValue === null ? null : safeDivide(value, prevValue)
    const fromTop = safeDivide(value, top)
    return {
      key,
      label: byLang(...FUNNEL_LABELS[key], filter.lang ?? getLang()),
      value,
      rateFromPrevious: fromPrev === null ? null : round4(fromPrev * 100),
      rateFromTop: fromTop === null ? null : round4(fromTop * 100),
    }
  })
  return { stages }
}

export function getHeatmap(ds: Dataset, filter: QueryFilter): HeatmapData {
  const grid: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0))
  for (const date of eachDay({ from: filter.from, to: filter.to })) {
    const record = ds.days.get(date)
    if (!record) continue
    const wd = weekdayIndex(date)
    for (const order of record.orders) {
      if (!orderMatches(ds, order, filter) || matchingLines(order, filter).length === 0) continue
      grid[order.hour]![wd]!++
    }
  }
  const cells: [number, number, number][] = []
  let max = 0
  grid.forEach((row, hour) =>
    row.forEach((value, wd) => {
      cells.push([hour, wd, value])
      if (value > max) max = value
    }),
  )
  return { cells, max }
}

/**
 * Monthly revenue target for the month that contains `filter.to`.
 * Target = previous full month revenue × 1.10 (rounded to $1,000).
 */
export function getTarget(ds: Dataset, filter: QueryFilter): TargetData {
  const monthStart = startOfMonth(filter.to)
  const to = minDate(filter.to, ds.lastDate)
  const achieved = rangeTotals(ds, { from: monthStart, to }, filter).revenue
  const prevEnd = addDays(monthStart, -1)
  const prevRevenue = rangeTotals(ds, { from: startOfMonth(prevEnd), to: prevEnd }, filter).revenue
  const target = Math.max(1000, Math.round((prevRevenue * 1.1) / 1000) * 1000)
  return {
    month: monthKey(monthStart),
    target,
    achieved: round2(achieved),
    progress: round2(shareOf(achieved, target)),
    daysElapsed: diffDays(monthStart, to) + 1,
    daysInMonth: daysInMonth(monthStart),
  }
}

export function monthRange(ds: Dataset, month: string): DateRange {
  const from = month + '-01'
  return clampToDataset(ds, { from, to: endOfMonth(from) })
}
