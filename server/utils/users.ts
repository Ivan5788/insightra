import { CHANNELS, REGIONS, SEGMENTS, channelLabel, regionLabel, segmentLabel } from '~/data/catalog'
import type { BreakdownItem, DateRange, RetentionData, UsersOverviewData } from '~/types/analytics'
import type { Customer, ISODate } from '~/types/domain'
import { addMonths, bucketStart, eachDay, monthKey, previousRange, suggestGranularity } from '~/utils/date'
import { compareMetric, percentChange, safeDivide, shareOf } from '~/utils/stats'
import { getLang } from '~/utils/locale'
import type { Dataset } from '../mock/generator'
import { deriveMetrics, matchingLines, orderMatches, rangeTotals, type QueryFilter } from './analytics'

/**
 * User / customer analytics.
 *  - Total users     = registered customers up to the end of the range
 *  - New users       = registrations inside the range
 *  - Active users    = average DAU (from traffic)
 *  - Returning rate  = orders from returning customers ÷ all orders
 */

function signupsIn(ds: Dataset, range: DateRange, filter: QueryFilter): Customer[] {
  const result: Customer[] = []
  for (const date of eachDay(range)) {
    const record = ds.days.get(date)
    if (!record) continue
    for (const id of record.signups) {
      const c = ds.customers.get(id)
      if (!c) continue
      if (filter.channel && c.channel !== filter.channel) continue
      if (filter.region && c.region !== filter.region) continue
      result.push(c)
    }
  }
  return result
}

function totalUsersAt(ds: Dataset, date: ISODate, filter: QueryFilter): number {
  let n = 0
  for (const c of ds.customers.values()) {
    if (c.signupDate > date) continue
    if (filter.channel && c.channel !== filter.channel) continue
    if (filter.region && c.region !== filter.region) continue
    n++
  }
  return n
}

/** Distinct customers who ordered in the range. */
function activeCustomers(ds: Dataset, range: DateRange, filter: QueryFilter): Customer[] {
  const seen = new Map<string, Customer>()
  for (const date of eachDay(range)) {
    const record = ds.days.get(date)
    if (!record) continue
    for (const order of record.orders) {
      if (!orderMatches(ds, order, filter) || matchingLines(order, filter).length === 0) continue
      const c = ds.customers.get(order.customerId)
      if (c) seen.set(c.id, c)
    }
  }
  return [...seen.values()]
}

function groupCount<T extends string>(
  current: Customer[],
  previous: Customer[],
  members: { id: T }[],
  label: (id: T) => string,
  pick: (c: Customer) => string,
): BreakdownItem[] {
  const count = (list: Customer[]) => {
    const m = new Map<string, number>()
    for (const c of list) m.set(pick(c), (m.get(pick(c)) ?? 0) + 1)
    return m
  }
  const cur = count(current)
  const prev = count(previous)
  const total = current.length
  return members
    .map((m) => {
      const value = cur.get(m.id) ?? 0
      const p = prev.get(m.id) ?? 0
      return {
        key: m.id,
        label: label(m.id),
        value,
        previous: p,
        share: shareOf(value, total),
        deltaPercent: percentChange(value, p),
        extra: {},
      }
    })
    .sort((a, b) => b.value - a.value)
}

