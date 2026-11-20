import type { DimensionKey, MetricKey } from '~/types/analytics'
import type { DashboardLayout, WidgetConfig, WidgetDefinition, WidgetType } from '~/types/widgets'
import { byLang, getLang, type Lang } from '~/utils/locale'
import { metricInfo } from '~/utils/metrics'

/**
 * WIDGET REGISTRY
 * Static description of every widget type: what it is, which sizes it
 * supports and which settings the user can change. The dashboard store
 * only stores *configuration* (WidgetConfig); behaviour comes from here.
 */
export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  kpi: {
    type: 'kpi',
    label: 'KPI Card',
    description: 'A single metric with comparison to the previous period.',
    icon: 'gauge',
    defaultTitle: 'Total Revenue',
    defaultSize: 'sm',
    allowedSizes: ['sm', 'md'],
    defaultSettings: { metric: 'revenue' },
    editable: ['metric'],
    metricOptions: [
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
    ],
  },
  line: {
    type: 'line',
    label: 'Line Chart',
    description: 'Trend over time with previous-period comparison.',
    icon: 'line-chart',
    defaultTitle: 'Revenue trend',
    defaultSize: 'lg',
    allowedSizes: ['md', 'lg', 'full'],
    defaultSettings: { metric: 'revenue' },
    editable: ['metric'],
    metricOptions: [
      'revenue',
      'orders',
      'activeUsers',
      'conversionRate',
      'aov',
      'sessions',
      'unitsSold',
      'newCustomers',
    ],
  },
  bar: {
    type: 'bar',
    label: 'Bar Chart',
    description: 'Compare a metric across time or across categories.',
    icon: 'bar-chart',
    defaultTitle: 'Orders',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg', 'full'],
    defaultSettings: { metric: 'orders' },
    editable: ['metric', 'dimension'],
    metricOptions: ['revenue', 'orders', 'sessions', 'unitsSold', 'newCustomers'],
    dimensionOptions: ['channel', 'category', 'region'],
  },
  area: {
    type: 'area',
    label: 'Area Chart',
    description: 'Cumulative total, or stacked composition by dimension.',
    icon: 'area-chart',
    defaultTitle: 'Cumulative revenue',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg', 'full'],
    defaultSettings: { metric: 'revenue' },
    editable: ['metric', 'dimension'],
    metricOptions: ['revenue', 'orders', 'sessions', 'unitsSold', 'newCustomers'],
    dimensionOptions: ['channel', 'category'],
  },
  donut: {
    type: 'donut',
    label: 'Donut Chart',
    description: 'Part-to-whole split of a metric.',
    icon: 'pie-chart',
    defaultTitle: 'Revenue by channel',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg'],
    defaultSettings: { metric: 'revenue', dimension: 'channel' },
    editable: ['metric', 'dimension'],
    metricOptions: ['revenue', 'orders', 'sessions', 'unitsSold'],
    dimensionOptions: ['channel', 'category', 'region', 'segment'],
  },
  table: {
    type: 'table',
    label: 'Data Table',
    description: 'Most recent transactions in the selected period.',
    icon: 'table',
    defaultTitle: 'Recent transactions',
    defaultSize: 'lg',
    allowedSizes: ['md', 'lg', 'full'],
    defaultSettings: { limit: 6 },
    editable: ['limit'],
  },
  ranking: {
    type: 'ranking',
    label: 'Ranking List',
    description: 'Top items ranked by a metric.',
    icon: 'trophy',
    defaultTitle: 'Top products',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg'],
    defaultSettings: { metric: 'revenue', dimension: 'product', limit: 5 },
    editable: ['metric', 'dimension', 'limit'],
    metricOptions: ['revenue', 'orders', 'unitsSold'],
    dimensionOptions: ['product', 'category', 'channel', 'region'],
  },
  activity: {
    type: 'activity',
    label: 'Recent Activity',
    description: 'Large orders, refunds and VIP sign-ups.',
    icon: 'activity',
    defaultTitle: 'Recent activity',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg'],
    defaultSettings: { limit: 6 },
    editable: ['limit'],
  },
}

