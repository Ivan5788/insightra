# COMPONENT_GUIDE — 元件規範

## 1. 原則
1. **單一責任**：顯示元件不抓資料；資料由 composable 提供（例：`StatCard` 只吃 props，`KpiWidget` 負責取資料）。
2. **Props 有型別**：`defineProps<{...}>()` + `withDefaults`；事件用 `defineEmits<{ select: [key: string] }>()`。
3. **v-model**：表單類元件用 `defineModel()`（`SegmentedControl`、`ToggleSwitch`、`SearchInput`、`BaseTabs`）。
4. **泛型元件**：`DataTable`、`BaseTabs`、`SegmentedControl`、`SelectInput` 使用 `<script setup generic="T">`，選項值型別會被推導。
5. **樣式**：共用外觀用全域 class（`.btn`、`.input`、`.card`、`.badge`），元件細節用 `scoped` SCSS；顏色只用 CSS 變數。
6. **命名**：`components/` 下關閉路徑前綴（`pathPrefix: false`），直接使用 `<StatCard>`；名稱必須全域唯一。
7. **無障礙**：互動元件可用鍵盤操作，有 aria 屬性。

## 2. 目錄
| 資料夾 | 內容 |
| --- | --- |
| `common/` | 與業務無關的基礎元件 |
| `layout/` | App 外框（Header、Sidebar、Footer、通知、使用者選單、全域搜尋） |
| `forms/` | 日期、篩選、搜尋、下拉、報表表單 |
| `charts/` | `BaseChart`（唯一接觸 ECharts 的元件）、`ChartCard`、`ChartDataTable` |
| `tables/` | `DataTable`、`Pagination`、`ColumnToggle` |
| `dashboard/` | `StatCard`、`RankingList`、`ActivityFeed`、`DrillDownPanel`、`DrillDownView` |
| `widgets/` | Widget 系統（Grid、Container、Renderer、Toolbar、8 種 Widget、Modals） |

## 3. 共用元件一覽

| 元件 | 主要 Props | Emits / Slots | 說明 |
| --- | --- | --- | --- |
| `AppIcon` | `name: IconName`、`size`、`label?` | — | 無 label 時 `aria-hidden` |
| `AppLogo` | `size`、`showText` | — | SVG 漸層，id 用 `useId()` 避免衝突 |
| `BaseButton` | `variant`、`size`、`icon`、`iconOnly`、`label`、`loading`、`to?` | default slot | 有 `to` 時渲染 `NuxtLink` |
| `BaseModal` | `open`、`title`、`description?`、`size`、`persistent` | `close`；`#footer` | Teleport、focus trap、Esc |
| `BaseDrawer` | `open`、`side`、`width`、`title?` | `close`；`#header` | 手機全螢幕 |
| `BaseDropdown` | `align`、`width`、`closeOnSelect` | `#trigger="{ toggle, attrs }"` | 點外部 / Esc 關閉 |
| `BaseTabs<T>` | `tabs`、`label`、`v-model` | default slot（panel） | WAI-ARIA tabs，方向鍵 |
| `SegmentedControl<T>` | `options`、`label`、`size`、`v-model` | — | radio 語意 |
| `ToggleSwitch` | `label`、`description?`、`v-model` | — | `role="switch"` |
| `InfoTooltip` | `text`、`label`、`placement` | — | hover + focus；自動避開邊緣 |
| `Breadcrumb` | `items: {label,to?}[]` | `navigate(index)` | 有 `to` → 連結，否則 → 按鈕 |
| `PageHeader` | `title`、`subtitle?`、`breadcrumb?` | `#actions` | 同時設定 `<title>` |
| `DeltaBadge` | `direction`、`value`、`unit`、`higherIsBetter` | — | 好壞色 + 箭頭 + sr-only 說明 |
| `StatusBadge` | `status` | — | icon + 文字 |
| `EmptyState` / `ErrorState` | `title`、`description/message`、`compact` | `retry`（Error） | |
| `SkeletonBlock` / `LoadingSpinner` | 尺寸 | — | |
| `ToastContainer` / `ConfirmDialog` | （讀 `ui` store） | — | 掛在 `app.vue` |

## 4. 表單元件
| 元件 | 說明 |
| --- | --- |
| `DateRangePicker` | Preset 清單 + 原生 `<input type="date">` 自訂區間（含驗證）+ 比較開關 |
| `FilterPanel` | 渠道 / 品類 / 地區；本地草稿，按 Apply 才寫入 store（只觸發一次重抓） |
| `GlobalFilterBar` | 以上兩者 + 可移除的篩選 chips |
| `SearchInput` | 300 ms debounce、Esc 清除 |
| `SelectInput<T>` | 原生 select（行動裝置體驗最好） |
| `ReportForm` | 建立報表，逐欄錯誤訊息 |

## 5. 圖表元件
### `BaseChart`
```vue
<LazyBaseChart :option="option" :height="300" label="Revenue trend chart" clickable @click="onClick" />
```
- `option`：由 `utils/charts/options.ts` 的純函式產生。
- 生命週期：`onMounted → init`、`watch(option) → setOption(notMerge)`、`ResizeObserver → resize`、`onBeforeUnmount → dispose`。
- Events：`click`、`datazoom`、`legendselectchanged`。
- 一律用 `Lazy` 前綴 → ECharts 獨立 chunk。

### `ChartCard`
處理 loading / refreshing / error / empty 四種狀態，`#actions`、`#table`（Chart ↔ Table 切換）、`#footer`。

### Option builders（`utils/charts/options.ts`）
`trendLineOption`、`multiLineOption`、`barOption`、`donutOption`（+`foldOther`）、`scatterOption`、`radarOption`、`heatmapOption`、`funnelOption`、`gaugeOption`、`sparklineOption`。
全部是 `(data, theme) => EChartsOption` 純函式，不依賴 Vue。

## 6. DataTable
```vue
<DataTable
  v-model:selected="selected"
  :columns="columns" :rows="rows" :row-key="(r) => r.id"
  :sort-by="sortBy" :sort-dir="sortDir" selectable caption="Orders"
  @sort="onSort"
>
  <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
</DataTable>
```
- `columns: DataColumn<T>[]`：`key`、`label`、`sortable`、`align`、`format`、`value(row)`、`hideOnMobile`、`required`。
- 排序只 emit，由父層決定前端或伺服器排序（本專案訂單表為伺服器排序）。
- `< 768px` 自動改為卡片；`aria-sort`、全選 indeterminate。

## 7. 新增元件的檢查清單
- [ ] Props / Emits 有型別，必要時提供預設值
- [ ] 只使用 CSS 變數，Light / Dark 都看過
- [ ] 鍵盤可操作、focus 可見、必要的 aria
- [ ] 375px 寬度不溢出
- [ ] Loading / Empty / Error 狀態
- [ ] 若為純顯示元件，補上單元測試
