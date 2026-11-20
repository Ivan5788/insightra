import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { z } from 'zod'
import {
  createDefaultLayouts,
  DEFAULT_LAYOUT_ID,
  defaultWidgetsFor,
  WIDGET_REGISTRY,
} from '~/data/widget-registry'
import type { DashboardLayout, DashboardState, WidgetConfig, WidgetSize, WidgetType } from '~/types/widgets'
import { createId } from '~/utils/id'
import { tt } from '~/utils/locale'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/**
 * DASHBOARD STORE — widget layouts and the edit session.
 *
 * Saved state:   layouts[] (each with an ordered widgets[] array) + activeLayoutId
 * Edit session:  `draft` is a deep copy of the active layout's widgets.
 *                All edits (add / remove / hide / resize / reorder) change the
 *                draft only. "Save" copies the draft back and persists it;
 *                "Cancel" simply throws the draft away.
 *
 * The ORDER of the widgets array IS the visual order — drag-and-drop
 * reorders the array itself, not just CSS positions.
 */

const metricKeys = [
  'revenue',
  'orders',
  'activeUsers',
  'conversionRate',
  'aov',
  'revenueGrowth',
  'sessions',
  'unitsSold',
  'newCustomers',
  'refundRate',
] as const

const widgetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['kpi', 'line', 'bar', 'area', 'donut', 'table', 'ranking', 'activity']),
  title: z.string().max(80),
  size: z.enum(['sm', 'md', 'lg', 'full']),
  visible: z.boolean(),
  settings: z.object({
    metric: z.enum(metricKeys).optional(),
    dimension: z.enum(['channel', 'category', 'region', 'product', 'segment']).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  }),
})

