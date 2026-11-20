# WIDGET_SYSTEM — Widget 管理系統說明

## 1. 功能
| 功能 | 操作 |
| --- | --- |
| 新增 | Edit dashboard → Add widget → 選擇 8 種類型之一 |
| 移除 | 編輯工具列垃圾桶（需確認） |
| 隱藏 / 顯示 | 編輯工具列眼睛；或檢視模式 Widget 選單「Hide widget」（立即儲存）；「Show N hidden」一鍵顯示 |
| 拖曳排序 | 拖曳把手（滑鼠立即；觸控長按 200 ms）；或 ← / → 按鈕（鍵盤、螢幕報讀器） |
| 調整大小 | Small / Medium / Large / Full width（依類型限制） |
| 個別設定 | 齒輪：標題、指標、分組維度、顯示筆數 |
| 儲存 / 取消 | Save layout；Cancel（有未儲存變更時確認） |
| 還原預設 | Restore defaults（仍需 Save 才生效） |
| 多組儀表板 | 版面切換器：Overview、Marketing、自建（複製目前版面）、刪除（至少保留一組） |
| 離開保護 | 編輯中有變更時離開頁面會確認 |

## 2. 資料模型（`types/widgets.ts`）
```ts
type WidgetType = 'kpi' | 'line' | 'bar' | 'area' | 'donut' | 'table' | 'ranking' | 'activity'
type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

interface WidgetConfig {
  id: string            // 唯一 id（drag & drop 與 v-for key 依賴它）
  type: WidgetType
  title: string
  size: WidgetSize
  visible: boolean
  settings: { metric?: MetricKey; dimension?: DimensionKey; limit?: number }
}

interface DashboardLayout { id: string; name: string; widgets: WidgetConfig[]; updatedAt: string }
interface DashboardState  { version: 1; activeLayoutId: string; layouts: DashboardLayout[] }
```
**陣列順序 = 畫面順序。** 拖曳改的是 `widgets` 陣列本身，不是 CSS 位置，所以儲存的就是使用者看到的。

## 3. 「設定」與「行為」分離
- `stores/dashboard.ts` 只存 **設定**（`WidgetConfig`）。
- `data/widget-registry.ts` 描述每種類型的 **能力**：預設標題、允許尺寸、可編輯欄位、可選指標 / 維度。
- `components/widgets/WidgetRenderer.vue` 把 `type` 對應到元件，並用 `defineAsyncComponent` 讓每種 Widget 成為獨立 chunk。

| Type | 資料來源 | 說明 |
| --- | --- | --- |
| `kpi` | `useOverview()` | 6 張 KPI 共用同一請求；Revenue 有 drill 入口 |
| `line` | `useTimeSeries()` | 本期 vs 前期；點擊鑽取 |
| `bar` | 時間序列或 `breakdown`（依 dimension） | 渠道/品類可點擊鑽取 |
| `area` | 累積營收（vs 前期）或 `series-by` 堆疊 | |
| `donut` | `breakdown` | ≤ 6 片，其餘 Other |
| `table` | `/api/orders` 最新 N 筆 | 連到 Data Table |
| `ranking` | `breakdown`（product / category / channel / region） | 點擊鑽取 |
| `activity` | `/api/activity` | 大額訂單、退款、VIP |

## 4. 編輯流程（Draft pattern）
```
startEditing()      draft = deepClone(activeLayout.widgets)
  ├ addWidget / removeWidget / toggleVisibility / resizeWidget / moveWidget / updateWidget
  │ setDraftOrder(list)      ← vuedraggable v-model
  ├ saveEditing()   activeLayout.widgets = deepClone(draft) → persist() → Toast
  └ cancelEditing() draft = []（原資料從未被修改）
isDirty = JSON(draft) !== JSON(activeLayout.widgets)
```
好處：取消永遠安全、可偵測未儲存變更、單元測試簡單。
UX（確認、Toast）放在 `composables/useWidgetManager.ts`，store 保持純邏輯。

## 5. 拖曳實作（`WidgetGrid.vue`）
```vue
<draggable v-model="draftModel" item-key="id" handle=".widget__handle"
           :animation="180" :delay="200" :delay-on-touch-only="true" @end="onDragEnd">
```
- `draftModel` 是 computed get/set → set 時呼叫 `store.setDraftOrder(list)`，資料與畫面同步。
- `handle`：只能從把手拖，避免誤觸圖表。
- 觸控：長按 200 ms 才開始拖曳，不搶頁面捲動；把手 `touch-action: none`。
- 拖曳完成以 `aria-live` 宣告「Revenue trend moved to position 3」。

## 6. 尺寸與 RWD
| Size | Desktop（12 欄） | Tablet（6 欄） | Mobile（2 欄） |
| --- | --- | --- | --- |
| sm | 2 | 2 | 1（KPI 兩張一列） |
| md | 4 | 3 | 2 |
| lg | 8 | 6 | 2 |
| full | 12 | 6 | 2 |
圖表容器尺寸改變時，`BaseChart` 的 `ResizeObserver` 呼叫 `chart.resize()`（調整 Widget 大小、收合 Sidebar 都會觸發）。

## 7. 持久化與驗證
- Key：`insightra:dashboards:v1`（localStorage）。
- 載入時用 Zod `dashboardStateSchema` 驗證：型別、enum、`limit` 1–20、**同一版面 widget id 不可重複**。
- 驗證失敗 → 載入預設版面，`restoreStatus = 'invalid'`，頁面顯示 Toast 告知。
- activeLayoutId 不存在 → 自動改用第一個版面。
- 寫入失敗（隱私模式）→ Toast「Saved for this session only」。
- 主題、日期偏好分別存在 settings / filters（見 DATA_STRUCTURE）。

## 8. 測試
- 單元（`tests/unit/dashboard-store.test.ts`）：草稿與儲存、取消、排序 / 隱藏 / 尺寸限制、重新載入後還原、損壞資料回退、版面複製與刪除保護。
- E2E（`tests/e2e/dashboard.spec.ts`）：移除＋新增＋儲存→重新整理仍保留；取消會還原；編輯模式無水平捲動。

## 9. 面試時怎麼講
「Widget 系統我分成三層：registry 描述每種 Widget 能做什麼、store 只存使用者的設定、renderer 把 type 對應到非同步元件。
編輯時操作的是一份 draft，所以 Cancel 只是丟掉 draft。拖曳直接改陣列順序，存進 localStorage 前後都用 Zod 驗證，壞掉的資料會安全回退到預設值。」
