import type { CategoryId, ChannelId, ISODate, OrderStatus, RegionId } from './domain'

export type Granularity = 'day' | 'week' | 'month'

export type DatePresetKey =
  'today' | 'yesterday' | 'last7' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth' | 'custom'

export interface DateRange {
  from: ISODate
  to: ISODate
}

/**
 * Every metric the platform knows about.
 * The definition (label, format, description) lives in utils/metrics.ts.
 */
export type MetricKey =
  | 'revenue'
  | 'orders'
  | 'activeUsers'
  | 'conversionRate'
  | 'aov'
  | 'revenueGrowth'
  | 'sessions'
  | 'unitsSold'
  | 'newCustomers'
  | 'refundRate'

/** Metrics that can be aggregated per bucket (all except revenueGrowth). */
export type SeriesMetricKey = Exclude<MetricKey, 'revenueGrowth'>

export type DimensionKey = 'channel' | 'category' | 'region' | 'product' | 'segment'

/**
 * The single filter object shared by every analytics endpoint.
 * Because all widgets build their request from the same object,
 * KPI cards, charts and tables can never disagree with each other.
 */
export interface AnalyticsFilter extends DateRange {
  channel?: ChannelId
  category?: CategoryId
  region?: RegionId
  productId?: string
  /**
   * Language for labels in API responses (server side only; the client
   * adds it automatically in services/http.ts). Never affects numbers.
   */
  lang?: 'en' | 'zh-TW'
}

export type TrendDirection = 'up' | 'down' | 'flat' | 'none'

/** Current vs previous period for one metric. `null` = not available. */
export interface MetricComparison {
  key: MetricKey
  current: number | null
  previous: number | null
  /** current - previous */
  delta: number | null
  /** Growth in %, null when it cannot be computed (e.g. previous = 0). */
  deltaPercent: number | null
  direction: TrendDirection
}

export interface OverviewData {
  range: DateRange
  previousRange: DateRange
  metrics: Record<MetricKey, MetricComparison>
  /** Daily values for small sparklines in KPI cards. */
  sparklines: Partial<Record<MetricKey, number[]>>
}

export interface TimeSeriesPoint {
  /** First day of the bucket. */
  bucket: ISODate
  /** Last day of the bucket (clamped to the range). */
  bucketEnd: ISODate
  values: Record<SeriesMetricKey, number | null>
}

export interface TimeSeriesData {
  granularity: Granularity
  range: DateRange
  previousRange: DateRange
  current: TimeSeriesPoint[]
  previous: TimeSeriesPoint[]
}

export interface BreakdownItem {
  key: string
  label: string
  value: number
  previous: number
  /** Share of total in % (0–100). */
  share: number
  deltaPercent: number | null
  /** Extra metrics for richer charts (scatter, radar...). */
  extra: Partial<Record<SeriesMetricKey | 'price', number | null>>
}

export interface BreakdownData {
  dimension: DimensionKey
  metric: SeriesMetricKey
  total: number
  items: BreakdownItem[]
}

/** One series per dimension member over time (stacked charts). */
export interface SeriesByDimensionData {
  dimension: DimensionKey
  metric: SeriesMetricKey
  buckets: ISODate[]
  series: { key: string; label: string; values: number[] }[]
}

export interface FunnelStage {
  key: 'sessions' | 'productViews' | 'addToCart' | 'checkout' | 'purchases'
  label: string
  value: number
  /** Conversion from the previous stage in %. */
  rateFromPrevious: number | null
  /** Conversion from the first stage in %. */
  rateFromTop: number | null
}

export interface FunnelData {
  stages: FunnelStage[]
}

export interface HeatmapData {
  /** [hour (0–23), weekday (0=Mon … 6=Sun), orders] */
  cells: [number, number, number][]
  max: number
}

export interface TargetData {
  month: string
  target: number
  achieved: number
  /** achieved / target in % */
  progress: number
  daysElapsed: number
  daysInMonth: number
}

export interface UsersOverviewData {
  totalUsers: MetricComparison
  newUsers: MetricComparison
  activeUsers: MetricComparison
  returningRate: MetricComparison
  growth: { bucket: ISODate; total: number; new: number }[]
  bySource: BreakdownItem[]
  byRegion: BreakdownItem[]
  bySegment: BreakdownItem[]
}

export interface RetentionCohort {
  /** 'YYYY-MM' signup month */
  cohort: string
  size: number
  /** % of the cohort that ordered in month +0, +1, … (null = in the future) */
  retention: (number | null)[]
}

export interface RetentionData {
  cohorts: RetentionCohort[]
  months: number
}

export interface OrderRow {
  id: string
  date: ISODate
  hour: number
  customerId: string
  customerName: string
  segment: string
  channel: ChannelId
  region: RegionId
  status: OrderStatus
  items: number
  units: number
  total: number
  products: string
  categories: CategoryId[]
}

export type SortDirection = 'asc' | 'desc'

export interface OrdersQuery extends AnalyticsFilter {
  page: number
  pageSize: number
  sortBy: keyof Pick<OrderRow, 'date' | 'total' | 'units' | 'customerName' | 'id' | 'status'>
  sortDir: SortDirection
  search?: string
  status?: OrderStatus
  /** Filter to a single day (drill-down). */
  day?: ISODate
}

export interface ActivityItem {
  id: string
  type: 'order' | 'refund' | 'signup' | 'milestone' | 'report'
  title: string
  description: string
  date: ISODate
  hour: number
  amount?: number
}

export interface NotificationItem {
  id: string
  type: 'alert' | 'info' | 'success' | 'warning'
  title: string
  message: string
  date: ISODate
  link?: string
}
