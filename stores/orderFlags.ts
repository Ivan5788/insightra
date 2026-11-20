import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/**
 * Orders flagged "for review" in the data table (batch action).
 * Kept in the browser only — the mock API is read-only.
 */
export const useOrderFlagsStore = defineStore('orderFlags', () => {
  const stored = readStorage(STORAGE_KEYS.flaggedOrders, z.array(z.string()))
  const flagged = ref<Set<string>>(new Set(stored.ok ? stored.value : []))
  const count = computed(() => flagged.value.size)

  function persist(): void {
    writeStorage(STORAGE_KEYS.flaggedOrders, [...flagged.value])
  }

  function isFlagged(id: string): boolean {
    return flagged.value.has(id)
  }

  function flag(ids: string[]): void {
    const next = new Set(flagged.value)
    ids.forEach((id) => next.add(id))
    flagged.value = next
    persist()
  }

  function unflag(ids: string[]): void {
    const next = new Set(flagged.value)
    ids.forEach((id) => next.delete(id))
    flagged.value = next
    persist()
  }

  return { flagged, count, isFlagged, flag, unflag }
})
