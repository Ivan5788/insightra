import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '~/composables/useChartTheme'
import { formatValue, type ValueFormat } from '~/utils/format'
import { tt } from '~/utils/locale'

/**
 * CHART OPTION BUILDERS
 * ---------------------
 * Pure functions: (data, theme) → ECharts option object.
 * No Vue, no fetching — easy to unit test and reuse in any component.
 *
 * Design rules applied (see docs/UI_UX_GUIDE.md → Data visualisation):
 *  - one y-axis per chart (no dual axes)
 *  - thin marks: 2px lines, 4px rounded bar ends, 2px gaps between slices
 *  - recessive solid hairline grid, muted axis labels
 *  - legend whenever there are ≥ 2 series
 *  - tooltips on every chart; text uses text colours, not series colours
 */

type NumFormat = Exclude<ValueFormat, 'text' | 'date'>
type Value = number | null

interface TooltipItem {
  seriesName: string
  name: string
  value: number | number[] | null
  marker: string
  dataIndex: number
  color: string
  percent?: number
}

const fmt =
  (format: NumFormat, compact = false) =>
  (v: unknown) =>
    formatValue(typeof v === 'number' ? v : null, format, { compact })

// ---- Shared building blocks -------------------------------------------------

export function tooltipBase(theme: ChartTheme) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: theme.textStrong, fontSize: 12, fontFamily: theme.fontFamily },
    extraCssText: 'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12);',
    confine: true,
  }
}

function categoryAxis(theme: ChartTheme, data: string[], extra: Record<string, unknown> = {}) {
  return {
    type: 'category' as const,
    data,
    boundaryGap: true,
    axisLine: { lineStyle: { color: theme.axis } },
    axisTick: { show: false },
    axisLabel: { color: theme.text, fontSize: 11, hideOverlap: true },
    ...extra,
  }
}

function valueAxis(theme: ChartTheme, format: NumFormat, extra: Record<string, unknown> = {}) {
  return {
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: theme.text, fontSize: 11, formatter: fmt(format, true), hideOverlap: true },
    splitLine: { lineStyle: { color: theme.grid, type: 'solid' as const } },
    ...extra,
  }
}

function legend(theme: ChartTheme, show: boolean, extra: Record<string, unknown> = {}) {
  return {
    show,
    top: 0,
    left: 0,
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 14,
    textStyle: { color: theme.text, fontSize: 12 },
    inactiveColor: theme.axis,
    ...extra,
  }
}

function zoomComponents(theme: ChartTheme, enabled: boolean, orient: 'x' | 'y' = 'x') {
  if (!enabled) return []
  const axisKey = orient === 'x' ? { xAxisIndex: 0 } : { yAxisIndex: 0 }
  return [
    { type: 'inside', ...axisKey, zoomOnMouseWheel: 'ctrl', moveOnMouseMove: true },
    {
      type: 'slider',
      ...axisKey,
      height: 18,
      bottom: 4,
      borderColor: 'transparent',
      backgroundColor: theme.grid,
      fillerColor: 'rgba(15,110,115,0.12)',
      handleStyle: { color: theme.surface, borderColor: theme.axis },
      moveHandleStyle: { color: theme.axis },
      textStyle: { color: theme.text, fontSize: 10 },
      dataBackground: { lineStyle: { color: theme.axis }, areaStyle: { color: theme.grid } },
      selectedDataBackground: {
        lineStyle: { color: theme.series[0] },
        areaStyle: { color: theme.series[0], opacity: 0.1 },
      },
      brushSelect: false,
    },
  ]
}

function base(theme: ChartTheme): EChartsOption {
  return {
    animationDuration: 400,
    animationDurationUpdate: 300,
    textStyle: { fontFamily: theme.fontFamily },
    aria: { enabled: true },
  }
}

// ---- 1. Trend line (current vs previous period) ---------------------------

export interface TrendLineInput {
  categories: string[]
  current: Value[]
  previous?: Value[]
  previousLabels?: string[]
  name: string
  previousName?: string
  format: NumFormat
  area?: boolean
  zoom?: boolean
  color?: string
}