export const dashboardStateSchema = z
  .object({
    version: z.literal(1),
    activeLayoutId: z.string(),
    layouts: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().min(1).max(40),
          updatedAt: z.string(),
          widgets: z.array(widgetSchema),
        }),
      )
      .min(1),
  })
  // Widget ids must be unique inside a layout (drag-and-drop relies on it).
  .refine((s) => s.layouts.every((l) => new Set(l.widgets.map((w) => w.id)).size === l.widgets.length), {
    message: 'Duplicate widget id',
  })

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function initialState(): { state: DashboardState; restored: 'ok' | 'missing' | 'invalid' } {
  const result = readStorage(STORAGE_KEYS.dashboards, dashboardStateSchema)
  if (result.ok) {
    const s = result.value as DashboardState
    const activeExists = s.layouts.some((l) => l.id === s.activeLayoutId)
    return {
      state: { ...s, activeLayoutId: activeExists ? s.activeLayoutId : s.layouts[0]!.id },
      restored: 'ok',
    }
  }
  return {
    state: { version: 1, activeLayoutId: DEFAULT_LAYOUT_ID, layouts: createDefaultLayouts() },
    restored: result.reason === 'invalid' ? 'invalid' : 'missing',
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const init = initialState()
  const layouts = ref<DashboardLayout[]>(init.state.layouts)
  const activeLayoutId = ref(init.state.activeLayoutId)
  /** 'invalid' → saved data was corrupted and defaults were used (UI shows a toast). */
  const restoreStatus = ref(init.restored)

  const editing = ref(false)
  const draft = ref<WidgetConfig[]>([])

  const activeLayout = computed<DashboardLayout>(
    () => layouts.value.find((l) => l.id === activeLayoutId.value) ?? layouts.value[0]!,
  )

  /** What the grid renders: the draft while editing, otherwise visible saved widgets. */
  const displayedWidgets = computed<WidgetConfig[]>(() =>
    editing.value ? draft.value : activeLayout.value.widgets.filter((w) => w.visible),
  )

  const hiddenCount = computed(() => activeLayout.value.widgets.filter((w) => !w.visible).length)

  const isDirty = computed(
    () => editing.value && JSON.stringify(draft.value) !== JSON.stringify(activeLayout.value.widgets),
  )

  function persist(): boolean {
    const state: DashboardState = { version: 1, activeLayoutId: activeLayoutId.value, layouts: layouts.value }
    return writeStorage(STORAGE_KEYS.dashboards, state)
  }

  // ---- Layouts --------------------------------------------------------------

  function setActiveLayout(id: string): void {
    if (editing.value || !layouts.value.some((l) => l.id === id)) return
    activeLayoutId.value = id
    persist()
  }

  function createLayout(name: string, copyCurrent = true): DashboardLayout {
    const source = copyCurrent ? activeLayout.value.widgets : defaultWidgetsFor(DEFAULT_LAYOUT_ID)
    const layout: DashboardLayout = {
      id: createId('layout'),
      name: name.trim().slice(0, 40) || tt('Untitled', '未命名'),
      // New ids so the copy is independent of the original.
      widgets: deepClone(source).map((w) => ({ ...w, id: createId('w') })),
      updatedAt: new Date().toISOString(),
    }
    layouts.value.push(layout)
    activeLayoutId.value = layout.id
    persist()
    return layout
  }

  function renameLayout(id: string, name: string): void {
    const layout = layouts.value.find((l) => l.id === id)
    if (!layout || !name.trim()) return
    layout.name = name.trim().slice(0, 40)
    persist()
  }

  function deleteLayout(id: string): boolean {
    if (layouts.value.length <= 1) return false
    layouts.value = layouts.value.filter((l) => l.id !== id)
    if (activeLayoutId.value === id) activeLayoutId.value = layouts.value[0]!.id
    persist()
    return true
  }

  // ---- Edit session -------------------------------------------------------

  function startEditing(): void {
    draft.value = deepClone(activeLayout.value.widgets)
    editing.value = true
  }

  function cancelEditing(): void {
    draft.value = []
    editing.value = false
  }

  function saveEditing(): boolean {
    const layout = activeLayout.value
    layout.widgets = deepClone(draft.value)
    layout.updatedAt = new Date().toISOString()
    editing.value = false
    draft.value = []
    return persist()
  }

  /** Replace the draft with the factory defaults (still needs Save). */
  function resetDraftToDefault(): void {
    draft.value = defaultWidgetsFor(activeLayout.value.id)
  }

  function addWidget(type: WidgetType): WidgetConfig {
    const def = WIDGET_REGISTRY[type]
    const widget: WidgetConfig = {
      id: createId('w'),
      type,
      title: '',
      size: def.defaultSize,
      visible: true,
      settings: { ...def.defaultSettings },
    }
    draft.value.push(widget)
    return widget
  }

  function removeWidget(id: string): void {
    draft.value = draft.value.filter((w) => w.id !== id)
  }

  function updateWidget(id: string, patch: Partial<Omit<WidgetConfig, 'id'>>): void {
    const w = draft.value.find((x) => x.id === id)
    if (!w) return
    Object.assign(w, patch, patch.settings ? { settings: { ...w.settings, ...patch.settings } } : {})
  }

  function toggleVisibility(id: string): void {
    const w = draft.value.find((x) => x.id === id)
    if (w) w.visible = !w.visible
  }

  function resizeWidget(id: string, size: WidgetSize): void {
    const w = draft.value.find((x) => x.id === id)
    if (w && WIDGET_REGISTRY[w.type].allowedSizes.includes(size)) w.size = size
  }

  /** Keyboard / button alternative to drag-and-drop (accessibility). */
  function moveWidget(id: string, direction: -1 | 1): void {
    const index = draft.value.findIndex((w) => w.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= draft.value.length) return
    const copy = [...draft.value]
    const [item] = copy.splice(index, 1)
    copy.splice(target, 0, item!)
    draft.value = copy
  }

  /** Set by vuedraggable after a drag (v-model). */
  function setDraftOrder(list: WidgetConfig[]): void {
    draft.value = list
  }

  /** Quick action outside edit mode (widget menu → Hide). Saved immediately. */
  function hideWidget(id: string): void {
    const w = activeLayout.value.widgets.find((x) => x.id === id)
    if (!w) return
    w.visible = false
    activeLayout.value.updatedAt = new Date().toISOString()
    persist()
  }

  function showAllWidgets(): void {
    activeLayout.value.widgets.forEach((w) => (w.visible = true))
    persist()
  }

  /** Reset everything (Settings → reset dashboards). */
  function resetAll(): void {
    layouts.value = createDefaultLayouts()
    activeLayoutId.value = DEFAULT_LAYOUT_ID
    editing.value = false
    draft.value = []
    persist()
  }

  return {
    layouts,
    activeLayoutId,
    activeLayout,
    restoreStatus,
    editing,
    draft,
    displayedWidgets,
    hiddenCount,
    isDirty,
    setActiveLayout,
    createLayout,
    renameLayout,
    deleteLayout,
    startEditing,
    cancelEditing,
    saveEditing,
    resetDraftToDefault,
    addWidget,
    removeWidget,
    updateWidget,
    toggleVisibility,
    resizeWidget,
    moveWidget,
    setDraftOrder,
    hideWidget,
    showAllWidgets,
    resetAll,
  }
})
