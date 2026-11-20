import { channelLabel, getProduct, productLabel, regionLabel } from '~/data/catalog'
import type { ActivityItem, NotificationItem } from '~/types/analytics'
import type { ISODate } from '~/types/domain'
import { addDays, formatShortDate, startOfWeek } from '~/utils/date'
import { formatCurrency, formatDeltaPercent, formatPercent } from '~/utils/format'
import { tt } from '~/utils/locale'
import { percentChange } from '~/utils/stats'
import type { Dataset } from '../mock/generator'
import { getBreakdown, getTarget, lineRevenue, rangeTotals } from './analytics'

/**
 * Activity feed & notifications are DERIVED from the same dataset,
 * so "Order ORD-… refunded" in the feed is a real row in the orders table.
 * Text uses tt(): the API handlers call these builders inside withLang().
 */

export function getActivity(ds: Dataset, limit = 12): ActivityItem[] {
  const items: ActivityItem[] = []
  for (let i = 0; i < 3 && items.length < limit * 3; i++) {
    const date = addDays(ds.lastDate, -i)
    const record = ds.days.get(date)
    if (!record) continue
    for (const order of record.orders) {
      const total = lineRevenue(order.lines)
      if (order.status === 'refunded') {
        items.push({
          id: 'act-' + order.id + '-r',
          type: 'refund',
          title: tt('Refund issued', '已退款'),
          description: order.id + ' · ' + regionLabel(order.region),
          date,
          hour: order.hour,
          amount: total,
        })
      } else if (total >= 280) {
        const firstId = order.lines[0]!.productId
        const first = getProduct(firstId) ? productLabel(firstId) : tt('Order', '訂單')
        items.push({
          id: 'act-' + order.id,
          type: 'order',
          title: tt('Large order received', '收到大額訂單'),
          description:
            order.id + ' · ' + first + (order.lines.length > 1 ? ' +' + (order.lines.length - 1) : ''),
          date,
          hour: order.hour,
          amount: total,
        })
      }
    }
    const vip = record.signups.map((id) => ds.customers.get(id)).filter((c) => c?.segment === 'vip')
    for (const c of vip.slice(0, 3)) {
      items.push({
        id: 'act-signup-' + c!.id,
        type: 'signup',
        title: tt('New VIP customer', '新的 VIP 顧客'),
        description: tt('{name} via {ch}', '{name} · 來自{ch}', {
          name: c!.name,
          ch: channelLabel(c!.channel),
        }),
        date,
        hour: 9 + (c!.id.length % 10),
      })
    }
  }
  return items
    .sort((a, b) => (a.date === b.date ? b.hour - a.hour : a.date < b.date ? 1 : -1))
    .slice(0, limit)
}

export function getNotifications(ds: Dataset): NotificationItem[] {
  const today = ds.lastDate
  const yesterday = addDays(today, -1)
  const dayBefore = addDays(today, -2)
  const list: NotificationItem[] = []

  const y = rangeTotals(ds, { from: yesterday, to: yesterday }, { from: yesterday, to: yesterday })
  const d = rangeTotals(ds, { from: dayBefore, to: dayBefore }, { from: dayBefore, to: dayBefore })
  const change = percentChange(y.revenue, d.revenue)
  if (change !== null) {
    list.push({
      id: 'n-rev-' + yesterday,
      type: Math.abs(change) >= 10 ? (change > 0 ? 'success' : 'alert') : 'info',
      title:
        change >= 0
          ? tt('Daily revenue up {x}', '單日營收上升 {x}', { x: formatDeltaPercent(change) })
          : tt('Daily revenue down {x}', '單日營收下降 {x}', { x: formatDeltaPercent(change) }),
      message: tt('Revenue on {day} was {a} vs {b} the day before.', '{day} 營收為 {a}，前一天為 {b}。', {
        day: formatShortDate(yesterday),
        a: formatCurrency(y.revenue),
        b: formatCurrency(d.revenue),
      }),
      date: today,
      link: '/analytics',
    })
  }

  const weekRange = { from: addDays(today, -6), to: today }
  const top = getBreakdown(ds, weekRange, 'product', 'revenue').items[0]
  if (top) {
    list.push({
      id: 'n-top-' + startOfWeek(today),
      type: 'info',
      title: tt('Best seller this week', '本週暢銷商品'),
      message: tt('{p} generated {v} in the last 7 days.', '{p} 近 7 天創造 {v} 營收。', {
        p: top.label,
        v: formatCurrency(top.value),
      }),
      date: today,
      link: '/sales',
    })
  }

  const target = getTarget(ds, { from: today, to: today })
  list.push({
    id: 'n-target-' + target.month + '-' + Math.floor(target.progress / 25),
    type: target.progress >= 100 ? 'success' : 'info',
    title: tt('Monthly target at {p}', '月目標達成 {p}', { p: formatPercent(target.progress, 0) }),
    message: tt('{a} of {b} with {n} days left.', '已達成 {a} / {b}，剩餘 {n} 天。', {
      a: formatCurrency(target.achieved),
      b: formatCurrency(target.target),
      n: target.daysInMonth - target.daysElapsed,
    }),
    date: today,
    link: '/sales',
  })

  const week = rangeTotals(ds, weekRange, weekRange)
  const refundRate = week.orders ? (week.refunded / week.orders) * 100 : 0
  if (refundRate > 5) {
    list.push({
      id: 'n-refund-' + startOfWeek(today),
      type: 'warning',
      title: tt('Refund rate above 5%', '退款率超過 5%'),
      message: tt(
        'Refund rate for the last 7 days is {r}. Review recent refunds in the data table.',
        '近 7 天退款率為 {r}，請到資料表檢視近期退款。',
        { r: formatPercent(refundRate) },
      ),
      date: today,
      link: '/data?status=refunded',
    })
  }

  for (let i = 1; i <= 8; i++) {
    const date: ISODate = addDays(today, -i)
    const record = ds.days.get(date)
    if (!record) continue
    const biggest = [...record.orders].sort((a, b) => lineRevenue(b.lines) - lineRevenue(a.lines))[0]
    if (biggest && i % 2 === 1) {
      list.push({
        id: 'n-big-' + biggest.id,
        type: 'info',
        title: tt('Largest order on {d}', '{d} 最大筆訂單', { d: formatShortDate(date) }),
        message: tt('{id} · {v} from {r}.', '{id} · {v}，來自{r}。', {
          id: biggest.id,
          v: formatCurrency(lineRevenue(biggest.lines)),
          r: regionLabel(biggest.region),
        }),
        date,
        link: '/data?search=' + biggest.id,
      })
    }
    if (i === 7) {
      list.push({
        id: 'n-report-' + date,
        type: 'success',
        title: tt('Weekly performance report is ready', '每週績效報表已產生'),
        message: tt(
          'Your scheduled report "Weekly Sales Summary" has been generated.',
          '你排程的報表「每週銷售摘要」已產生。',
        ),
        date,
        link: '/reports',
      })
    }
  }

  return list
}