export function trendLineOption(input: TrendLineInput, theme: ChartTheme): EChartsOption {
  const color = input.color ?? theme.series[0]!
  const hasPrev = !!input.previous?.length
  const f = fmt(input.format)
  return {
    ...base(theme),
    color: [color, theme.previous],
    grid: { left: 8, right: 16, top: hasPrev ? 36 : 16, bottom: input.zoom ? 40 : 8, containLabel: true },
    legend: legend(theme, hasPrev),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: theme.axis } },
      formatter: (raw: unknown) => {
        const items = raw as TooltipItem[]
        const i = items[0]?.dataIndex ?? 0
        const cur = input.current[i] ?? null
        const prev = input.previous?.[i] ?? null
        let html = '<div style="font-weight:600;margin-bottom:4px">' + input.categories[i] + '</div>'
        html += items
          .map((it) => {
            const label =
              it.seriesName === (input.previousName ?? tt('Previous period', '前期')) &&
              input.previousLabels?.[i]
                ? it.seriesName + ' (' + input.previousLabels[i] + ')'
                : it.seriesName
            const v = Array.isArray(it.value) ? it.value[1] : it.value
            return '<div>' + it.marker + label + ': <b>' + f(v) + '</b></div>'
          })
          .join('')
        if (hasPrev && cur !== null && prev !== null && prev !== 0) {
          const change = ((cur - prev) / Math.abs(prev)) * 100
          html +=
            '<div style="margin-top:4px;opacity:.75">Change: ' +
            (change >= 0 ? '+' : '') +
            change.toFixed(1) +
            '%</div>'
        }
        return html
      },
    },
    xAxis: categoryAxis(theme, input.categories, { boundaryGap: false }),
    yAxis: valueAxis(theme, input.format),
    dataZoom: zoomComponents(theme, !!input.zoom),
    series: [
      {
        name: input.name,
        type: 'line',
        data: input.current,
        smooth: 0.25,
        showSymbol: input.categories.length <= 2,
        symbolSize: 8,
        lineStyle: { width: 2 },
        emphasis: { focus: 'series' },
        areaStyle: input.area
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: color + '33' },
                  { offset: 1, color: color + '00' },
                ],
              },
            }
          : undefined,
      },
      ...(hasPrev
        ? [
            {
              name: input.previousName ?? tt('Previous period', '前期'),
              type: 'line' as const,
              data: input.previous,
              smooth: 0.25,
              showSymbol: false,
              lineStyle: { width: 1.5, color: theme.previous },
              itemStyle: { color: theme.previous },
              z: 1,
            },
          ]
        : []),
    ],
  }
}

// ---- 2. Multi-series line / stacked area ----------------------------------

export interface MultiSeriesInput {
  categories: string[]
  series: { name: string; data: Value[]; color?: string }[]
  format: NumFormat
  stacked?: boolean
  area?: boolean
  zoom?: boolean
}

export function multiLineOption(input: MultiSeriesInput, theme: ChartTheme): EChartsOption {
  const f = fmt(input.format)
  return {
    ...base(theme),
    color: input.series.map((s, i) => s.color ?? theme.series[i % 8]!),
    grid: {
      left: 8,
      right: 16,
      top: input.series.length > 1 ? 40 : 16,
      bottom: input.zoom ? 40 : 8,
      containLabel: true,
    },
    legend: legend(theme, input.series.length > 1, { type: 'scroll' }),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: theme.axis } },
      valueFormatter: f,
    },
    xAxis: categoryAxis(theme, input.categories, { boundaryGap: false }),
    yAxis: valueAxis(theme, input.format),
    dataZoom: zoomComponents(theme, !!input.zoom),
    series: input.series.map((s) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      smooth: 0.2,
      stack: input.stacked ? 'total' : undefined,
      showSymbol: false,
      symbolSize: 8,
      lineStyle: { width: input.area ? 1.5 : 2 },
      areaStyle: input.area ? { opacity: input.stacked ? 0.55 : 0.15 } : undefined,
      emphasis: { focus: 'series' },
    })),
  }
}

// ---- 3. Bar (vertical / horizontal / stacked) -----------------------------

export interface BarInput {
  categories: string[]
  series: { name: string; data: Value[]; color?: string }[]
  format: NumFormat
  horizontal?: boolean
  stacked?: boolean
  zoom?: boolean
  /** Per-bar colours (single series coloured by entity). */
  itemColors?: string[]
}

