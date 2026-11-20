import type { ZodType } from 'zod'

/**
 * Safe localStorage access.
 *
 * localStorage can throw (private mode, quota, disabled cookies) and its
 * content can be anything (old app versions, manual edits). Every read is
 * therefore validated with a Zod schema; invalid data falls back to defaults
 * instead of crashing the app.
 */

export const STORAGE_KEYS = {
  settings: 'insightra:settings:v1',
  filters: 'insightra:filters:v1',
  dashboards: 'insightra:dashboards:v2',
  reports: 'insightra:reports:v1',
  notificationsRead: 'insightra:notifications-read:v1',
  flaggedOrders: 'insightra:flagged-orders:v1',
  auth: 'insightra:auth:v1',
} as const

export type ReadResult<T> =
  { ok: true; value: T } | { ok: false; reason: 'missing' | 'invalid' | 'unavailable' }

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function readStorage<T>(key: string, schema: ZodType<T>): ReadResult<T> {
  const s = storage()
  if (!s) return { ok: false, reason: 'unavailable' }
  let raw: string | null
  try {
    raw = s.getItem(key)
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
  if (raw === null) return { ok: false, reason: 'missing' }
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, reason: 'invalid' }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  const s = storage()
  if (!s) return false
  try {
    s.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key: string): void {
  try {
    storage()?.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Remove every key this app owns (Settings → Reset local data). */
export function clearAppStorage(): void {
  Object.values(STORAGE_KEYS).forEach(removeStorage)
}
