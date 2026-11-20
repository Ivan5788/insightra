import type { MetricKey } from '~/types/analytics'
import type { ValueFormat } from './format'
import { getLang, type Lang } from './locale'

/**
 * Metric dictionary — a single source of truth for how each metric is
 * named, formatted and explained. Components never hard-code these.
 */
export interface MetricDefinition {
  key: MetricKey
  label: string
  shortLabel: string
  format: Extract<ValueFormat, 'currency' | 'number' | 'percent'>
  /** Tooltip text — exactly how the number is calculated. */
  description: string
  /** false for metrics where "down" is good (e.g. refund rate). */
  higherIsBetter: boolean
  /** Deltas of percentage metrics are shown in percentage points. */
  deltaUnit: 'percent' | 'pp'
}

export const METRICS: Record<MetricKey, MetricDefinition> = {
  revenue: {
    key: 'revenue',
    label: 'Total Revenue',
    shortLabel: 'Revenue',
    format: 'currency',
    description: 'Net revenue from completed and pending orders. Refunded and cancelled orders are excluded.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  orders: {
    key: 'orders',
    label: 'Total Orders',
    shortLabel: 'Orders',
    format: 'number',
    description: 'Number of orders placed in the period, including refunded and cancelled orders.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  activeUsers: {
    key: 'activeUsers',
    label: 'Active Users',
    shortLabel: 'Active users',
    format: 'number',
    description:
      'Average daily active users (DAU): users with at least one session per day, averaged over the period.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  conversionRate: {
    key: 'conversionRate',
    label: 'Conversion Rate',
    shortLabel: 'Conversion',
    format: 'percent',
    description: 'Orders ÷ sessions × 100. Only available when no product/category/region filter is applied.',
    higherIsBetter: true,
    deltaUnit: 'pp',
  },
  aov: {
    key: 'aov',
    label: 'Average Order Value',
    shortLabel: 'AOV',
    format: 'currency',
    description: 'Net revenue ÷ number of revenue-generating orders (completed + pending).',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  revenueGrowth: {
    key: 'revenueGrowth',
    label: 'Revenue Growth',
    shortLabel: 'Growth',
    format: 'percent',
    description:
      'Revenue change vs the previous period of the same length. The comparison shows how growth itself changed (in percentage points).',
    higherIsBetter: true,
    deltaUnit: 'pp',
  },
  sessions: {
    key: 'sessions',
    label: 'Sessions',
    shortLabel: 'Sessions',
    format: 'number',
    description: 'Total website sessions from all acquisition channels.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  unitsSold: {
    key: 'unitsSold',
    label: 'Units Sold',
    shortLabel: 'Units',
    format: 'number',
    description: 'Number of product units in completed and pending orders.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  newCustomers: {
    key: 'newCustomers',
    label: 'New Customers',
    shortLabel: 'New customers',
    format: 'number',
    description: 'Customers who placed their first order in the period.',
    higherIsBetter: true,
    deltaUnit: 'percent',
  },
  refundRate: {
    key: 'refundRate',
    label: 'Refund Rate',
    shortLabel: 'Refunds',
    format: 'percent',
    description: 'Refunded orders ÷ all orders × 100. Lower is better.',
    higherIsBetter: false,
    deltaUnit: 'pp',
  },
}

/** Traditional Chinese names and explanations (same calculation rules). */
const METRICS_ZH: Record<MetricKey, Pick<MetricDefinition, 'label' | 'shortLabel' | 'description'>> = {
  revenue: {
    label: '總營收',
    shortLabel: '營收',
    description: '已完成與處理中訂單的淨營收，不含退款與取消的訂單。',
  },
  orders: { label: '總訂單', shortLabel: '訂單', description: '期間內的下單數，包含已退款與已取消的訂單。' },
  activeUsers: {
    label: '活躍使用者',
    shortLabel: '活躍使用者',
    description: '每日活躍使用者（DAU）的期間平均：當天至少有一次工作階段的使用者。',
  },
  conversionRate: {
    label: '轉換率',
    shortLabel: '轉換率',
    description: '訂單數 ÷ 工作階段 × 100。套用商品 / 品類 / 地區篩選時無法提供。',
  },
  aov: {
    label: '平均客單價',
    shortLabel: '客單價',
    description: '淨營收 ÷ 產生營收的訂單數（已完成 + 處理中）。',
  },
  revenueGrowth: {
    label: '營收成長率',
    shortLabel: '成長率',
    description: '與前一個等長期間相比的營收變化；比較值顯示成長率本身的變化（百分點）。',
  },
  sessions: { label: '工作階段', shortLabel: '工作階段', description: '所有流量渠道的網站工作階段總數。' },
  unitsSold: { label: '售出件數', shortLabel: '件數', description: '已完成與處理中訂單的商品件數。' },
  newCustomers: { label: '新顧客', shortLabel: '新顧客', description: '在期間內完成首次購買的顧客。' },
  refundRate: { label: '退款率', shortLabel: '退款率', description: '退款訂單 ÷ 全部訂單 × 100，越低越好。' },
}

/** Metric definition with label / description in the current UI language. */
export function metricInfo(key: MetricKey, lang: Lang = getLang()): MetricDefinition {
  return lang === 'zh-TW' ? { ...METRICS[key], ...METRICS_ZH[key] } : METRICS[key]
}

export function metricLabel(key: MetricKey, lang: Lang = getLang()): string {
  return metricInfo(key, lang).label
}

/**
 * Is a change "good"? Used to colour deltas: a falling refund rate is
 * shown in green even though the arrow points down.
 */
export function isPositiveChange(key: MetricKey, delta: number | null): boolean | null {
  if (delta === null || delta === 0) return null
  return METRICS[key].higherIsBetter ? delta > 0 : delta < 0
}