export const WIDGET_TYPES = Object.keys(WIDGET_REGISTRY) as WidgetType[]

// ---- Default dashboards ---------------------------------------------------

type Seed = Omit<WidgetConfig, 'visible'> & { visible?: boolean }

function widgets(list: Seed[]): WidgetConfig[] {
  return list.map((w) => ({ visible: true, ...w }))
}

export const DEFAULT_LAYOUT_ID = 'layout-overview'
export const MARKETING_LAYOUT_ID = 'layout-marketing'

function overviewWidgets(): WidgetConfig[] {
  return widgets([
    { id: 'w-kpi-revenue', type: 'kpi', title: '', size: 'sm', settings: { metric: 'revenue' } },
    { id: 'w-kpi-orders', type: 'kpi', title: '', size: 'sm', settings: { metric: 'orders' } },
    {
      id: 'w-kpi-users',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'activeUsers' },
    },
    {
      id: 'w-kpi-conv',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'conversionRate' },
    },
    { id: 'w-kpi-aov', type: 'kpi', title: '', size: 'sm', settings: { metric: 'aov' } },
    {
      id: 'w-kpi-growth',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'revenueGrowth' },
    },
    {
      id: 'w-line-revenue',
      type: 'line',
      title: '',
      size: 'lg',
      settings: { metric: 'revenue' },
    },
    {
      id: 'w-donut-channel',
      type: 'donut',
      title: '',
      size: 'md',
      settings: { metric: 'revenue', dimension: 'channel' },
    },
    { id: 'w-bar-orders', type: 'bar', title: '', size: 'md', settings: { metric: 'orders' } },
    {
      id: 'w-rank-products',
      type: 'ranking',
      title: '',
      size: 'md',
      settings: { metric: 'revenue', dimension: 'product', limit: 5 },
    },
    { id: 'w-activity', type: 'activity', title: '', size: 'md', settings: { limit: 6 } },
    { id: 'w-table-recent', type: 'table', title: '', size: 'lg', settings: { limit: 6 } },
    {
      id: 'w-area-cumulative',
      type: 'area',
      title: '',
      size: 'md',
      settings: { metric: 'revenue' },
    },
  ])
}

function marketingWidgets(): WidgetConfig[] {
  return widgets([
    { id: 'm-kpi-sessions', type: 'kpi', title: '', size: 'sm', settings: { metric: 'sessions' } },
    {
      id: 'm-kpi-users',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'activeUsers' },
    },
    {
      id: 'm-kpi-conv',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'conversionRate' },
    },
    {
      id: 'm-kpi-new',
      type: 'kpi',
      title: '',
      size: 'sm',
      settings: { metric: 'newCustomers' },
    },
    { id: 'm-kpi-orders', type: 'kpi', title: '', size: 'sm', settings: { metric: 'orders' } },
    { id: 'm-kpi-refund', type: 'kpi', title: '', size: 'sm', settings: { metric: 'refundRate' } },
    {
      id: 'm-area-sessions',
      type: 'area',
      title: '',
      size: 'lg',
      settings: { metric: 'sessions', dimension: 'channel' },
    },
    {
      id: 'm-donut-sessions',
      type: 'donut',
      title: '',
      size: 'md',
      settings: { metric: 'sessions', dimension: 'channel' },
    },
    {
      id: 'm-bar-channel',
      type: 'bar',
      title: '',
      size: 'md',
      settings: { metric: 'newCustomers', dimension: 'channel' },
    },
    {
      id: 'm-rank-region',
      type: 'ranking',
      title: '',
      size: 'md',
      settings: { metric: 'revenue', dimension: 'region', limit: 5 },
    },
    {
      id: 'm-line-conv',
      type: 'line',
      title: '',
      size: 'md',
      settings: { metric: 'conversionRate' },
    },
  ])
}