export function barOption(input: BarInput, theme: ChartTheme): EChartsOption {
  const f = fmt(input.format)
  const multi = input.series.length > 1
  const radius = input.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
  const catAxis = categoryAxis(
    theme,
    input.categories,
    input.horizontal ? { inverse: true, axisLine: { show: false } } : {},
  )
  const valAxis = valueAxis(theme, input.format)
  return {
    ...base(theme),
    color: input.series.map((s, i) => s.color ?? theme.series[i % 8]!),
    grid: {
      left: 8,
      right: input.horizontal ? 24 : 16,
      top: multi ? 40 : 16,
      bottom: input.zoom ? 40 : 8,
      containLabel: true,
    },
    legend: legend(theme, multi, { type: 'scroll' }),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: theme.grid, opacity: 0.6 } },
      valueFormatter: f,
    },
    xAxis: input.horizontal ? valAxis : catAxis,
    yAxis: input.horizontal ? catAxis : valAxis,
    dataZoom: zoomComponents(theme, !!input.zoom, input.horizontal ? 'y' : 'x'),
    series: input.series.map((s, si) => ({
      name: s.name,
      type: 'bar' as const,
      stack: input.stacked ? 'total' : undefined,
      data: input.itemColors
        ? s.data.map((v, i) => ({ value: v, itemStyle: { color: input.itemColors![i] } }))
        : s.data,
      barMaxWidth: input.horizontal ? 18 : 28,
      barGap: '12%',
      itemStyle: {
        // Only the top segment of a stack gets rounded corners.
        borderRadius: !input.stacked || si === input.series.length - 1 ? radius : 0,
        borderColor: input.stacked ? theme.surface : undefined,
        borderWidth: input.stacked ? 1 : 0,
      },
      emphasis: { focus: multi ? 'series' : 'none' },
    })),
  }
}

// ---- 4. Donut / pie ------------------------------------------------------------

export interface DonutInput {
  items: { name: string; value: number; color?: string }[]
  format: NumFormat
  centerLabel?: string
  donut?: boolean
}

/** Keeps at most `max` slices; the rest is folded into "Other". */
export function foldOther<T extends { name: string; value: number }>(
  items: T[],
  max = 6,
): (T | { name: string; value: number })[] {
  if (items.length <= max) return items
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, max - 1)
  const rest = sorted.slice(max - 1).reduce((acc, i) => acc + i.value, 0)
  return [...head, { name: tt('Other', '其他'), value: rest }]
}

export function donutOption(input: DonutInput, theme: ChartTheme): EChartsOption {
  const f = fmt(input.format)
  const total = input.items.reduce((acc, i) => acc + i.value, 0)
  const donut = input.donut !== false
  return {
    ...base(theme),
    color: input.items.map((it, i) => it.color ?? theme.series[i % 8]!),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'item',
      formatter: (raw: unknown) => {
        const it = raw as TooltipItem
        return it.marker + it.name + '<br/><b>' + f(it.value) + '</b> (' + (it.percent ?? 0).toFixed(1) + '%)'
      },
    },
    legend: legend(theme, true, {
      type: 'plain',
      orient: 'horizontal',
      top: 'auto',
      bottom: 0,
      left: 'center',
      itemGap: 10,
    }),
    graphic: donut
      ? [
          {
            type: 'text',
            left: 'center',
            top: '33%',
            style: {
              text: fmt(input.format, true)(total),
              fill: theme.textStrong,
              fontSize: 18,
              fontWeight: 600,
              align: 'center',
            },
          },
          {
            type: 'text',
            left: 'center',
            top: '44%',
            style: {
              text: input.centerLabel ?? tt('Total', '合計'),
              fill: theme.text,
              fontSize: 11,
              align: 'center',
            },
          },
        ]
      : [],
    series: [
      {
        type: 'pie',
        radius: donut ? ['48%', '68%'] : [0, '66%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 4, label: { show: false } },
        data: input.items.map((i) => ({ name: i.name, value: i.value })),
      },
    ],
  }
}

// ---- 5. Scatter (correlation) --------------------------------------------------

export interface ScatterInput {
  points: { name: string; x: number; y: number; size: number; group: string }[]
  groups: { name: string; color: string }[]
  xName: string
  yName: string
  xFormat: NumFormat
  yFormat: NumFormat
  sizeFormat: NumFormat
}

