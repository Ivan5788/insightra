import type { MetricComparison, MetricKey, TrendDirection } from '~/types/analytics'

/**
 * Statistics helpers — the ONLY place where comparison maths happens.
 * Both the mock API and the UI import from here, so a growth
 * percentage is calculated identically everywhere.
 */

/** Treat null / undefined / NaN / Infinity as "no value". */
export function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function sum(values: readonly number[]): number {
  let total = 0
  for (const v of values) if (isNumber(v)) total += v
  return total
}

export function mean(values: readonly number[]): number | null {
  const valid = values.filter(isNumber)
  return valid.length ? sum(valid) / valid.length : null
}

/** a / b, or null when b is 0 or either side is missing. */
export function safeDivide(a: number | null | undefined, b: number | null | undefined): number | null {
  if (!isNumber(a) || !isNumber(b) || b === 0) return null
  return a / b
}

export function round(value: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/**
 * Percentage change from `previous` to `current`.
 *
 * Edge cases (documented because interviewers love them):
 *  - either value missing          → null  (unknown)
 *  - previous = 0, current = 0     → 0     (no change)
 *  - previous = 0, current ≠ 0     → null  (growth from zero is undefined, not ∞)
 *  - negative previous             → divide by |previous| so the sign of the
 *    result always matches the direction of the move
 *    (e.g. -100 → -50 is +50%, an improvement).
 */
export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (!isNumber(current) || !isNumber(previous)) return null
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Changes smaller than this (in %) are shown as "flat". */
export const FLAT_THRESHOLD_PERCENT = 0.05

export function trendDirection(delta: number | null, deltaPercent: number | null): TrendDirection {
  if (delta === null) return 'none'
  if (delta === 0) return 'flat'
  if (deltaPercent !== null && Math.abs(deltaPercent) < FLAT_THRESHOLD_PERCENT) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

/** Build the full current-vs-previous comparison for one metric. */
export function compareMetric(
  key: MetricKey,
  current: number | null | undefined,
  previous: number | null | undefined,
): MetricComparison {
  const cur = isNumber(current) ? current : null
  const prev = isNumber(previous) ? previous : null
  const delta = cur !== null && prev !== null ? cur - prev : null
  const deltaPercent = percentChange(cur, prev)
  return {
    key,
    current: cur,
    previous: prev,
    delta,
    deltaPercent,
    direction: trendDirection(delta, deltaPercent),
  }
}

/** Share of a total in % (0–100). Returns 0 when total is 0. */
export function shareOf(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100
}

export interface SeriesSummary {
  total: number
  average: number | null
  max: number | null
  maxIndex: number
  min: number | null
  minIndex: number
  count: number
}

/** Descriptive statistics for a chart series (nulls ignored). */
export function summarizeSeries(values: readonly (number | null)[]): SeriesSummary {
  let total = 0
  let count = 0
  let max: number | null = null
  let min: number | null = null
  let maxIndex = -1
  let minIndex = -1
  values.forEach((v, i) => {
    if (!isNumber(v)) return
    total += v
    count++
    if (max === null || v > max) {
      max = v
      maxIndex = i
    }
    if (min === null || v < min) {
      min = v
      minIndex = i
    }
  })
  return { total, average: count ? total / count : null, max, maxIndex, min, minIndex, count }
}

/**
 * Index a series to 100 at its first non-zero value, so metrics with very
 * different scales (revenue in $, sessions in counts) can share ONE axis
 * without a misleading dual-axis chart.
 */
export function indexSeries(values: readonly (number | null)[]): (number | null)[] {
  const base = values.find((v) => isNumber(v) && v !== 0)
  if (!isNumber(base)) return values.map(() => null)
  return values.map((v) => (isNumber(v) ? round((v / base) * 100, 1) : null))
}

/** Running total: [1,2,3] → [1,3,6] */
export function cumulative(values: readonly number[]): number[] {
  let acc = 0
  return values.map((v) => (acc += isNumber(v) ? v : 0))
}
