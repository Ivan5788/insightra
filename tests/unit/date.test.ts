import { describe, expect, it } from 'vitest'
import {
  addDays,
  bucketStart,
  diffDays,
  eachDay,
  endOfMonth,
  isValidISODate,
  previousRange,
  rangeLength,
  resolvePreset,
  startOfWeek,
  suggestGranularity,
  weekdayIndex,
} from '~/utils/date'

const TODAY = '2026-11-20' // a Friday

describe('date utilities', () => {
  it('validates ISO dates strictly', () => {
    expect(isValidISODate('2026-11-20')).toBe(true)
    expect(isValidISODate('2026-02-31')).toBe(false)
    expect(isValidISODate('2026/11/20')).toBe(false)
    expect(isValidISODate(20261120)).toBe(false)
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29') // leap year
  })

  it('computes inclusive range lengths', () => {
    expect(rangeLength({ from: TODAY, to: TODAY })).toBe(1)
    expect(diffDays('2026-11-01', '2026-11-30')).toBe(29)
    expect(eachDay({ from: '2026-11-28', to: '2026-12-02' })).toEqual([
      '2026-11-28',
      '2026-11-29',
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
    ])
  })

  it('handles weeks starting on Monday', () => {
    expect(weekdayIndex(TODAY)).toBe(4)
    expect(startOfWeek(TODAY)).toBe('2026-11-16')
    expect(bucketStart('2026-11-22', 'week')).toBe('2026-11-16') // Sunday belongs to the same week
    expect(bucketStart(TODAY, 'month')).toBe('2026-11-01')
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28')
  })
})

describe('resolvePreset', () => {
  it.each([
    ['today', '2026-11-20', '2026-11-20'],
    ['yesterday', '2026-11-19', '2026-11-19'],
    ['last7', '2026-11-14', '2026-11-20'],
    ['last30', '2026-10-22', '2026-11-20'],
    ['last90', '2026-08-23', '2026-11-20'],
    ['thisMonth', '2026-11-01', '2026-11-20'],
    ['lastMonth', '2026-10-01', '2026-10-31'],
  ] as const)('%s → %s … %s', (preset, from, to) => {
    expect(resolvePreset(preset, TODAY)).toEqual({ from, to })
  })

  it('uses and normalises custom ranges', () => {
    expect(resolvePreset('custom', TODAY, { from: '2026-05-01', to: '2026-05-10' })).toEqual({
      from: '2026-05-01',
      to: '2026-05-10',
    })
    // reversed input is swapped
    expect(resolvePreset('custom', TODAY, { from: '2026-05-10', to: '2026-05-01' })).toEqual({
      from: '2026-05-01',
      to: '2026-05-10',
    })
    // invalid custom falls back to last 30 days
    expect(resolvePreset('custom', TODAY, { from: 'bad', to: TODAY })).toEqual({
      from: '2026-10-22',
      to: TODAY,
    })
  })
})

describe('previousRange', () => {
  it('returns the same-length period immediately before', () => {
    expect(previousRange({ from: '2026-10-22', to: '2026-11-20' })).toEqual({
      from: '2026-09-22',
      to: '2026-10-21',
    })
    expect(previousRange({ from: TODAY, to: TODAY })).toEqual({ from: '2026-11-19', to: '2026-11-19' })
    const prev = previousRange({ from: '2026-10-01', to: '2026-10-31' })
    expect(rangeLength(prev)).toBe(31)
    expect(prev.to).toBe('2026-09-30')
  })

  it('suggests granularity by range length', () => {
    expect(suggestGranularity({ from: '2026-11-01', to: '2026-11-20' })).toBe('day')
    expect(suggestGranularity({ from: '2026-08-23', to: '2026-11-20' })).toBe('week')
    expect(suggestGranularity({ from: '2025-11-01', to: '2026-11-20' })).toBe('month')
  })
})
