import { byLang } from '~/utils/locale'
import { computed } from 'vue'
import { DATE_PRESETS } from '~/stores/filters'
import type { DatePresetKey, DateRange } from '~/types/analytics'
import { addDays, formatRange, rangeLength } from '~/utils/date'

/**
 * useDateFilter — view-model for the DateRangePicker.
 * Exposes labels and actions; the actual state lives in the filter store.
 */
export function useDateFilter() {
  const filters = useFilterStore()

  const presets = DATE_PRESETS
  const presetLabel = computed(
    () => DATE_PRESETS.find((p) => p.key === filters.preset)?.label ?? byLang('Custom range', '自訂範圍'),
  )
  const rangeLabel = computed(() => formatRange(filters.range))
  const comparisonLabel = computed(() => formatRange(filters.comparisonRange))
  const days = computed(() => rangeLength(filters.range))

  /** Oldest selectable date (mock dataset keeps ~800 days of history). */
  const minDate = computed(() => addDays(filters.today, -790))
  const maxDate = computed(() => filters.today)

  function selectPreset(key: DatePresetKey): void {
    filters.setPreset(key)
  }

  function applyCustom(range: DateRange): void {
    filters.setCustomRange(range)
  }

  return {
    presets,
    preset: computed(() => filters.preset),
    range: computed(() => filters.range),
    presetLabel,
    rangeLabel,
    comparisonLabel,
    days,
    minDate,
    maxDate,
    selectPreset,
    applyCustom,
  }
}
