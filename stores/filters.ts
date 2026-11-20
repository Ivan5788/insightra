import { byLang } from '~/utils/locale'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import type { AnalyticsFilter, DatePresetKey, DateRange, Granularity } from '~/types/analytics'
import type { CategoryId, ChannelId, RegionId } from '~/types/domain'
import { isValidISODate, previousRange, resolvePreset, suggestGranularity, todayISO } from '~/utils/date'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'
import { useSettingsStore } from './settings'

/**
 * GLOBAL FILTER STORE — the heart of cross-component synchronisation.
 *
 *  DateRangePicker ──writes──► filterStore ──computed apiFilter──► every widget
 *
 * Widgets never keep their own date state. They all read `apiFilter`, so
 * changing the date (or a channel filter) updates KPI cards, charts, tables
 * and rankings at the same time, from the same parameters.
 */

const datePrefsSchema = z.object({
  preset: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'lastMonth', 'custom']),
  customRange: z
    .object({ from: z.string().refine(isValidISODate), to: z.string().refine(isValidISODate) })
    .optional(),
  granularity: z.enum(['auto', 'day', 'week', 'month']),
  compare: z.boolean(),
})

export type GranularityOption = Granularity | 'auto'

export const DATE_PRESETS: { key: DatePresetKey; label: string }[] = [
  {
    key: 'today',
    get label() {
      return byLang('Today', '今天')
    },
  },
  {
    key: 'yesterday',
    get label() {
      return byLang('Yesterday', '昨天')
    },
  },
  {
    key: 'last7',
    get label() {
      return byLang('Last 7 days', '近 7 天')
    },
  },
  {
    key: 'last30',
    get label() {
      return byLang('Last 30 days', '近 30 天')
    },
  },
  {
    key: 'last90',
    get label() {
      return byLang('Last 90 days', '近 90 天')
    },
  },
  {
    key: 'thisMonth',
    get label() {
      return byLang('This month', '本月')
    },
  },
  {
    key: 'lastMonth',
    get label() {
      return byLang('Last month', '上個月')
    },
  },
  {
    key: 'custom',
    get label() {
      return byLang('Custom range', '自訂範圍')
    },
  },
]

export const useFilterStore = defineStore('filters', () => {
  const settings = useSettingsStore()
  const stored = readStorage(STORAGE_KEYS.filters, datePrefsSchema)

  const today = ref(todayISO())
  const preset = ref<DatePresetKey>(stored.ok ? stored.value.preset : settings.settings.defaultPreset)
  const customRange = ref<DateRange | undefined>(stored.ok ? stored.value.customRange : undefined)
  const granularity = ref<GranularityOption>(stored.ok ? stored.value.granularity : 'auto')
  const compare = ref<boolean>(stored.ok ? stored.value.compare : settings.settings.compareEnabled)

  // Segment filters (not persisted to storage — they live in the URL instead).
  const channel = ref<ChannelId | undefined>()
  const category = ref<CategoryId | undefined>()
  const region = ref<RegionId | undefined>()

  // ---- Derived state (computed = cached, recalculated only when inputs change)
  const range = computed<DateRange>(() => resolvePreset(preset.value, today.value, customRange.value))
  const comparisonRange = computed<DateRange>(() => previousRange(range.value))
  const effectiveGranularity = computed<Granularity>(() =>
    granularity.value === 'auto' ? suggestGranularity(range.value) : granularity.value,
  )

  /** The object every API call is built from. */
  const apiFilter = computed<AnalyticsFilter>(() => ({
    from: range.value.from,
    to: range.value.to,
    channel: channel.value,
    category: category.value,
    region: region.value,
  }))

  /** Stable string version — used as a cache key by useApiQuery. */
  const filterKey = computed(() => JSON.stringify(apiFilter.value))

  const activeSegmentCount = computed(
    () => [channel.value, category.value, region.value].filter(Boolean).length,
  )

  // ---- Actions
  function setPreset(value: DatePresetKey): void {
    preset.value = value
  }

  function setCustomRange(value: DateRange): void {
    customRange.value = value.from <= value.to ? value : { from: value.to, to: value.from }
    preset.value = 'custom'
  }

  function setGranularity(value: GranularityOption): void {
    granularity.value = value
  }

  function setCompare(value: boolean): void {
    compare.value = value
  }

  function setSegments(value: { channel?: ChannelId; category?: CategoryId; region?: RegionId }): void {
    channel.value = value.channel
    category.value = value.category
    region.value = value.region
  }

  function clearSegments(): void {
    setSegments({})
  }

  /** Called when the tab regains focus — "today" may have changed overnight. */
  function refreshToday(): void {
    const now = todayISO()
    if (now !== today.value) today.value = now
  }

  watch([preset, customRange, granularity, compare], () => {
    writeStorage(STORAGE_KEYS.filters, {
      preset: preset.value,
      customRange: customRange.value,
      granularity: granularity.value,
      compare: compare.value,
    })
  })

  return {
    today,
    preset,
    customRange,
    granularity,
    compare,
    channel,
    category,
    region,
    range,
    comparisonRange,
    effectiveGranularity,
    apiFilter,
    filterKey,
    activeSegmentCount,
    setPreset,
    setCustomRange,
    setGranularity,
    setCompare,
    setSegments,
    clearSegments,
    refreshToday,
  }
})
