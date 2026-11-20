import { CATEGORIES, CHANNELS, REGIONS, SEGMENTS } from '~/data/catalog'
import type { DimensionKey } from '~/types/analytics'
import type { ChartTheme } from '~/composables/useChartTheme'

/**
 * "Colour follows the entity, never its rank."
 * Email is always the same colour in every chart, even when a filter
 * removes other channels or the ranking order changes.
 */
const ORDER: Partial<Record<DimensionKey, string[]>> = {
  channel: CHANNELS.map((c) => c.id),
  category: CATEGORIES.map((c) => c.id),
  region: REGIONS.map((r) => r.id),
  segment: SEGMENTS.map((s) => s.id),
}

export function entityColorIndex(dimension: DimensionKey, key: string): number {
  const list = ORDER[dimension]
  if (!list) return 0
  const i = list.indexOf(key)
  return i < 0 ? 0 : i % 8
}

export function entityColor(theme: ChartTheme, dimension: DimensionKey, key: string): string {
  return theme.series[entityColorIndex(dimension, key)]!
}
