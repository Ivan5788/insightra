import { byLang } from '~/utils/locale'
import type { DatePresetKey, Granularity, MetricKey } from '~/types/analytics'
import type { ReportSchedule, ReportType } from '~/types/app'

export const REPORT_TYPES: { value: ReportType; label: string }[] = [
  {
    value: 'sales',
    get label() {
      return byLang('Sales', '銷售')
    },
  },
  {
    value: 'traffic',
    get label() {
      return byLang('Traffic', '流量')
    },
  },
  {
    value: 'customers',
    get label() {
      return byLang('Customers', '顧客')
    },
  },
  {
    value: 'products',
    get label() {
      return byLang('Products', '商品')
    },
  },
]

export const REPORT_METRICS: MetricKey[] = [
  'revenue',
  'orders',
  'aov',
  'unitsSold',
  'sessions',
  'activeUsers',
  'conversionRate',
  'newCustomers',
  'refundRate',
]

export const REPORT_PRESETS: { value: DatePresetKey; label: string }[] = [
  {
    value: 'last7',
    get label() {
      return byLang('Last 7 days', '近 7 天')
    },
  },
  {
    value: 'last30',
    get label() {
      return byLang('Last 30 days', '近 30 天')
    },
  },
  {
    value: 'last90',
    get label() {
      return byLang('Last 90 days', '近 90 天')
    },
  },
  {
    value: 'thisMonth',
    get label() {
      return byLang('This month', '本月')
    },
  },
  {
    value: 'lastMonth',
    get label() {
      return byLang('Last month', '上個月')
    },
  },
  {
    value: 'custom',
    get label() {
      return byLang('Custom range', '自訂範圍')
    },
  },
]

export const REPORT_GRANULARITIES: { value: Granularity; label: string }[] = [
  {
    value: 'day',
    get label() {
      return byLang('Daily', '每日')
    },
  },
  {
    value: 'week',
    get label() {
      return byLang('Weekly', '每週')
    },
  },
  {
    value: 'month',
    get label() {
      return byLang('Monthly', '每月')
    },
  },
]

export const REPORT_SCHEDULES: { value: ReportSchedule; label: string }[] = [
  {
    value: 'none',
    get label() {
      return byLang('Not scheduled', '不排程')
    },
  },
  {
    value: 'weekly',
    get label() {
      return byLang('Every Monday', '每週一')
    },
  },
  {
    value: 'monthly',
    get label() {
      return byLang('1st of each month', '每月 1 日')
    },
  },
]

export function presetLabel(preset: DatePresetKey): string {
  return REPORT_PRESETS.find((p) => p.value === preset)?.label ?? preset
}
