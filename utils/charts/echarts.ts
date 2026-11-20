/**
 * ECharts — tree-shaken import.
 * Importing 'echarts' directly bundles every chart type (~1 MB). Registering
 * only what we use keeps the chart chunk much smaller. This module is only
 * imported by BaseChart.vue, which is lazy-loaded → charts are code-split
 * into their own chunk and never block the first paint.
 */
import * as echarts from 'echarts/core'
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  AriaComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
])

export { echarts }
export type { ECharts } from 'echarts/core'
