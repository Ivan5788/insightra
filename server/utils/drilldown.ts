import { categoryLabel, channelLabel, getProduct, productLabel, regionLabel } from '~/data/catalog'
import type { DateRange } from '~/types/analytics'
import type { CategoryId, ChannelId } from '~/types/domain'
import type { DrillChart, DrillLevel, DrillParams, DrillRow, DrillView } from '~/types/drilldown'
import {
  addMonths,
  eachDay,
  formatLongDate,
  formatMonth,
  formatRange,
  formatShortDate,
  minDate,
  monthKey,
  weekdayLabels,
  weekdayIndex,
} from '~/utils/date'
import { byLang, tt } from '~/utils/locale'
import { percentChange, safeDivide } from '~/utils/stats'
import type { Dataset } from '../mock/generator'
import {
  clampToDataset,
  deriveMetrics,
  getBreakdown,
  getFunnel,
  getTimeSeries,
  lineRevenue,
  matchingLines,
  monthRange,
  rangeTotals,
  type QueryFilter,
} from './analytics'
import { queryOrders } from './orders'

/**
 * DRILL-DOWN DATA SERVICE
 * -----------------------
 * Every drill level returns the SAME shape (DrillView): KPIs + charts + table.
 * The frontend therefore needs only ONE generic component to render any
 * level, and rows carry a `next` level to drill into. Adding a new drill
 * flow = adding one function here; no new UI code.
 */

type Builder = (ds: Dataset, params: DrillParams) => DrillView

/** Dictionary translation for the drill-down texts (English text is the key). */
const ZH: Record<string, string> = {
  'Revenue by month': '各月營收',
  Period: '期間',
  'Last 12 months': '近 12 個月',
  '12-month revenue': '12 個月營收',
  'Avg. per month': '月平均',
  'Best month': '最佳月份',
  Orders: '訂單',
  'Monthly revenue': '月營收',
  Revenue: '營收',
  Month: '月份',
  AOV: '客單價',
  'MoM growth': '月增率',
  'Click a month (bar or row) to see daily revenue.': '點擊月份（長條或表格列）查看每日營收。',
  'Month revenue': '當月營收',
  'Avg. per day': '日平均',
  'Best day': '最佳單日',
  'Daily revenue': '每日營收',
  Date: '日期',
  Day: '日期',
  Weekday: '星期',
  'Click a day to see revenue by product.': '點擊日期查看各商品營收。',
  'Day revenue': '當日營收',
  'Units sold': '銷售件數',
  'Revenue by product': '各商品營收',
  Product: '商品',
  Category: '品類',
  Units: '件數',
  Share: '占比',
  'Click a product to see its orders on this day.': '點擊商品查看當日訂單。',
  'Excludes refunded / cancelled': '不含退款／取消',
  'Avg. unit price': '平均單價',
  'Revenue by channel': '各渠道營收',
  Order: '訂單',
  Time: '時間',
  Customer: '顧客',
  Channel: '渠道',
  Region: '地區',
  Qty: '數量',
  Amount: '金額',
  Status: '狀態',
  'Sales by category': '各品類銷售',
  Categories: '品類數',
  'Top category': '最大品類',
  'Revenue by category': '各品類營收',
  'vs prev.': '較前期',
  'Click a category to see its product ranking.': '點擊品類查看商品排行。',
  'Category revenue': '品類營收',
  Products: '商品數',
  'Product ranking': '商品排行',
  'Avg. price': '平均售價',
  'Click a product for detailed sales data.': '點擊商品查看詳細銷售資料。',
  'Avg. selling price': '平均售價',
  'Refund rate': '退款率',
  'Revenue trend': '營收趨勢',
  'By channel': '依渠道',
  'Recent order': '近期訂單',
  'Acquisition channels': '獲客渠道',
  Sessions: '工作階段',
  'Avg. DAU': '平均 DAU',
  Conversion: '轉換率',
  'Sessions by channel': '各渠道工作階段',
  'Conv. rate': '轉換率',
  'Click a channel to see its conversion funnel and user behaviour.': '點擊渠道查看轉換漏斗與用戶行為。',
  'New-customer orders': '新顧客訂單',
  'Conversion funnel': '轉換漏斗',
  Users: '用戶',
  'Sessions & orders': '工作階段與訂單',
  'Orders by segment': '各顧客類型訂單',
  'Funnel stage': '漏斗階段',
  'Step conversion': '階段轉換率',
  'From sessions': '相對工作階段',
}

