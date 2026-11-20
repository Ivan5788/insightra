import type { CategoryId, ChannelId, ISODate } from './domain'

/**
 * Every drill-down "level" the platform supports.
 * Three flows:
 *  - Revenue : revenue-months → revenue-days → revenue-products → product-orders
 *  - Category: categories → category-products → product-detail
 *  - Channel : channels → channel-detail
 */
export type DrillKind =
  | 'revenue-months'
  | 'revenue-days'
  | 'revenue-products'
  | 'product-orders'
  | 'categories'
  | 'category-products'
  | 'product-detail'
  | 'channels'
  | 'channel-detail'

/** Parameters that identify one level. Only the relevant keys are set. */
export interface DrillParams {
  from?: ISODate
  to?: ISODate
  /** 'YYYY-MM' */
  month?: string
  day?: ISODate
  productId?: string
  category?: CategoryId
  channel?: ChannelId
}

/** A level in the breadcrumb stack. */
export interface DrillLevel {
  kind: DrillKind
  label: string
  params: DrillParams
}

export type DrillValueFormat = 'currency' | 'number' | 'percent' | 'text' | 'date'

export interface DrillKpi {
  label: string
  value: number | null
  format: DrillValueFormat
  hint?: string
}

export type DrillChartType = 'bar' | 'line' | 'pie' | 'funnel'

export interface DrillChart {
  id: string
  label: string
  type: DrillChartType
  /** Chart types the user may switch between. */
  allowedTypes: DrillChartType[]
  categories: string[]
  series: { name: string; data: number[] }[]
  format: DrillValueFormat
  /** When true, categories[i] corresponds to table.rows[i] → clickable. */
  linkedToRows: boolean
}

export interface DrillColumn {
  key: string
  label: string
  format: DrillValueFormat
  align?: 'left' | 'right'
}

export interface DrillRow {
  id: string
  cells: Record<string, string | number | null>
  /** Next level when the row (or matching chart point) is clicked. */
  next?: DrillLevel
}

export interface DrillView {
  kind: DrillKind
  title: string
  subtitle: string
  /** Human readable filters, e.g. [{label:'Day', value:'2026-11-11'}] */
  filters: { label: string; value: string }[]
  kpis: DrillKpi[]
  charts: DrillChart[]
  columns: DrillColumn[]
  rows: DrillRow[]
  /** Hint shown above the table, e.g. "Click a day to see products". */
  nextHint?: string
}
