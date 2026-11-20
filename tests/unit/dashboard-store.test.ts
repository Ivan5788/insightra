import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDashboardStore } from '~/stores/dashboard'
import { DEFAULT_LAYOUT_ID } from '~/data/widget-registry'
import { STORAGE_KEYS } from '~/utils/storage'

/**
 * Widget configuration: add / remove / hide / resize / reorder,
 * save vs cancel, persistence and recovery from corrupted storage.
 */
describe('dashboard store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with the default layouts', () => {
    const store = useDashboardStore()
    expect(store.activeLayoutId).toBe(DEFAULT_LAYOUT_ID)
    expect(store.layouts.length).toBeGreaterThanOrEqual(2)
    expect(store.displayedWidgets.length).toBeGreaterThan(0)
  })

  it('edits a draft and only applies it on save', () => {
    const store = useDashboardStore()
    const before = store.activeLayout.widgets.length
    store.startEditing()
    const added = store.addWidget('ranking')
    expect(store.draft).toHaveLength(before + 1)
    expect(store.activeLayout.widgets).toHaveLength(before) // not saved yet
    expect(store.isDirty).toBe(true)
    store.saveEditing()
    expect(store.activeLayout.widgets.at(-1)!.id).toBe(added.id)
    expect(store.editing).toBe(false)
  })

  it('discards changes on cancel', () => {
    const store = useDashboardStore()
    const ids = store.activeLayout.widgets.map((w) => w.id)
    store.startEditing()
    store.removeWidget(ids[0]!)
    store.cancelEditing()
    expect(store.activeLayout.widgets.map((w) => w.id)).toEqual(ids)
  })

  it('reorders, hides and resizes widgets in the draft', () => {
    const store = useDashboardStore()
    store.startEditing()
    const [first, second] = store.draft
    store.moveWidget(first!.id, 1)
    expect(store.draft[0]!.id).toBe(second!.id)
    expect(store.draft[1]!.id).toBe(first!.id)

    store.toggleVisibility(first!.id)
    expect(store.draft.find((w) => w.id === first!.id)!.visible).toBe(false)

    const line = store.draft.find((w) => w.type === 'line')!
    store.resizeWidget(line.id, 'full')
    expect(line.size).toBe('full')
    store.resizeWidget(line.id, 'sm') // not allowed for line charts
    expect(line.size).toBe('full')
  })

  it('hidden widgets are not displayed outside edit mode', () => {
    const store = useDashboardStore()
    const total = store.displayedWidgets.length
    store.hideWidget(store.displayedWidgets[0]!.id)
    expect(store.displayedWidgets).toHaveLength(total - 1)
    expect(store.hiddenCount).toBe(1)
  })

  it('persists the saved layout and restores it after a reload', () => {
    const store = useDashboardStore()
    store.startEditing()
    const w = store.addWidget('activity')
    store.saveEditing()

    // Simulate a page reload: new Pinia instance reads localStorage again.
    setActivePinia(createPinia())
    const reloaded = useDashboardStore()
    expect(reloaded.activeLayout.widgets.some((x) => x.id === w.id)).toBe(true)
    expect(reloaded.restoreStatus).toBe('ok')
  })

  it('falls back to defaults when stored data is invalid', () => {
    localStorage.setItem(STORAGE_KEYS.dashboards, JSON.stringify({ version: 1, layouts: 'broken' }))
    const store = useDashboardStore()
    expect(store.restoreStatus).toBe('invalid')
    expect(store.activeLayoutId).toBe(DEFAULT_LAYOUT_ID)
  })

  it('creates independent layout copies and never deletes the last one', () => {
    const store = useDashboardStore()
    const copy = store.createLayout('My view')
    expect(store.activeLayoutId).toBe(copy.id)
    const originalIds = new Set(store.layouts[0]!.widgets.map((w) => w.id))
    expect(copy.widgets.every((w) => !originalIds.has(w.id))).toBe(true)

    store.layouts.slice().forEach((l) => store.deleteLayout(l.id))
    expect(store.layouts).toHaveLength(1)
  })
})
