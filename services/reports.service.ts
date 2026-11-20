import { z } from 'zod'
import type { ReportDefinition } from '~/types/app'
import { createId } from '~/utils/id'
import { byLang } from '~/utils/locale'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/**
 * Reports repository.
 *
 * Report definitions are user-owned data, so a real product would store
 * them in a database via REST (GET/POST/PUT/DELETE /api/reports).
 * For this demo they live in localStorage, behind the SAME async interface
 * a REST client would have — swapping to a real API only changes this file.
 */

const metricEnum = z.enum([
  'revenue',
  'orders',
  'activeUsers',
  'conversionRate',
  'aov',
  'revenueGrowth',
  'sessions',
  'unitsSold',
  'newCustomers',
  'refundRate',
])

const reportSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  description: z.string().max(300),
  type: z.enum(['sales', 'traffic', 'customers', 'products']),
  metrics: z.array(metricEnum).min(1),
  preset: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'lastMonth', 'custom']),
  customRange: z.object({ from: z.string(), to: z.string() }).optional(),
  granularity: z.enum(['day', 'week', 'month']),
  schedule: z.enum(['none', 'weekly', 'monthly']),
  owner: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const listSchema = z.array(reportSchema)

export type NewReport = Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'owner'>

/** Example reports, in the current UI language (until the user saves changes). */
const SEED = (): ReportDefinition[] => [
  {
    id: 'rep-weekly-sales',
    name: byLang('Weekly Sales Summary', '每週銷售摘要'),
    description: byLang(
      'Revenue, orders and AOV for the last 7 days. Shared with the leadership team every Monday.',
      '近 7 天的營收、訂單與客單價，每週一分享給管理團隊。',
    ),
    type: 'sales',
    metrics: ['revenue', 'orders', 'aov', 'unitsSold'],
    preset: 'last7',
    granularity: 'day',
    schedule: 'weekly',
    owner: 'Alex Morgan',
    createdAt: '2026-06-02T09:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'rep-monthly-perf',
    name: byLang('Monthly Performance Review', '月度績效檢討'),
    description: byLang(
      'Full month KPI review including conversion and refund rate.',
      '完整月份的 KPI 檢討，包含轉換率與退款率。',
    ),
    type: 'sales',
    metrics: ['revenue', 'orders', 'conversionRate', 'refundRate'],
    preset: 'lastMonth',
    granularity: 'week',
    schedule: 'monthly',
    owner: 'Alex Morgan',
    createdAt: '2026-03-15T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'rep-traffic-90',
    name: byLang('Traffic & Conversion (90 days)', '流量與轉換（90 天）'),
    description: byLang(
      'Sessions, active users and conversion trend for marketing planning.',
      '工作階段、活躍用戶與轉換趨勢，供行銷規劃使用。',
    ),
    type: 'traffic',
    metrics: ['sessions', 'activeUsers', 'conversionRate'],
    preset: 'last90',
    granularity: 'week',
    schedule: 'none',
    owner: 'Jamie Lin',
    createdAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'rep-customers',
    name: byLang('Customer Acquisition', '顧客獲取'),
    description: byLang(
      'New customers and order volume over the last 30 days.',
      '近 30 天的新顧客數與訂單量。',
    ),
    type: 'customers',
    metrics: ['newCustomers', 'orders', 'aov'],
    preset: 'last30',
    granularity: 'day',
    schedule: 'weekly',
    owner: 'Jamie Lin',
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-11-15T09:00:00.000Z',
  },
  {
    id: 'rep-products',
    name: byLang('Product Sales This Month', '本月商品銷售'),
    description: byLang('Units sold and revenue month-to-date.', '本月至今的銷售件數與營收。'),
    type: 'products',
    metrics: ['unitsSold', 'revenue'],
    preset: 'thisMonth',
    granularity: 'day',
    schedule: 'none',
    owner: 'Alex Morgan',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
  },
]

function load(): ReportDefinition[] {
  const result = readStorage(STORAGE_KEYS.reports, listSchema)
  return result.ok ? result.value : SEED()
}

function save(list: ReportDefinition[]): void {
  writeStorage(STORAGE_KEYS.reports, list)
}

/** Simulated latency so loading states are visible and realistic. */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const reportsService = {
  async list(): Promise<ReportDefinition[]> {
    await delay()
    return load()
  },

  async get(id: string): Promise<ReportDefinition | null> {
    await delay(80)
    return load().find((r) => r.id === id) ?? null
  },

  async create(input: NewReport, owner: string): Promise<ReportDefinition> {
    await delay()
    const now = new Date().toISOString()
    const report: ReportDefinition = { ...input, id: createId('rep'), owner, createdAt: now, updatedAt: now }
    save([report, ...load()])
    return report
  },

  async remove(ids: string[]): Promise<void> {
    await delay()
    save(load().filter((r) => !ids.includes(r.id)))
  },
}