export function scatterOption(input: ScatterInput, theme: ChartTheme): EChartsOption {
  const maxSize = Math.max(1, ...input.points.map((p) => p.size))
  return {
    ...base(theme),
    color: input.groups.map((g) => g.color),
    grid: { left: 12, right: 24, top: 40, bottom: 28, containLabel: true },
    legend: legend(theme, input.groups.length > 1, { type: 'scroll' }),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'item',
      formatter: (raw: unknown) => {
        const it = raw as TooltipItem & { data: { name: string; value: number[] } }
        const [x, y, s] = it.data.value
        return (
          '<b>' +
          it.data.name +
          '</b><br/>' +
          input.xName +
          ': ' +
          fmt(input.xFormat)(x) +
          '<br/>' +
          input.yName +
          ': ' +
          fmt(input.yFormat)(y) +
          '<br/>' +
          tt('Revenue', '營收') +
          ': ' +
          fmt(input.sizeFormat)(s)
        )
      },
    },
    xAxis: valueAxis(theme, input.xFormat, {
      name: input.xName,
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: theme.text, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.grid } },
    }),
    yAxis: valueAxis(theme, input.yFormat, {
      name: input.yName,
      nameTextStyle: { color: theme.text, fontSize: 11, align: 'left' },
    }),
    series: input.groups.map((g) => ({
      name: g.name,
      type: 'scatter' as const,
      symbolSize: (val: number[]) => 8 + Math.sqrt((val[2] ?? 0) / maxSize) * 26,
      itemStyle: { color: g.color, opacity: 0.8, borderColor: theme.surface, borderWidth: 2 },
      emphasis: { focus: 'series' },
      data: input.points
        .filter((p) => p.group === g.name)
        .map((p) => ({ name: p.name, value: [p.x, p.y, p.size] })),
    })),
  }
}

// ---- 6. Radar (multi-metric comparison) ---------------------------------------

export interface RadarInput {
  indicators: { name: string; max: number }[]
  series: { name: string; values: number[]; raw: string[]; color: string }[]
}

export function radarOption(input: RadarInput, theme: ChartTheme): EChartsOption {
  return {
    ...base(theme),
    color: input.series.map((s) => s.color),
    legend: legend(theme, input.series.length > 1, {
      type: 'scroll',
      bottom: 0,
      top: 'auto',
      left: 'center',
    }),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'item',
      formatter: (raw: unknown) => {
        const it = raw as TooltipItem
        const s =
          input.series.find((x) => x.name === it.seriesName) ?? input.series.find((x) => x.name === it.name)
        if (!s) return ''
        return (
          '<b>' +
          s.name +
          '</b><br/>' +
          input.indicators.map((ind, i) => ind.name + ': ' + s.raw[i]).join('<br/>')
        )
      },
    },
    radar: {
      indicator: input.indicators,
      radius: '62%',
      center: ['50%', '46%'],
      axisName: { color: theme.text, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.grid } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 5,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
        emphasis: { lineStyle: { width: 3 }, areaStyle: { opacity: 0.2 } },
        data: input.series.map((s) => ({ name: s.name, value: s.values, itemStyle: { color: s.color } })),
      },
    ],
  }
}

// ---- 7. Heatmap (density / cohorts) --------------------------------------------

export interface HeatmapInput {
  xLabels: string[]
  yLabels: string[]
  /** [xIndex, yIndex, value | null] */
  cells: [number, number, number | null][]
  max: number
  format: NumFormat
  valueLabel: string
  showLabels?: boolean
}

