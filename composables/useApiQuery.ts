import { onScopeDispose, ref, shallowRef, watch, type Ref, type ShallowRef } from 'vue'
import { ApiError } from '~/services/errors'

/**
 * useApiQuery — small data-fetching composable.
 *
 *   const { data, pending, error, refresh } = useApiQuery(
 *     () => 'overview:' + JSON.stringify(filter),   // cache key (reactive)
 *     () => analyticsService.overview(filter),      // fetcher
 *   )
 *
 * Features:
 *  1. Re-fetches automatically when the key changes (e.g. date filter).
 *  2. Request de-duplication: if 6 KPI widgets ask for the same key at the
 *     same time, only ONE HTTP request is sent (shared promise cache).
 *  3. Short-lived cache (TTL) so navigating between pages is instant.
 *  4. Race-condition safe: a slow old response never overwrites newer data.
 *  5. Keeps showing the previous data while new data loads
 *     ("stale-while-revalidate") → no layout jumps.
 */

interface CacheEntry {
  promise: Promise<unknown>
  createdAt: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 60_000

export function clearQueryCache(): void {
  cache.clear()
}

/**
 * Global key scope (e.g. the UI language): the same query in another
 * language is a different cache entry, because the API returns localized labels.
 */
let scope: () => string = () => ''

export function setQueryScope(fn: () => string): void {
  scope = fn
}

export interface ApiQuery<T> {
  data: ShallowRef<T | null>
  pending: Ref<boolean>
  error: Ref<ApiError | null>
  refresh: () => Promise<void>
}

export function useApiQuery<T>(
  key: () => string | null,
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {},
): ApiQuery<T> {
  const ttl = options.ttl ?? DEFAULT_TTL
  const data = shallowRef<T | null>(null)
  const pending = ref(false)
  const error = ref<ApiError | null>(null)
  let latestRequest = 0
  let disposed = false

  async function run(force = false): Promise<void> {
    const raw = key()
    if (raw === null) return
    const k = scope() + '|' + raw
    const requestId = ++latestRequest
    pending.value = true
    error.value = null

    let entry = cache.get(k)
    if (force || !entry || Date.now() - entry.createdAt > ttl) {
      entry = { promise: fetcher(), createdAt: Date.now() }
      cache.set(k, entry)
      // Never cache failures — the next call should retry.
      entry.promise.catch(() => {
        if (cache.get(k) === entry) cache.delete(k)
      })
    }

    try {
      const result = (await entry.promise) as T
      if (!disposed && requestId === latestRequest) data.value = result
    } catch (e) {
      if (!disposed && requestId === latestRequest) {
        error.value =
          e instanceof ApiError ? e : new ApiError(0, e instanceof Error ? e.message : 'Unknown error')
      }
    } finally {
      if (!disposed && requestId === latestRequest) pending.value = false
    }
  }

  watch(key, () => run(), { immediate: true })
  onScopeDispose(() => {
    disposed = true
  })

  return { data, pending, error, refresh: () => run(true) }
}