export function getUsersOverview(ds: Dataset, filter: QueryFilter): UsersOverviewData {
  const lang = filter.lang ?? getLang()
  const range: DateRange = { from: filter.from, to: filter.to }
  const prev = previousRange(range)

  const newCur = signupsIn(ds, range, filter)
  const newPrev = signupsIn(ds, prev, filter)
  const totalsCur = rangeTotals(ds, range, filter)
  const totalsPrev = rangeTotals(ds, prev, filter)
  const mCur = deriveMetrics(totalsCur, filter)
  const mPrev = deriveMetrics(totalsPrev, filter)

  const returning = (orders: number, newCustomers: number) => {
    const r = safeDivide(orders - newCustomers, orders)
    return r === null ? null : r * 100
  }

  // Growth series: cumulative total at the end of each bucket + new users in bucket.
  const granularity = suggestGranularity(range)
  const buckets = new Map<ISODate, { total: number; new: number; end: ISODate }>()
  let running = totalUsersAt(ds, prev.to, filter)
  const signupsByDay = new Map<ISODate, number>()
  for (const c of newCur) signupsByDay.set(c.signupDate, (signupsByDay.get(c.signupDate) ?? 0) + 1)
  for (const date of eachDay(range)) {
    const key = bucketStart(date, granularity)
    const added = signupsByDay.get(date) ?? 0
    running += added
    const b = buckets.get(key) ?? { total: 0, new: 0, end: date }
    b.total = running
    b.new += added
    b.end = date
    buckets.set(key, b)
  }

  const activeCur = activeCustomers(ds, range, filter)
  const activePrev = activeCustomers(ds, prev, filter)

  return {
    totalUsers: compareMetric(
      'newCustomers',
      totalUsersAt(ds, range.to, filter),
      totalUsersAt(ds, prev.to, filter),
    ),
    newUsers: compareMetric('newCustomers', newCur.length, newPrev.length),
    activeUsers: compareMetric('activeUsers', mCur.activeUsers, mPrev.activeUsers),
    returningRate: compareMetric(
      'conversionRate',
      returning(totalsCur.orders, totalsCur.newCustomers),
      returning(totalsPrev.orders, totalsPrev.newCustomers),
    ),
    growth: [...buckets.entries()].map(([bucket, v]) => ({ bucket, total: v.total, new: v.new })),
    bySource: groupCount(
      newCur,
      newPrev,
      CHANNELS,
      (id) => channelLabel(id, lang),
      (c) => c.channel,
    ),
    byRegion: groupCount(
      activeCur,
      activePrev,
      REGIONS,
      (id) => regionLabel(id, lang),
      (c) => c.region,
    ),
    bySegment: groupCount(
      activeCur,
      activePrev,
      SEGMENTS,
      (id) => segmentLabel(id, lang),
      (c) => c.segment,
    ),
  }
}

/**
 * Purchase cohorts: customers grouped by the month of their FIRST order.
 * retention[k] = % of the cohort that ordered again in month +k.
 * Month 0 is 100 % by definition.
 */
export function getRetention(
  ds: Dataset,
  to: ISODate,
  months = 6,
  filter: QueryFilter = { from: to, to },
): RetentionData {
  const lastMonth = monthKey(to)
  const cohortMonths: string[] = []
  for (let i = months - 1; i >= 0; i--) cohortMonths.push(monthKey(addMonths(lastMonth + '-01', -i)))

  const members = new Map<string, string[]>()
  for (const [customerId, first] of ds.firstOrderMonth) {
    if (!cohortMonths.includes(first)) continue
    const c = ds.customers.get(customerId)
    if (filter.channel && c?.channel !== filter.channel) continue
    if (filter.region && c?.region !== filter.region) continue
    const list = members.get(first) ?? []
    list.push(customerId)
    members.set(first, list)
  }

  const cohorts = cohortMonths.map((cohort) => {
    const ids = members.get(cohort) ?? []
    const retention: (number | null)[] = []
    for (let k = 0; k < months; k++) {
      const target = monthKey(addMonths(cohort + '-01', k))
      if (target > lastMonth) {
        retention.push(null)
        continue
      }
      if (k === 0) {
        retention.push(ids.length ? 100 : null)
        continue
      }
      let active = 0
      for (const id of ids) if (ds.customerOrderMonths.get(id)?.has(target)) active++
      retention.push(ids.length ? Math.round(shareOf(active, ids.length) * 10) / 10 : null)
    }
    return { cohort, size: ids.length, retention }
  })

  return { cohorts, months }
}