/** Current request language is set by the API handler with withLang(). */
function L(en: string): string {
  return byLang(en, ZH[en] ?? en)
}

function rangeOf(ds: Dataset, params: DrillParams): DateRange {
  return clampToDataset(ds, { from: params.from ?? ds.firstDate, to: params.to ?? ds.lastDate })
}

function chart(
  partial: Omit<DrillChart, 'allowedTypes'> & { allowedTypes?: DrillChart['allowedTypes'] },
): DrillChart {
  return { allowedTypes: [partial.type], ...partial }
}

// ---- Flow 1: Revenue ------------------------------------------------------

const revenueMonths: Builder = (ds, params) => {
  const endMonth = monthKey(minDate(params.to ?? ds.lastDate, ds.lastDate))
  const months: string[] = []
  for (let i = 11; i >= 0; i--) months.push(monthKey(addMonths(endMonth + '-01', -i)))

  const rows: DrillRow[] = []
  let prevRevenue: number | null = null
  let total = 0
  let totalOrders = 0
  let best = { month: '', revenue: -1 }
  for (const m of months) {
    const range = monthRange(ds, m)
    const metrics = deriveMetrics(rangeTotals(ds, range, range), range)
    const revenue = metrics.revenue ?? 0
    total += revenue
    totalOrders += metrics.orders ?? 0
    if (revenue > best.revenue) best = { month: m, revenue }
    rows.push({
      id: m,
      cells: {
        month: formatMonth(m),
        revenue,
        orders: metrics.orders,
        aov: metrics.aov,
        growth: percentChange(revenue, prevRevenue),
      },
      next: { kind: 'revenue-days', label: formatMonth(m), params: { month: m } },
    })
    prevRevenue = revenue
  }

  return {
    kind: 'revenue-months',
    title: L('Revenue by month'),
    subtitle: formatMonth(months[0]!) + ' – ' + formatMonth(months[months.length - 1]!),
    filters: [{ label: L('Period'), value: L('Last 12 months') }],
    kpis: [
      { label: L('12-month revenue'), value: total, format: 'currency' },
      { label: L('Avg. per month'), value: total / months.length, format: 'currency' },
      { label: L('Best month'), value: best.revenue, format: 'currency', hint: formatMonth(best.month) },
      { label: L('Orders'), value: totalOrders, format: 'number' },
    ],
    charts: [
      chart({
        id: 'monthly',
        label: L('Monthly revenue'),
        type: 'bar',
        allowedTypes: ['bar', 'line'],
        categories: rows.map((r) => String(r.cells.month)),
        series: [{ name: L('Revenue'), data: rows.map((r) => Number(r.cells.revenue)) }],
        format: 'currency',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'month', label: L('Month'), format: 'text' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'orders', label: L('Orders'), format: 'number', align: 'right' },
      { key: 'aov', label: L('AOV'), format: 'currency', align: 'right' },
      { key: 'growth', label: L('MoM growth'), format: 'percent', align: 'right' },
    ],
    rows,
    nextHint: L('Click a month (bar or row) to see daily revenue.'),
  }
}

const revenueDays: Builder = (ds, params) => {
  const month = params.month ?? monthKey(ds.lastDate)
  const range = monthRange(ds, month)
  const rows: DrillRow[] = []
  let total = 0
  let orders = 0
  let best = { day: '', revenue: -1 }
  for (const day of eachDay(range)) {
    const f = { from: day, to: day }
    const m = deriveMetrics(rangeTotals(ds, f, f), f)
    const revenue = m.revenue ?? 0
    total += revenue
    orders += m.orders ?? 0
    if (revenue > best.revenue) best = { day, revenue }
    rows.push({
      id: day,
      cells: {
        date: formatShortDate(day),
        weekday: weekdayLabels()[weekdayIndex(day)]!,
        revenue,
        orders: m.orders,
        aov: m.aov,
      },
      next: { kind: 'revenue-products', label: formatShortDate(day), params: { day } },
    })
  }
  return {
    kind: 'revenue-days',
    title: L('Daily revenue') + ' · ' + formatMonth(month),
    subtitle: formatRange(range),
    filters: [{ label: L('Month'), value: formatMonth(month) }],
    kpis: [
      { label: L('Month revenue'), value: total, format: 'currency' },
      { label: L('Avg. per day'), value: rows.length ? total / rows.length : null, format: 'currency' },
      {
        label: L('Best day'),
        value: best.revenue,
        format: 'currency',
        hint: best.day ? formatShortDate(best.day) : undefined,
      },
      { label: L('Orders'), value: orders, format: 'number' },
    ],
    charts: [
      chart({
        id: 'daily',
        label: L('Daily revenue'),
        type: 'line',
        allowedTypes: ['line', 'bar'],
        categories: rows.map((r) => String(r.cells.date)),
        series: [{ name: L('Revenue'), data: rows.map((r) => Number(r.cells.revenue)) }],
        format: 'currency',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'date', label: L('Date'), format: 'text' },
      { key: 'weekday', label: L('Weekday'), format: 'text' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'orders', label: L('Orders'), format: 'number', align: 'right' },
      { key: 'aov', label: L('AOV'), format: 'currency', align: 'right' },
    ],
    rows,
    nextHint: L('Click a day to see revenue by product.'),
  }
}

const revenueProducts: Builder = (ds, params) => {
  const day = params.day ?? ds.lastDate
  const filter = { from: day, to: day }
  const breakdown = getBreakdown(ds, filter, 'product', 'revenue')
  const items = breakdown.items.filter((i) => i.value > 0)
  const rows: DrillRow[] = items.map((i) => ({
    id: i.key,
    cells: {
      product: i.label,
      category: categoryLabel(getProduct(i.key)?.category ?? ''),
      units: i.extra.unitsSold ?? 0,
      orders: i.extra.orders ?? 0,
      revenue: i.value,
      share: i.share,
    },
    next: { kind: 'product-orders', label: i.label, params: { day, productId: i.key } },
  }))
  const totals = deriveMetrics(rangeTotals(ds, filter, filter), filter)
  return {
    kind: 'revenue-products',
    title: L('Revenue by product') + ' · ' + formatLongDate(day),
    subtitle: tt('{n} products sold', '售出 {n} 項商品', { n: items.length }),
    filters: [{ label: L('Day'), value: formatLongDate(day) }],
    kpis: [
      { label: L('Day revenue'), value: totals.revenue, format: 'currency' },
      { label: L('Orders'), value: totals.orders, format: 'number' },
      { label: L('Units sold'), value: totals.unitsSold, format: 'number' },
      { label: L('AOV'), value: totals.aov, format: 'currency' },
    ],
    charts: [
      chart({
        id: 'products',
        label: L('Revenue by product'),
        type: 'bar',
        allowedTypes: ['bar', 'pie'],
        categories: rows.map((r) => String(r.cells.product)),
        series: [{ name: L('Revenue'), data: rows.map((r) => Number(r.cells.revenue)) }],
        format: 'currency',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'product', label: L('Product'), format: 'text' },
      { key: 'category', label: L('Category'), format: 'text' },
      { key: 'units', label: L('Units'), format: 'number', align: 'right' },
      { key: 'orders', label: L('Orders'), format: 'number', align: 'right' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'share', label: L('Share'), format: 'percent', align: 'right' },
    ],
    rows,
    nextHint: L('Click a product to see its orders on this day.'),
  }
}

const productOrders: Builder = (ds, params) => {
  const day = params.day ?? ds.lastDate
  const productId = params.productId ?? ''
  const result = queryOrders(ds, {
    from: day,
    to: day,
    productId,
    page: 1,
    pageSize: 500,
    sortBy: 'date',
    sortDir: 'asc',
  })
  const byChannel = new Map<string, number>()
  let revenue = 0
  let units = 0
  for (const r of result.items) {
    if (r.status === 'completed' || r.status === 'pending') {
      revenue += r.total
      units += r.units
      byChannel.set(channelLabel(r.channel), (byChannel.get(channelLabel(r.channel)) ?? 0) + r.total)
    }
  }
  const channels = [...byChannel.entries()].sort((a, b) => b[1] - a[1])
  return {
    kind: 'product-orders',
    title: productLabel(productId) + ' · ' + tt('orders', '訂單'),
    subtitle: formatLongDate(day),
    filters: [
      { label: L('Day'), value: formatLongDate(day) },
      { label: L('Product'), value: productLabel(productId) },
    ],
    kpis: [
      { label: L('Orders'), value: result.total, format: 'number' },
      { label: L('Units'), value: units, format: 'number' },
      { label: L('Revenue'), value: revenue, format: 'currency', hint: L('Excludes refunded / cancelled') },
      { label: L('Avg. unit price'), value: safeDivide(revenue, units), format: 'currency' },
    ],
    charts: [
      chart({
        id: 'channel',
        label: L('Revenue by channel'),
        type: 'pie',
        allowedTypes: ['pie', 'bar'],
        categories: channels.map((c) => c[0]),
        series: [{ name: L('Revenue'), data: channels.map((c) => Math.round(c[1] * 100) / 100) }],
        format: 'currency',
        linkedToRows: false,
      }),
    ],
    columns: [
      { key: 'id', label: L('Order'), format: 'text' },
      { key: 'time', label: L('Time'), format: 'text' },
      { key: 'customer', label: L('Customer'), format: 'text' },
      { key: 'channel', label: L('Channel'), format: 'text' },
      { key: 'region', label: L('Region'), format: 'text' },
      { key: 'units', label: L('Qty'), format: 'number', align: 'right' },
      { key: 'total', label: L('Amount'), format: 'currency', align: 'right' },
      { key: 'status', label: L('Status'), format: 'text' },
    ],
    rows: result.items.map((r) => ({
      id: r.id,
      cells: {
        id: r.id,
        time: String(r.hour).padStart(2, '0') + ':00',
        customer: r.customerName,
        channel: channelLabel(r.channel),
        region: regionLabel(r.region),
        units: r.units,
        total: r.total,
        status: r.status,
      },
    })),
  }
}

// ---- Flow 2: Category → product → detail ---------------------------------

const categories: Builder = (ds, params) => {
  const range = rangeOf(ds, params)
  const b = getBreakdown(ds, range, 'category', 'revenue')
  const rows: DrillRow[] = b.items.map((i) => ({
    id: i.key,
    cells: {
      category: i.label,
      revenue: i.value,
      orders: i.extra.orders ?? 0,
      units: i.extra.unitsSold ?? 0,
      share: i.share,
      growth: i.deltaPercent,
    },
    next: { kind: 'category-products', label: i.label, params: { ...range, category: i.key as CategoryId } },
  }))
  return {
    kind: 'categories',
    title: L('Sales by category'),
    subtitle: formatRange(range),
    filters: [{ label: L('Period'), value: formatRange(range) }],
    kpis: [
      { label: L('Revenue'), value: b.total, format: 'currency' },
      { label: L('Categories'), value: rows.length, format: 'number' },
      {
        label: L('Top category'),
        value: b.items[0]?.share ?? null,
        format: 'percent',
        hint: b.items[0]?.label,
      },
    ],
    charts: [
      chart({
        id: 'categories',
        label: L('Revenue by category'),
        type: 'pie',
        allowedTypes: ['pie', 'bar'],
        categories: rows.map((r) => String(r.cells.category)),
        series: [{ name: L('Revenue'), data: rows.map((r) => Number(r.cells.revenue)) }],
        format: 'currency',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'category', label: L('Category'), format: 'text' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'orders', label: L('Orders'), format: 'number', align: 'right' },
      { key: 'units', label: L('Units'), format: 'number', align: 'right' },
      { key: 'share', label: L('Share'), format: 'percent', align: 'right' },
      { key: 'growth', label: L('vs prev.'), format: 'percent', align: 'right' },
    ],
    rows,
    nextHint: L('Click a category to see its product ranking.'),
  }
}

const categoryProducts: Builder = (ds, params) => {
  const range = rangeOf(ds, params)
  const category = params.category ?? 'electronics'
  const filter: QueryFilter = { ...range, category }
  const b = getBreakdown(ds, filter, 'product', 'revenue')
  const rows: DrillRow[] = b.items.map((i, idx) => ({
    id: i.key,
    cells: {
      rank: idx + 1,
      product: i.label,
      units: i.extra.unitsSold ?? 0,
      revenue: i.value,
      price: safeDivide(i.value, i.extra.unitsSold ?? 0),
      growth: i.deltaPercent,
    },
    next: { kind: 'product-detail', label: i.label, params: { ...range, productId: i.key } },
  }))
  const m = deriveMetrics(rangeTotals(ds, range, filter), filter)
  return {
    kind: 'category-products',
    title: categoryLabel(category) + ' · ' + tt('product ranking', '商品排行'),
    subtitle: formatRange(range),
    filters: [
      { label: L('Period'), value: formatRange(range) },
      { label: L('Category'), value: categoryLabel(category) },
    ],
    kpis: [
      { label: L('Category revenue'), value: m.revenue, format: 'currency' },
      { label: L('Orders'), value: m.orders, format: 'number' },
      { label: L('Units sold'), value: m.unitsSold, format: 'number' },
      { label: L('Products'), value: rows.length, format: 'number' },
    ],
    charts: [
      chart({
        id: 'ranking',
        label: L('Product ranking'),
        type: 'bar',
        allowedTypes: ['bar', 'pie'],
        categories: rows.map((r) => String(r.cells.product)),
        series: [{ name: L('Revenue'), data: rows.map((r) => Number(r.cells.revenue)) }],
        format: 'currency',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'rank', label: '#', format: 'number' },
      { key: 'product', label: L('Product'), format: 'text' },
      { key: 'units', label: L('Units'), format: 'number', align: 'right' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'price', label: L('Avg. price'), format: 'currency', align: 'right' },
      { key: 'growth', label: L('vs prev.'), format: 'percent', align: 'right' },
    ],
    rows,
    nextHint: L('Click a product for detailed sales data.'),
  }
}

const productDetail: Builder = (ds, params) => {
  const range = rangeOf(ds, params)
  const productId = params.productId ?? ''
  const product = getProduct(productId)
  const filter: QueryFilter = { ...range, productId }
  const m = deriveMetrics(rangeTotals(ds, range, filter), filter)
  const series = getTimeSeries(ds, filter, eachDay(range).length > 60 ? 'week' : 'day', false)
  const byChannel = getBreakdown(ds, filter, 'channel', 'revenue').items.filter((i) => i.value > 0)
  const recent = queryOrders(ds, { ...filter, page: 1, pageSize: 15, sortBy: 'date', sortDir: 'desc' })

  return {
    kind: 'product-detail',
    title: productLabel(productId),
    subtitle:
      categoryLabel(product?.category ?? '') +
      ' · ' +
      tt('list price', '定價') +
      ' $' +
      (product?.price ?? '—'),
    filters: [
      { label: L('Period'), value: formatRange(range) },
      { label: L('Product'), value: productLabel(productId) },
    ],
    kpis: [
      { label: L('Revenue'), value: m.revenue, format: 'currency' },
      { label: L('Units sold'), value: m.unitsSold, format: 'number' },
      { label: L('Orders'), value: m.orders, format: 'number' },
      { label: L('Avg. selling price'), value: safeDivide(m.revenue, m.unitsSold), format: 'currency' },
      { label: L('Refund rate'), value: m.refundRate, format: 'percent' },
    ],
    charts: [
      chart({
        id: 'trend',
        label: L('Revenue trend'),
        type: 'line',
        allowedTypes: ['line', 'bar'],
        categories: series.current.map((p) => formatShortDate(p.bucket)),
        series: [{ name: L('Revenue'), data: series.current.map((p) => p.values.revenue ?? 0) }],
        format: 'currency',
        linkedToRows: false,
      }),
      chart({
        id: 'channels',
        label: L('By channel'),
        type: 'pie',
        allowedTypes: ['pie', 'bar'],
        categories: byChannel.map((c) => c.label),
        series: [{ name: L('Revenue'), data: byChannel.map((c) => c.value) }],
        format: 'currency',
        linkedToRows: false,
      }),
    ],
    columns: [
      { key: 'id', label: L('Recent order'), format: 'text' },
      { key: 'date', label: L('Date'), format: 'text' },
      { key: 'customer', label: L('Customer'), format: 'text' },
      { key: 'channel', label: L('Channel'), format: 'text' },
      { key: 'units', label: L('Qty'), format: 'number', align: 'right' },
      { key: 'total', label: L('Amount'), format: 'currency', align: 'right' },
      { key: 'status', label: L('Status'), format: 'text' },
    ],
    rows: recent.items.map((r) => ({
      id: r.id,
      cells: {
        id: r.id,
        date: formatShortDate(r.date),
        customer: r.customerName,
        channel: channelLabel(r.channel),
        units: r.units,
        total: r.total,
        status: r.status,
      },
    })),
  }
}

// ---- Flow 3: Channel → behaviour -----------------------------------------

const channels: Builder = (ds, params) => {
  const range = rangeOf(ds, params)
  const b = getBreakdown(ds, range, 'channel', 'sessions')
  const rows: DrillRow[] = b.items.map((i) => ({
    id: i.key,
    cells: {
      channel: i.label,
      sessions: i.extra.sessions ?? 0,
      users: i.extra.activeUsers ?? 0,
      orders: i.extra.orders ?? 0,
      conversion: i.extra.conversionRate ?? null,
      revenue: i.extra.revenue ?? 0,
      aov: i.extra.aov ?? null,
    },
    next: { kind: 'channel-detail', label: i.label, params: { ...range, channel: i.key as ChannelId } },
  }))
  const t = deriveMetrics(rangeTotals(ds, range, range), range)
  return {
    kind: 'channels',
    title: L('Acquisition channels'),
    subtitle: formatRange(range),
    filters: [{ label: L('Period'), value: formatRange(range) }],
    kpis: [
      { label: L('Sessions'), value: t.sessions, format: 'number' },
      { label: L('Avg. DAU'), value: t.activeUsers, format: 'number' },
      { label: L('Orders'), value: t.orders, format: 'number' },
      { label: L('Conversion'), value: t.conversionRate, format: 'percent' },
    ],
    charts: [
      chart({
        id: 'sessions',
        label: L('Sessions by channel'),
        type: 'bar',
        allowedTypes: ['bar', 'pie'],
        categories: rows.map((r) => String(r.cells.channel)),
        series: [{ name: L('Sessions'), data: rows.map((r) => Number(r.cells.sessions)) }],
        format: 'number',
        linkedToRows: true,
      }),
    ],
    columns: [
      { key: 'channel', label: L('Channel'), format: 'text' },
      { key: 'sessions', label: L('Sessions'), format: 'number', align: 'right' },
      { key: 'users', label: L('Avg. DAU'), format: 'number', align: 'right' },
      { key: 'orders', label: L('Orders'), format: 'number', align: 'right' },
      { key: 'conversion', label: L('Conv. rate'), format: 'percent', align: 'right' },
      { key: 'revenue', label: L('Revenue'), format: 'currency', align: 'right' },
      { key: 'aov', label: L('AOV'), format: 'currency', align: 'right' },
    ],
    rows,
    nextHint: L('Click a channel to see its conversion funnel and user behaviour.'),
  }
}

const channelDetail: Builder = (ds, params) => {
  const range = rangeOf(ds, params)
  const channel = params.channel ?? 'organic'
  const filter: QueryFilter = { ...range, channel }
  const m = deriveMetrics(rangeTotals(ds, range, filter), filter)
  const funnel = getFunnel(ds, filter)
  const series = getTimeSeries(ds, filter, eachDay(range).length > 60 ? 'week' : 'day', false)
  const segments = getBreakdown(ds, filter, 'segment', 'orders').items

  return {
    kind: 'channel-detail',
    title: channelLabel(channel),
    subtitle: tt('Conversion funnel & behaviour', '轉換漏斗與行為') + ' · ' + formatRange(range),
    filters: [
      { label: L('Period'), value: formatRange(range) },
      { label: L('Channel'), value: channelLabel(channel) },
    ],
    kpis: [
      { label: L('Sessions'), value: m.sessions, format: 'number' },
      { label: L('Avg. DAU'), value: m.activeUsers, format: 'number' },
      { label: L('Conversion'), value: m.conversionRate, format: 'percent' },
      { label: L('Revenue'), value: m.revenue, format: 'currency' },
      { label: L('AOV'), value: m.aov, format: 'currency' },
      {
        label: L('New-customer orders'),
        value: m.orders ? ((m.newCustomers ?? 0) / m.orders) * 100 : null,
        format: 'percent',
      },
    ],
    charts: [
      chart({
        id: 'funnel',
        label: L('Conversion funnel'),
        type: 'funnel',
        categories: funnel.stages.map((s) => s.label),
        series: [{ name: L('Users'), data: funnel.stages.map((s) => s.value) }],
        format: 'number',
        linkedToRows: false,
      }),
      chart({
        id: 'trend',
        label: L('Sessions & orders'),
        type: 'line',
        allowedTypes: ['line', 'bar'],
        categories: series.current.map((p) => formatShortDate(p.bucket)),
        series: [
          { name: L('Sessions'), data: series.current.map((p) => p.values.sessions ?? 0) },
          { name: L('Orders'), data: series.current.map((p) => p.values.orders ?? 0) },
        ],
        format: 'number',
        linkedToRows: false,
      }),
      chart({
        id: 'segments',
        label: L('Orders by segment'),
        type: 'pie',
        allowedTypes: ['pie', 'bar'],
        categories: segments.map((s) => s.label),
        series: [{ name: L('Orders'), data: segments.map((s) => s.value) }],
        format: 'number',
        linkedToRows: false,
      }),
    ],
    columns: [
      { key: 'stage', label: L('Funnel stage'), format: 'text' },
      { key: 'value', label: L('Users'), format: 'number', align: 'right' },
      { key: 'step', label: L('Step conversion'), format: 'percent', align: 'right' },
      { key: 'overall', label: L('From sessions'), format: 'percent', align: 'right' },
    ],
    rows: funnel.stages.map((s) => ({
      id: s.key,
      cells: { stage: s.label, value: s.value, step: s.rateFromPrevious, overall: s.rateFromTop },
    })),
  }
}

const BUILDERS: Record<DrillLevel['kind'], Builder> = {
  'revenue-months': revenueMonths,
  'revenue-days': revenueDays,
  'revenue-products': revenueProducts,
  'product-orders': productOrders,
  categories,
  'category-products': categoryProducts,
  'product-detail': productDetail,
  channels,
  'channel-detail': channelDetail,
}

export function getDrillView(ds: Dataset, kind: DrillLevel['kind'], params: DrillParams): DrillView {
  return BUILDERS[kind](ds, params)
}

/** Used by tests: sum of a matching order's line revenue (sanity checks). */
export function productRevenueOnDay(ds: Dataset, productId: string, day: string): number {
  const record = ds.days.get(day)
  if (!record) return 0
  let total = 0
  for (const o of record.orders) {
    if (o.status !== 'completed' && o.status !== 'pending') continue
    total += lineRevenue(matchingLines(o, { from: day, to: day, productId }))
  }
  return Math.round(total * 100) / 100
}
