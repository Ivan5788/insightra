import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useFilterStore } from '~/stores/filters'
import { STORAGE_KEYS } from '~/utils/storage'

describe('filter store (global date filter)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('derives the range and comparison period from the preset', () => {
    const f = useFilterStore()
    f.today = '2026-11-20'
    f.setPreset('last7')
    expect(f.range).toEqual({ from: '2026-11-14', to: '2026-11-20' })
    expect(f.comparisonRange).toEqual({ from: '2026-11-07', to: '2026-11-13' })
    expect(f.effectiveGranularity).toBe('day')
  })

  it('builds one API filter that includes segment filters', () => {
    const f = useFilterStore()
    f.today = '2026-11-20'
    f.setPreset('thisMonth')
    f.setSegments({ channel: 'email' })
    expect(f.apiFilter).toEqual({
      from: '2026-11-01',
      to: '2026-11-20',
      channel: 'email',
      category: undefined,
      region: undefined,
    })
    expect(f.activeSegmentCount).toBe(1)
    f.clearSegments()
    expect(f.activeSegmentCount).toBe(0)
  })

  it('normalises a reversed custom range', () => {
    const f = useFilterStore()
    f.setCustomRange({ from: '2026-05-10', to: '2026-05-01' })
    expect(f.preset).toBe('custom')
    expect(f.range).toEqual({ from: '2026-05-01', to: '2026-05-10' })
  })

  it('remembers the date preference across reloads', async () => {
    const f = useFilterStore()
    f.setPreset('last90')
    f.setGranularity('week')
    await nextTick()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.filters)!).preset).toBe('last90')

    setActivePinia(createPinia())
    const reloaded = useFilterStore()
    expect(reloaded.preset).toBe('last90')
    expect(reloaded.granularity).toBe('week')
  })

  it('changes the cache key when the filter changes (drives re-fetching)', () => {
    const f = useFilterStore()
    const before = f.filterKey
    f.setSegments({ region: 'jp' })
    expect(f.filterKey).not.toBe(before)
  })
})
