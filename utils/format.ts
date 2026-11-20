import { isNumber } from './stats'

/**
 * Number formatting with Intl.NumberFormat.
 * Formatters are cached because creating them is relatively expensive
 * and dashboards format thousands of numbers.
 */

export type ValueFormat = 'currency' | 'number' | 'percent' | 'text' | 'date'

const cache = new Map<string, Intl.NumberFormat>()

function nf(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat('en-US', options)
    cache.set(key, f)
  }
  return f
}

const EMPTY = '—'

export function formatCurrency(value: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (!isNumber(value)) return EMPTY
  if (opts.compact && Math.abs(value) >= 10_000) {
    return nf('cur-compact', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  // Cents only for small, non-integer amounts ($12.50) — never "$0.00" on an axis.
  const digits = Math.abs(value) < 100 && !Number.isInteger(value) ? 2 : 0
  return nf('cur-' + digits, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatNumber(
  value: number | null | undefined,
  opts: { compact?: boolean; digits?: number } = {},
): string {
  if (!isNumber(value)) return EMPTY
  if (opts.compact && Math.abs(value) >= 10_000) {
    return nf('num-compact', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  }
  const digits = opts.digits ?? 0
  return nf('num-' + digits, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

/** `value` is already a percentage (12.5 → "12.5%"). */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (!isNumber(value)) return EMPTY
  return (
    nf('pct-' + digits, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) + '%'
  )
}

/** Signed percentage for deltas: "+12.5%" / "−3.0%". */
export function formatDeltaPercent(value: number | null | undefined, digits = 1): string {
  if (!isNumber(value)) return EMPTY
  const abs = formatPercent(Math.abs(value), digits)
  if (value > 0) return '+' + abs
  if (value < 0) return '−' + abs
  return abs
}

/** Signed percentage points: "+1.2 pp". */
export function formatDeltaPoints(value: number | null | undefined, digits = 1): string {
  if (!isNumber(value)) return EMPTY
  const abs = Math.abs(value).toFixed(digits)
  return (value > 0 ? '+' : value < 0 ? '−' : '') + abs + ' pp'
}

export function formatValue(
  value: number | string | null | undefined,
  format: ValueFormat,
  opts: { compact?: boolean } = {},
): string {
  if (value === null || value === undefined) return EMPTY
  if (typeof value === 'string') return value
  switch (format) {
    case 'currency':
      return formatCurrency(value, opts)
    case 'percent':
      return formatPercent(value)
    case 'number':
      return formatNumber(value, opts)
    default:
      return String(value)
  }
}
