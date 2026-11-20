import type { IconName } from '~/data/icons'
import type { DimensionKey, SeriesMetricKey, MetricKey } from './analytics'

export type WidgetType = 'kpi' | 'line' | 'bar' | 'area' | 'donut' | 'table' | 'ranking' | 'activity'

/**
 * Widget width on the 12-column dashboard grid (desktop):
 * sm = 2 cols, md = 4 cols, lg = 8 cols, full = 12 cols.
 * Tablet and mobile spans are defined in WidgetGrid styles.
 */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

export interface WidgetSettings {
  metric?: MetricKey | SeriesMetricKey
  dimension?: DimensionKey
  limit?: number
}

export interface WidgetConfig {
  /** Unique id — needed so Vue/drag-and-drop can track the item. */
  id: string
  type: WidgetType
  title: string
  size: WidgetSize
  visible: boolean
  settings: WidgetSettings
}

export interface DashboardLayout {
  id: string
  name: string
  widgets: WidgetConfig[]
  updatedAt: string
}

export interface DashboardState {
  version: 1
  activeLayoutId: string
  layouts: DashboardLayout[]
}

/** Static description of a widget type (see data/widget-registry.ts). */
export interface WidgetDefinition {
  type: WidgetType
  label: string
  description: string
  icon: IconName
  defaultTitle: string
  defaultSize: WidgetSize
  allowedSizes: WidgetSize[]
  defaultSettings: WidgetSettings
  /** Which settings the user can edit for this widget type. */
  editable: ('metric' | 'dimension' | 'limit')[]
  /** Metrics that make sense for this widget type. */
  metricOptions?: (MetricKey | SeriesMetricKey)[]
  dimensionOptions?: DimensionKey[]
}