/** Built-in layouts and a factory to (re)create their widgets. */
export const BUILT_IN_LAYOUTS: { id: string; name: string; nameZh: string; widgets: () => WidgetConfig[] }[] =
  [
    { id: DEFAULT_LAYOUT_ID, name: 'Overview', nameZh: '總覽', widgets: overviewWidgets },
    { id: MARKETING_LAYOUT_ID, name: 'Marketing', nameZh: '行銷', widgets: marketingWidgets },
  ]

export function defaultWidgetsFor(layoutId: string): WidgetConfig[] {
  return (BUILT_IN_LAYOUTS.find((l) => l.id === layoutId) ?? BUILT_IN_LAYOUTS[0]!).widgets()
}

export function createDefaultLayouts(now = new Date().toISOString()): DashboardLayout[] {
  return BUILT_IN_LAYOUTS.map((l) => ({
    id: l.id,
    name: byLang(l.name, l.nameZh),
    widgets: l.widgets(),
    updatedAt: now,
  }))
}

// ---- Localized names ----------------------------------------------------

const TYPE_ZH: Record<WidgetType, { label: string; description: string }> = {
  kpi: { label: 'KPI 卡', description: '單一指標，並與前一期比較。' },
  line: { label: '折線圖', description: '時間趨勢，含前期比較。' },
  bar: { label: '長條圖', description: '比較不同時間或不同分類的指標。' },
  area: { label: '面積圖', description: '累積總量，或依維度堆疊的組成變化。' },
  donut: { label: '甜甜圈圖', description: '指標的占比分布。' },
  table: { label: '資料表格', description: '所選期間最近的交易紀錄。' },
  ranking: { label: '排行榜', description: '依指標排序的前幾名。' },
  activity: { label: '最近動態', description: '大額訂單、退款與 VIP 註冊。' },
}

const DIMENSION_LABEL: Record<DimensionKey, [string, string]> = {
  channel: ['Channel', '渠道'],
  category: ['Category', '品類'],
  region: ['Region', '地區'],
  product: ['Product', '商品'],
  segment: ['Customer segment', '會員等級'],
}

export function widgetLabel(type: WidgetType, lang: Lang = getLang()): string {
  return byLang(WIDGET_REGISTRY[type].label, TYPE_ZH[type].label, lang)
}

export function widgetDescription(type: WidgetType, lang: Lang = getLang()): string {
  return byLang(WIDGET_REGISTRY[type].description, TYPE_ZH[type].description, lang)
}

export function dimensionLabel(dimension: DimensionKey, lang: Lang = getLang()): string {
  const [en, zh] = DIMENSION_LABEL[dimension]
  return byLang(en, zh, lang)
}

/**
 * Title shown for a widget. Users may type their own title; otherwise it is
 * generated from the widget settings in the current UI language, so the
 * default dashboards switch language together with the interface.
 */
export function widgetTitle(widget: WidgetConfig, lang: Lang = getLang()): string {
  if (widget.title) return widget.title
  const metric = widget.settings.metric ? metricInfo(widget.settings.metric as MetricKey, lang) : null
  // KPI cards show the full name ("Total Revenue"); chart titles the short one ("Revenue trend").
  const m = metric?.shortLabel ?? ''
  const d = widget.settings.dimension ? dimensionLabel(widget.settings.dimension, lang) : ''
  switch (widget.type) {
    case 'kpi':
      return metric?.label ?? ''
    case 'line':
      return byLang(m + ' trend', m + '趨勢', lang)
    case 'bar':
      return d ? byLang(m + ' by ' + d.toLowerCase(), '各' + d + m, lang) : m
    case 'area':
      return d
        ? byLang(m + ' by ' + d.toLowerCase(), '各' + d + m + '（堆疊）', lang)
        : byLang('Cumulative ' + m.toLowerCase(), '累積' + m, lang)
    case 'donut':
      return byLang(m + ' by ' + d.toLowerCase(), '各' + d + m + '占比', lang)
    case 'ranking':
      return byLang('Top ' + d.toLowerCase() + 's', d + '排行', lang)
    case 'table':
      return byLang('Recent transactions', '最近交易', lang)
    case 'activity':
      return byLang('Recent activity', '最近動態', lang)
  }
}
