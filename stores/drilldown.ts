import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DrillLevel } from '~/types/drilldown'

/**
 * DRILL-DOWN STORE — a stack of levels (like browser history).
 *
 *   [ Revenue by month ] → [ Nov 2026 ] → [ Nov 11 ] → [ Earbuds ]
 *        index 0             index 1        index 2      index 3 (current)
 *
 * push()  = drill deeper, back() = pop one level,
 * goTo(i) = breadcrumb click (drop everything after i).
 */
export const useDrillStore = defineStore('drilldown', () => {
  const stack = ref<DrillLevel[]>([])
  const open = ref(false)

  const current = computed<DrillLevel | null>(() => stack.value[stack.value.length - 1] ?? null)
  const depth = computed(() => stack.value.length)
  const canGoBack = computed(() => stack.value.length > 1)

  /** Open the panel with an initial path (one or more levels). */
  function start(levels: DrillLevel[]): void {
    if (levels.length === 0) return
    stack.value = [...levels]
    open.value = true
  }

  function push(level: DrillLevel): void {
    stack.value = [...stack.value, level]
  }

  function back(): void {
    if (stack.value.length > 1) stack.value = stack.value.slice(0, -1)
  }

  function goTo(index: number): void {
    if (index >= 0 && index < stack.value.length) stack.value = stack.value.slice(0, index + 1)
  }

  function close(): void {
    open.value = false
  }

  return { stack, open, current, depth, canGoBack, start, push, back, goTo, close }
})
