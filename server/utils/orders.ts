import { getProduct, productLabel, segmentLabel } from '~/data/catalog'
import { byLang, getLang, type Lang } from '~/utils/locale'
import type { OrderRow, OrdersQuery } from '~/types/analytics'
import type { Paginated } from '~/types/api'
import type { CategoryId, Order } from '~/types/domain'
import { eachDay } from '~/utils/date'
import type { Dataset } from '../mock/generator'
import { lineRevenue, matchingLines, orderMatches } from './analytics'

/**
 * Orders list endpoint logic: filter → search → sort → paginate.
 * Done on the server ("server-side pagination") so the browser never
 * downloads tens of thousands of rows.
 */

export function toOrderRow(ds: Dataset, order: Order, lines = order.lines, lang: Lang = getLang()): OrderRow {
  const customer = ds.customers.get(order.customerId)
  const categories = new Set<CategoryId>()
  const names: string[] = []
  let units = 0
  for (const l of lines) {
    const p = getProduct(l.productId)
    if (p) {
      categories.add(p.category)
      names.push(productLabel(p.id, lang))
    }
    units += l.quantity
  }
  return {
    id: order.id,
    date: order.date,
    hour: order.hour,
    customerId: order.customerId,
    customerName: customer?.name ?? byLang('Unknown', '未知', lang),
    segment: segmentLabel(customer?.segment ?? 'standard', lang),
    channel: order.channel,
    region: order.region,
    status: order.status,
    items: lines.length,
    units,
    total: Math.round(lineRevenue(lines) * 100) / 100,
    products: names.join(', '),
    categories: [...categories],
  }
}

export function queryOrders(ds: Dataset, q: OrdersQuery): Paginated<OrderRow> {
  const range = q.day ? { from: q.day, to: q.day } : { from: q.from, to: q.to }
  const search = q.search?.trim().toLowerCase()
  const rows: OrderRow[] = []

  for (const date of eachDay(range)) {
    const record = ds.days.get(date)
    if (!record) continue
    for (const order of record.orders) {
      if (!orderMatches(ds, order, q)) continue
      if (q.status && order.status !== q.status) continue
      const lines = matchingLines(order, q)
      if (lines.length === 0) continue
      const row = toOrderRow(ds, order, lines, q.lang)
      if (search) {
        const haystack = (row.id + ' ' + row.customerName + ' ' + row.products).toLowerCase()
        if (!haystack.includes(search)) continue
      }
      rows.push(row)
    }
  }

  const dir = q.sortDir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    let cmp: number
    if (q.sortBy === 'date')
      cmp = a.date === b.date ? a.hour - b.hour || a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1
    else if (q.sortBy === 'total' || q.sortBy === 'units') cmp = a[q.sortBy] - b[q.sortBy]
    else cmp = String(a[q.sortBy]).localeCompare(String(b[q.sortBy]))
    return cmp * dir
  })

  const start = (q.page - 1) * q.pageSize
  return {
    items: rows.slice(start, start + q.pageSize),
    total: rows.length,
    page: q.page,
    pageSize: q.pageSize,
  }
}