export function heatmapOption(input: HeatmapInput, theme: ChartTheme): EChartsOption {
  const f = fmt(input.format)
  return {
    ...base(theme),
    grid: { left: 8, right: 8, top: 8, bottom: 48, containLabel: true },
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'item',
      formatter: (raw: unknown) => {
        const it = raw as TooltipItem & { data: [number, number, number | null] }
        const [x, y, v] = it.data
        return (
          '<b>' + input.yLabels[y] + ' · ' + input.xLabels[x] + '</b><br/>' + input.valueLabel + ': ' + f(v)
        )
      },
    },
    xAxis: categoryAxis(theme, input.xLabels, { splitArea: { show: false }, axisLine: { show: false } }),
    yAxis: categoryAxis(theme, input.yLabels, { inverse: true, axisLine: { show: false } }),
    visualMap: {
      min: 0,
      max: Math.max(1, input.max),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemHeight: 120,
      itemWidth: 10,
      text: [tt('High', '高'), tt('Low', '低')],
      textStyle: { color: theme.text, fontSize: 11 },
      inRange: { color: theme.sequential },
      formatter: (v: unknown) => f(v),
    },
    series: [
      {
        type: 'heatmap',
        name: input.valueLabel,
        data: input.cells.map((c) => (c[2] === null ? [c[0], c[1], '-'] : c)),
        itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 3 },
        label: {
          show: !!input.showLabels,
          fontSize: 11,
          color: theme.textStrong,
          // Halo keeps the label readable on both light and dark cells.
          textBorderColor: theme.surface,
          textBorderWidth: 2,
          formatter: (p: unknown) => {
            const d = (p as { data: (number | string)[] }).data
            return typeof d[2] === 'number' ? f(d[2]) : ''
          },
        },
        emphasis: { itemStyle: { borderColor: theme.textStrong, borderWidth: 1 } },
      },
    ],
  }
}

// ---- 8. Funnel ------------------------------------------------------------------

export interface FunnelInput {
  stages: { name: string; value: number; rate?: number | null }[]
}

export function funnelOption(input: FunnelInput, theme: ChartTheme): EChartsOption {
  // Ordinal ramp: darker = later stage. Lightest step still clears 2:1 contrast.
  const ramp =
    theme.mode === 'dark'
      ? [
          theme.sequential[4]!,
          theme.sequential[3]!,
          theme.sequential[2]!,
          theme.series[0]!,
          theme.sequential[1]!,
        ]
      : [
          theme.sequential[1]!,
          theme.sequential[2]!,
          theme.series[0]!,
          theme.sequential[3]!,
          theme.sequential[4]!,
        ]
  const top = input.stages[0]?.value ?? 0
  return {
    ...base(theme),
    tooltip: {
      ...tooltipBase(theme),
      trigger: 'item',
      formatter: (raw: unknown) => {
        const it = raw as TooltipItem
        const stage = input.stages[it.dataIndex]
        const share = top ? ((Number(it.value) / top) * 100).toFixed(1) + '% of sessions' : ''
        const step = stage?.rate != null ? '<br/>Step conversion: ' + stage.rate.toFixed(1) + '%' : ''
        return '<b>' + it.name + '</b><br/>' + formatValue(Number(it.value), 'number') + ' · ' + share + step
      },
    },
    series: [
      {
        type: 'funnel',
        left: '4%',
        right: '4%',
        top: 8,
        bottom: 8,
        minSize: '36%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 12,
          formatter: (p: unknown) => {
            const it = p as TooltipItem
            return it.name + '  ' + formatValue(Number(it.value), 'number', { compact: true })
          },
        },
        itemStyle: { borderColor: theme.surface, borderWidth: 0 },
        data: input.stages.map((s, i) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: ramp[i % ramp.length] },
        })),
      },
    ],
  }
}

// ---- 9. Gauge (target achievement) ------------------------------------------

export function gaugeOption(progress: number, label: string, theme: ChartTheme): EChartsOption {
  const value = Math.round(progress * 10) / 10
  return {
    ...base(theme),
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 120,
        radius: '92%',
        center: ['50%', '58%'],
        progress: {
          show: true,
          width: 14,
          roundCap: true,
          itemStyle: { color: value >= 100 ? theme.series[2] : theme.series[0] },
        },
        axisLine: { roundCap: true, lineStyle: { width: 14, color: [[1, theme.grid]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: true, offsetCenter: [0, '30%'], color: theme.text, fontSize: 12 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-2%'],
          fontSize: 28,
          fontWeight: 700,
          color: theme.textStrong,
          formatter: (v: number) => v.toFixed(1) + '%',
        },
        data: [{ value, name: label }],
      },
    ],
  }
}

// ---- 10. Sparkline (KPI cards) -------------------------------------------------

export function sparklineOption(values: number[], color: string): EChartsOption {
  return {
    animation: false,
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 'dataMin' },
    tooltip: { show: false },
    series: [
      {
        type: 'line',
        data: values,
        smooth: 0.3,
        showSymbol: false,
        lineStyle: { width: 1.5, color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '30' },
              { offset: 1, color: color + '00' },
            ],
          },
        },
        silent: true,
      },
    ],
  }
}
