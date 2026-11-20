/**
 * CSV generation (RFC 4180).
 * Pure function → easy to unit test. `downloadTextFile` is the only
 * browser-specific part.
 */

export interface CsvColumn<T> {
  key: string
  label: string
  /** Optional accessor; defaults to row[key]. */
  value?: (row: T) => string | number | boolean | null | undefined
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Prevent CSV/formula injection when opened in Excel.
  if (/^[=+\-@]/.test(text) && !/^-?\d/.test(text)) text = "'" + text
  if (/[",\r\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"'
  return text
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: readonly T[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key]
        return escapeCell(raw)
      })
      .join(','),
  )
  return [header, ...lines].join('\r\n')
}

/** Trigger a file download in the browser. */
export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  // BOM so Excel opens UTF-8 CSV (incl. Chinese) correctly.
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + content : content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** 'Revenue Report' → 'revenue-report-2026-11-20.csv' */
export function csvFilename(name: string, date: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return (slug || 'export') + '-' + date + '.csv'
}
