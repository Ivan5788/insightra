import { watch } from 'vue'
import { CATEGORY_IDS, CHANNEL_IDS, REGION_IDS } from '~/data/catalog'
import { DATE_PRESETS } from '~/stores/filters'
import type { DatePresetKey } from '~/types/analytics'
import type { CategoryId, ChannelId, RegionId } from '~/types/domain'
import { isValidISODate } from '~/utils/date'

/**
 * Keeps the global filters in the URL (?range=last30&channel=email).
 *
 * Why the URL as well as localStorage?
 *  - A URL can be shared with a colleague and shows the exact same view.
 *  - Browser back/forward restores previous filter states.
 * localStorage only remembers the *date preference* across visits.
 */

const FILTER_KEYS = ['range', 'from', 'to', 'channel', 'category', 'region'] as const

function first(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined
  return typeof value === 'string' ? value : undefined
}

function isOneOf<T extends string>(list: readonly T[], value: string | undefined): value is T {
  return value !== undefined && (list as readonly string[]).includes(value)
}

export function useFilterUrlSync(): void {
  const route = useRoute()
  const router = useRouter()
  const filters = useFilterStore()

  /** URL → store */
  function applyFromQuery(query: Record<string, unknown>): void {
    const range = first(query.range)
    const from = first(query.from)
    const to = first(query.to)
    if (isValidISODate(from) && isValidISODate(to)) {
      filters.setCustomRange({ from, to })
    } else if (isOneOf(DATE_PRESETS.map((p) => p.key) as DatePresetKey[], range) && range !== 'custom') {
      filters.setPreset(range)
    }
    const channel = first(query.channel)
    const category = first(query.category)
    const region = first(query.region)
    filters.setSegments({
      channel: isOneOf<ChannelId>(CHANNEL_IDS, channel) ? channel : undefined,
      category: isOneOf<CategoryId>(CATEGORY_IDS, category) ? category : undefined,
      region: isOneOf<RegionId>(REGION_IDS, region) ? region : undefined,
    })
  }

  /** store → URL query object (only filter keys) */
  function queryFromStore(): Record<string, string> {
    const q: Record<string, string> = {}
    if (filters.preset === 'custom') {
      q.from = filters.range.from
      q.to = filters.range.to
    } else {
      q.range = filters.preset
    }
    if (filters.channel) q.channel = filters.channel
    if (filters.category) q.category = filters.category
    if (filters.region) q.region = filters.region
    return q
  }

  function sameFilterQuery(a: Record<string, unknown>, b: Record<string, string>): boolean {
    return FILTER_KEYS.every((k) => (first(a[k]) ?? '') === (b[k] ?? ''))
  }

  // Initial load: URL wins over stored preference (shared links must work).
  if (FILTER_KEYS.some((k) => route.query[k] !== undefined)) applyFromQuery(route.query)

  // Store changed → update URL (replace: don't spam the history on every click)
  watch(
    () => [
      filters.preset,
      filters.range.from,
      filters.range.to,
      filters.channel,
      filters.category,
      filters.region,
    ],
    () => {
      const next = queryFromStore()
      if (sameFilterQuery(route.query, next)) return
      const rest = Object.fromEntries(
        Object.entries(route.query).filter(([k]) => !(FILTER_KEYS as readonly string[]).includes(k)),
      )
      router.replace({ query: { ...rest, ...next } })
    },
    { immediate: true },
  )

  // Navigation (links without query, back/forward) → keep filters in the URL
  watch(
    () => route.fullPath,
    () => {
      const next = queryFromStore()
      if (sameFilterQuery(route.query, next)) return
      if (FILTER_KEYS.some((k) => route.query[k] !== undefined)) {
        applyFromQuery(route.query) // back/forward to an older filter state
      } else {
        router.replace({ query: { ...route.query, ...next } }) // plain link → append current filters
      }
    },
  )
}
