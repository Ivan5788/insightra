import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '~/composables/useChartTheme'
import type { DrillChart, DrillChartType } from '~/types/drilldown'
import { barOption, donutOption, foldOther, funnelOption, multiLineOption, trendLineOption } from './options'

/**
 * Turns the generic DrillChart (from the API) into an ECharts option.
 * The same data can be shown as bar / line / pie — the user switches type.
 */
export function drillChartOption(chart: DrillChart, type: DrillChartType, theme: ChartTheme): EChartsOption {
  const format = chart.format === 'text' || chart.format === 'date' ? 'number' : chart.format
  const first = chart.series[0] ?? { name: '', data: [] }

  switch (type) {
    case 'funnel':
      return funnelOption(
        { stages: chart.categories.map((name, i) => ({ name, value: first.data[i] ?? 0 })) },
        theme,
      )
    case 'pie':
      return donutOption(
        {
          items: foldOther(
            chart.categories.map((name, i) => ({ name, value: first.data[i] ?? 0 })),
            7,
          ),
          format,
          centerLabel: first.name,
        },
        theme,
      )
    case 'line':
      return chart.series.length > 1
        ? multiLineOption(
            {
              categories: chart.categories,
              series: chart.series,
              format,
              zoom: chart.categories.length > 40,
            },
            theme,
          )
        : trendLineOption(
            {
              categories: chart.categories,
              current: first.data,
              name: first.name,
              format,
              area: true,
              zoom: chart.categories.length > 40,
            },
            theme,
          )
    case 'bar': {
      const longLabels = chart.categories.some((c) => c.length > 12)
      return barOption(
        {
          categories: chart.categories,
          series: chart.series,
          format,
          horizontal: longLabels,
          zoom: !longLabels && chart.categories.length > 31,
        },
        theme,
      )
    }
  }
}

/** Height that fits the chart content (horizontal bars grow with rows). */
export function drillChartHeight(chart: DrillChart, type: DrillChartType): number {
  if (type === 'bar' && chart.categories.some((c) => c.length > 12)) {
    return Math.min(640, Math.max(260, chart.categories.length * 26 + 40))
  }
  return type === 'pie' ? 300 : 280
}
