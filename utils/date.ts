import type { DatePresetKey, DateRange, Granularity } from '~/types/analytics'
import type { ISODate } from '~/types/domain'
import { getLang, type Lang } from './locale'

/**
 * Date utilities.
 *
 * Why ISO strings ('2026-11-20') instead of Date objects?
 *  - They are what an API sends/receives, are easy to compare ('a' < 'b'),
 *    serialise to URL / localStorage without conversion, and are timezone-free.
 *  - All arithmetic is done in UTC so daylight-saving changes can never make
 *    a "day" 23 or 25 hours long.
 */

const DAY_MS = 86_400_000

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Parse 'YYYY-MM-DD' to a UTC timestamp (ms). */
export function toUtcMs(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d!)
}

/** Format a UTC timestamp to 'YYYY-MM-DD'. */
export function fromUtcMs(ms: number): ISODate {
  const d = new Date(ms)
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
}

/** Local calendar date of a Date object (what the user sees on their clock). */
export function toISODate(date: Date): ISODate {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now)
}

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false
  return fromUtcMs(toUtcMs(value)) === value // rejects 2026-02-31
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS)
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS)
}

/** Number of calendar days in an inclusive range. */
export function rangeLength(range: DateRange): number {
  return diffDays(range.from, range.to) + 1
}

export function eachDay(range: DateRange): ISODate[] {
  const days: ISODate[] = []
  const len = rangeLength(range)
  for (let i = 0; i < len; i++) days.push(addDays(range.from, i))
  return days
}

export function startOfMonth(date: ISODate): ISODate {
  return date.slice(0, 8) + '01'
}

export function endOfMonth(date: ISODate): ISODate {
  const [y, m] = date.split('-').map(Number)
  return fromUtcMs(Date.UTC(y!, m!, 0)) // day 0 of next month = last day of this month
}

export function daysInMonth(date: ISODate): number {
  return Number(endOfMonth(date).slice(8, 10))
}

/** 'YYYY-MM' */
export function monthKey(date: ISODate): string {
  return date.slice(0, 7)
}

export function addMonths(date: ISODate, months: number): ISODate {
  const [y, m] = date.split('-').map(Number)
  return fromUtcMs(Date.UTC(y!, m! - 1 + months, 1))
}

/** Weekday with Monday = 0 … Sunday = 6 (ISO style). */
export function weekdayIndex(date: ISODate): number {
  return (new Date(toUtcMs(date)).getUTCDay() + 6) % 7
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date: ISODate): ISODate {
  return addDays(date, -weekdayIndex(date))
}

/** First day of the bucket a date belongs to. */
export function bucketStart(date: ISODate, granularity: Granularity): ISODate {
  if (granularity === 'week') return startOfWeek(date)
  if (granularity === 'month') return startOfMonth(date)
  return date
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b
}

/**
 * Turn a preset ("last30") into a concrete range relative to `today`.
 * Ranges are inclusive and always end on or before today.
 */
export function resolvePreset(preset: DatePresetKey, today: ISODate, custom?: DateRange): DateRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { from: y, to: y }
    }
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'last30':
      return { from: addDays(today, -29), to: today }
    case 'last90':
      return { from: addDays(today, -89), to: today }
    case 'thisMonth':
      return { from: startOfMonth(today), to: today }
    case 'lastMonth': {
      const lastDay = addDays(startOfMonth(today), -1)
      return { from: startOfMonth(lastDay), to: lastDay }
    }
    case 'custom':
      if (custom && isValidISODate(custom.from) && isValidISODate(custom.to)) {
        return custom.from <= custom.to ? { ...custom } : { from: custom.to, to: custom.from }
      }
      return { from: addDays(today, -29), to: today }
  }
}

/**
 * The comparison period: same number of days, immediately before `range`.
 * e.g. 2026-11-01…2026-11-30 (30 days) → 2026-10-02…2026-10-31
 */
export function previousRange(range: DateRange): DateRange {
  const len = rangeLength(range)
  const to = addDays(range.from, -1)
  return { from: addDays(to, -(len - 1)), to }
}

/** Suggest a sensible chart granularity for a range length. */
export function suggestGranularity(range: DateRange): Granularity {
  const len = rangeLength(range)
  if (len <= 45) return 'day'
  if (len <= 180) return 'week'
  return 'month'
}

/** Clamp a range into [min, max]. */
export function clampRange(range: DateRange, min: ISODate, max: ISODate): DateRange {
  const from = maxDate(range.from, min)
  const to = minDate(range.to, max)
  return from <= to ? { from, to } : { from: to, to }
}

// ---- Labels (locale-aware) ------------------------------------------------
// en: 'Nov 18', 'Nov 18, 2026', 'Nov 2026'
// zh-TW: '11/18', '2026/11/18', '2026 年 11 月'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAYS_ZH = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export function weekdayLabels(lang: Lang = getLang()): string[] {
  return [...(lang === 'zh-TW' ? WEEKDAYS_ZH : WEEKDAYS)]
}

/** 'Nov 18' / '11/18' */
export function formatShortDate(date: ISODate, lang: Lang = getLang()): string {
  const [, m, d] = date.split('-').map(Number)
  return lang === 'zh-TW' ? m + '/' + d : MONTHS[m! - 1] + ' ' + d
}

/** 'Nov 18, 2026' / '2026/11/18' */
export function formatLongDate(date: ISODate, lang: Lang = getLang()): string {
  if (lang === 'zh-TW') return date.slice(0, 4) + '/' + formatShortDate(date, lang)
  return formatShortDate(date, lang) + ', ' + date.slice(0, 4)
}

/** 'Nov 2026' / '2026 年 11 月' from 'YYYY-MM' or a full date. */
export function formatMonth(value: string, lang: Lang = getLang()): string {
  const [y, m] = value.split('-').map(Number)
  return lang === 'zh-TW' ? y + ' 年 ' + m + ' 月' : MONTHS[m! - 1] + ' ' + y
}

/** Axis label for a bucket. */
export function formatBucketLabel(bucket: ISODate, granularity: Granularity, lang: Lang = getLang()): string {
  if (granularity === 'month') return formatMonth(bucket, lang)
  return formatShortDate(bucket, lang)
}

/** 'Oct 22 – Nov 20, 2026' / '2026/10/22 – 11/20' */
export function formatRange(range: DateRange, lang: Lang = getLang()): string {
  if (range.from === range.to) return formatLongDate(range.from, lang)
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4)
  if (lang === 'zh-TW') {
    const right = sameYear ? formatShortDate(range.to, lang) : formatLongDate(range.to, lang)
    return formatLongDate(range.from, lang) + ' – ' + right
  }
  const left = sameYear ? formatShortDate(range.from, lang) : formatLongDate(range.from, lang)
  return left + ' – ' + formatLongDate(range.to, lang)
}

export function formatHour(hour: number): string {
  return pad(hour) + ':00'
}
