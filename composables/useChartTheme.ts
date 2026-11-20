import { computed } from 'vue'

/**
 * Chart colours come from the SAME CSS custom properties as the rest of
 * the UI (assets/scss/base/_tokens.scss). When the theme switches, this
 * computed re-runs, chart options are rebuilt and ECharts redraws —
 * so charts, tooltips and the page always share one palette.
 */

export interface ChartTheme {
  mode: 'light' | 'dark'
  text: string
  textStrong: string
  muted: string
  grid: string
  axis: string
  surface: string
  tooltipBg: string
  tooltipBorder: string
  previous: string
  primary: string
  /** Categorical palette — fixed order, colour follows the entity. */
  series: string[]
  /** Sequential single-hue ramp (light → dark in light mode). */
  sequential: string[]
  fontFamily: string
}

export const FALLBACK_THEME: ChartTheme = {
  mode: 'light',
  text: '#6b6e78',
  textStrong: '#1a1c22',
  muted: '#6b6e78',
  grid: '#eceae3',
  axis: '#cbc6ba',
  surface: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2dfd6',
  previous: '#a19d94',
  primary: '#0f6e73',
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  sequential: ['#e4effc', '#9ec5f4', '#5598e7', '#1c5cab', '#0d366b'],
  fontFamily: 'Inter, system-ui, sans-serif',
}

export function readChartTheme(mode: 'light' | 'dark'): ChartTheme {
  if (typeof window === 'undefined') return FALLBACK_THEME
  const style = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    mode,
    text: v('--chart-text', FALLBACK_THEME.text),
    textStrong: v('--color-text', FALLBACK_THEME.textStrong),
    muted: v('--color-text-muted', FALLBACK_THEME.muted),
    grid: v('--chart-grid', FALLBACK_THEME.grid),
    axis: v('--chart-axis', FALLBACK_THEME.axis),
    surface: v('--color-surface', FALLBACK_THEME.surface),
    tooltipBg: v('--chart-tooltip-bg', FALLBACK_THEME.tooltipBg),
    tooltipBorder: v('--chart-tooltip-border', FALLBACK_THEME.tooltipBorder),
    previous: v('--chart-previous', FALLBACK_THEME.previous),
    primary: v('--color-primary', FALLBACK_THEME.primary),
    series: FALLBACK_THEME.series.map((c, i) => v('--chart-' + (i + 1), c)),
    sequential: FALLBACK_THEME.sequential.map((c, i) => v('--chart-seq-' + (i + 1), c)),
    // <body> carries the UI font (the <html> element only has the browser default).
    fontFamily: getComputedStyle(document.body).fontFamily || FALLBACK_THEME.fontFamily,
  }
}

export function useChartTheme() {
  const settings = useSettingsStore()
  return computed(() => readChartTheme(settings.resolvedTheme))
}
