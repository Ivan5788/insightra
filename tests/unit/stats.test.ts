import { describe, expect, it } from 'vitest'
import {
  compareMetric,
  cumulative,
  indexSeries,
  mean,
  percentChange,
  safeDivide,
  shareOf,
  sum,
  summarizeSeries,
} from '~/utils/stats'
import { isPositiveChange } from '~/utils/metrics'
import { formatCurrency, formatDeltaPercent, formatDeltaPoints, formatPercent } from '~/utils/format'

describe('percentChange', () => {
  it('computes normal growth', () => {
    expect(percentChange(120, 100)).toBe(20)
    expect(percentChange(80, 100)).toBe(-20)
  })

  it('handles zero values', () => {
    expect(percentChange(0, 0)).toBe(0)
    expect(percentChange(50, 0)).toBeNull() // growth from zero is undefined
    expect(percentChange(0, 50)).toBe(-100)
  })

  it('handles missing values', () => {
    expect(percentChange(null, 100)).toBeNull()
    expect(percentChange(100, undefined)).toBeNull()
    expect(percentChange(Number.NaN, 100)).toBeNull()
  })

  it('keeps the sign meaningful with negative previous values', () => {
    expect(percentChange(-50, -100)).toBe(50) // loss shrank → improvement
    expect(percentChange(-150, -100)).toBe(-50)
    expect(percentChange(50, -100)).toBe(150)
  })
})

describe('compareMetric', () => {
  it('returns delta, percentage and direction', () => {
    expect(compareMetric('revenue', 110, 100)).toEqual({
      key: 'revenue',
      current: 110,
      previous: 100,
      delta: 10,
      deltaPercent: 10,
      direction: 'up',
    })
    expect(compareMetric('revenue', 90, 100).direction).toBe('down')
    expect(compareMetric('revenue', 100, 100).direction).toBe('flat')
    expect(compareMetric('revenue', null, 100).direction).toBe('none')
  })

  it('treats a falling refund rate as positive', () => {
    expect(isPositiveChange('refundRate', -1)).toBe(true)
    expect(isPositiveChange('revenue', -1)).toBe(false)
    expect(isPositiveChange('revenue', 0)).toBeNull()
  })
})

describe('aggregation helpers', () => {
  it('sums and averages while skipping invalid numbers', () => {
    expect(sum([1, 2, Number.NaN, 3])).toBe(6)
    expect(mean([])).toBeNull()
    expect(mean([2, 4])).toBe(3)
  })

  it('divides safely', () => {
    expect(safeDivide(10, 0)).toBeNull()
    expect(safeDivide(10, 4)).toBe(2.5)
  })

  it('computes shares and cumulative totals', () => {
    expect(shareOf(25, 100)).toBe(25)
    expect(shareOf(5, 0)).toBe(0)
    expect(cumulative([1, 2, 3])).toEqual([1, 3, 6])
  })
})

describe('series helpers', () => {
  it('summarises a series and ignores nulls', () => {
    const s = summarizeSeries([10, null, 30, 20])
    expect(s).toMatchObject({ total: 60, average: 20, max: 30, maxIndex: 2, min: 10, minIndex: 0, count: 3 })
  })

  it('indexes a series to 100 at the first non-zero value', () => {
    expect(indexSeries([0, 50, 75, null])).toEqual([0, 100, 150, null])
    expect(indexSeries([0, 0])).toEqual([null, null])
  })
})

describe('formatting', () => {
  it('formats currency and percentages', () => {
    expect(formatCurrency(1234)).toBe('$1,234')
    expect(formatCurrency(12.5)).toBe('$12.50')
    expect(formatCurrency(1_250_000, { compact: true })).toBe('$1.3M')
    expect(formatCurrency(null)).toBe('—')
    expect(formatPercent(12.345)).toBe('12.3%')
    expect(formatDeltaPercent(5)).toBe('+5.0%')
    expect(formatDeltaPercent(-5)).toBe('−5.0%')
    expect(formatDeltaPoints(0.42)).toBe('+0.4 pp')
  })
})
