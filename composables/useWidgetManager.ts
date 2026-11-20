import { widgetLabel, widgetTitle } from '~/data/widget-registry'
import type { WidgetConfig, WidgetSize, WidgetType } from '~/types/widgets'
import { tt } from '~/utils/locale'

/**
 * useWidgetManager — UX layer on top of the dashboard store.
 * The store holds pure state logic (easy to unit test); this composable
 * adds confirmations and toast feedback for the user.
 */
export function useWidgetManager() {
  const store = useDashboardStore()
  const toast = useToast()
  const { confirm } = useConfirm()

  function startEditing(): void {
    store.startEditing()
  }

  async function cancelEditing(): Promise<void> {
    if (store.isDirty) {
      const ok = await confirm({
        title: tt('Discard changes?', '放棄變更？'),
        message: tt('Your unsaved dashboard changes will be lost.', '尚未儲存的儀表板變更將會遺失。'),
        confirmLabel: tt('Discard', '放棄'),
        danger: true,
      })
      if (!ok) return
    }
    store.cancelEditing()
  }

  function save(): void {
    const ok = store.saveEditing()
    if (ok)
      toast.success(
        tt('Dashboard saved', '儀表板已儲存'),
        tt('Your layout will be restored next time.', '下次開啟時會還原這個配置。'),
      )
    else
      toast.warning(
        tt('Saved for this session only', '僅儲存於本次工作階段'),
        tt('Browser storage is unavailable.', '瀏覽器儲存空間無法使用。'),
      )
  }

  async function resetToDefault(): Promise<void> {
    const ok = await confirm({
      title: tt('Restore default layout?', '還原預設配置？'),
      message: tt(
        'All widgets of "{x}" will be replaced by the default set. You can still cancel before saving.',
        '「{x}」的所有 Widget 會被預設組合取代；儲存前仍可取消。',
        { x: store.activeLayout.name },
      ),
      confirmLabel: tt('Restore defaults', '還原預設'),
    })
    if (ok) store.resetDraftToDefault()
  }

  function addWidget(type: WidgetType): WidgetConfig {
    const widget = store.addWidget(type)
    toast.info(
      tt('{x} added', '已新增「{x}」', { x: widgetLabel(type) }),
      tt('Drag it to the position you want.', '可拖曳到想要的位置。'),
    )
    return widget
  }

  async function removeWidget(widget: WidgetConfig): Promise<void> {
    const ok = await confirm({
      title: tt('Remove widget?', '移除 Widget？'),
      message: tt('"{x}" will be removed from this dashboard.', '「{x}」將從這個儀表板移除。', {
        x: widgetTitle(widget),
      }),
      confirmLabel: tt('Remove', '移除'),
      danger: true,
    })
    if (ok) store.removeWidget(widget.id)
  }

  function hideWidget(widget: WidgetConfig): void {
    store.hideWidget(widget.id)
    toast.info(
      tt('Widget hidden', 'Widget 已隱藏'),
      tt('Show it again from "Edit dashboard".', '可從「編輯儀表板」重新顯示。'),
    )
  }

  function resize(widget: WidgetConfig, size: WidgetSize): void {
    store.resizeWidget(widget.id, size)
  }

  return {
    store,
    startEditing,
    cancelEditing,
    save,
    resetToDefault,
    addWidget,
    removeWidget,
    hideWidget,
    resize,
  }
}
