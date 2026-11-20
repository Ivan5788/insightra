import { onMounted } from 'vue'
import { tt } from '~/utils/locale'

/**
 * useDashboard — layout-level actions for the Overview page
 * (switch / create / rename / delete saved dashboards).
 */
export function useDashboard() {
  const store = useDashboardStore()
  const toast = useToast()
  const { confirm } = useConfirm()

  // Tell the user once if their saved layout was corrupted and reset.
  onMounted(() => {
    if (store.restoreStatus === 'invalid') {
      toast.warning(
        tt('Dashboard layout reset', '儀表板配置已重設'),
        tt(
          'Saved layout data was invalid, so the default layout was loaded.',
          '已儲存的配置資料無效，已改為載入預設配置。',
        ),
      )
      store.restoreStatus = 'ok'
    }
  })

  function switchLayout(id: string): void {
    store.setActiveLayout(id)
  }

  function createLayout(name: string): void {
    const layout = store.createLayout(name, true)
    toast.success(
      tt('Dashboard created', '儀表板已建立'),
      tt('"{x}" is a copy of your current layout.', '「{x}」複製自目前的配置。', { x: layout.name }),
    )
  }

  async function deleteLayout(id: string): Promise<void> {
    const layout = store.layouts.find((l) => l.id === id)
    if (!layout) return
    if (store.layouts.length <= 1) {
      toast.warning(
        tt('Cannot delete', '無法刪除'),
        tt('At least one dashboard is required.', '至少需要保留一個儀表板。'),
      )
      return
    }
    const ok = await confirm({
      title: tt('Delete dashboard?', '刪除儀表板？'),
      message: tt(
        '"{x}" and its widget configuration will be deleted.',
        '「{x}」及其 Widget 設定將被刪除。',
        { x: layout.name },
      ),
      confirmLabel: tt('Delete', '刪除'),
      danger: true,
    })
    if (ok) {
      store.deleteLayout(id)
      toast.success(tt('Dashboard deleted', '儀表板已刪除'))
    }
  }

  return { store, switchLayout, createLayout, deleteLayout }
}
