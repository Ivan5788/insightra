# DRILL_DOWN_GUIDE — 資料鑽取功能說明

## 1. 三條鑽取流程

| 流程 | 層級 | 入口 |
| --- | --- | --- |
| **營收** | ① 近 12 個月營收 → ② 該月每日營收 → ③ 該日各商品營收 → ④ 該商品當日訂單明細 | KPI「Total Revenue」的圖層 icon、營收趨勢圖點擊、Orders 長條圖點擊某天、Analytics「Revenue」卡 |
| **商品分類** | ① 各品類營收 → ② 該品類商品排行 → ③ 商品銷售詳情（KPI、趨勢、渠道、最近訂單） | Sales 品類堆疊圖 / 甜甜圈、Top products 列、Ranking widget、全域搜尋商品 |
| **使用者來源** | ① 各渠道（sessions、DAU、訂單、轉換率、營收、AOV）→ ② 渠道詳情（漏斗、步驟轉換率、每日 sessions & orders、客群） | Users 來源甜甜圈、Sales 渠道長條圖、Donut / Bar widget（channel）、Analytics「Acquisition channels」卡 |

圖表點擊可以**直接跳到深層**：在營收趨勢上點 11/11，抽屜會開在第 3 層，但 Breadcrumb 仍是
`Revenue by month › Nov 2026 › Nov 11`，可隨時往上一層。

## 2. 架構：為什麼只需要「一個」元件

```
            useDrillDown().openRevenueDay('2026-11-11')
                              │ start([level1, level2, level3])
                              ▼
 stores/drilldown.ts  stack: DrillLevel[]   current = 最後一個
                              │
                              ▼  key = 'drill:' + JSON.stringify(current)
 DrillDownPanel.vue ──useApiQuery──► GET /api/drilldown?kind=revenue-products&day=2026-11-11
                              │
                              ▼  DrillView（統一格式）
 DrillDownView.vue   篩選 chips · KPI · 圖表（可切換類型 / 多圖 tabs）· 明細表
                              │  點擊列或圖表點 → row.next
                              ▼
                     drill.push(row.next)  → 重新查詢下一層
```

### 核心型別（`types/drilldown.ts`）
```ts
interface DrillLevel { kind: DrillKind; label: string; params: DrillParams }

interface DrillView {
  kind: DrillKind
  title: string; subtitle: string
  filters: { label: string; value: string }[]   // 目前篩選條件
  kpis: DrillKpi[]                               // 相關統計
  charts: DrillChart[]                           // 可多張（tabs），每張可切換 bar/line/pie
  columns: DrillColumn[]
  rows: DrillRow[]                               // row.next = 下一層（可選）
  nextHint?: string                              // 「Click a day to see products」
}

interface DrillChart {
  type: 'bar' | 'line' | 'pie' | 'funnel'
  allowedTypes: DrillChartType[]
  categories: string[]
  series: { name: string; data: number[] }[]
  linkedToRows: boolean   // categories[i] ↔ rows[i]，點圖 = 點列
}
```

**關鍵設計**：每一層都回傳同樣形狀的 `DrillView`，且「下一層要去哪」由資料（`row.next`）決定，而不是寫死在元件裡。
因此：
- 前端只有 `DrillDownPanel` + `DrillDownView` 兩個元件，處理所有 9 種層級。
- 新增一條鑽取流程 = 在 `server/utils/drilldown.ts` 加一個 builder 函式，前端**不用改**。

### Stack 操作（`stores/drilldown.ts`）
| 方法 | 用途 |
| --- | --- |
| `start(levels)` | 從任意深度開啟 |
| `push(level)` | 往下一層 |
| `back()` | 返回上一層（Back 按鈕） |
| `goTo(index)` | Breadcrumb 點擊（丟棄之後的層級） |
| `close()` | 關閉抽屜（保留 stack，再開時不會重算） |

## 3. 介面要求對照
| 要求 | 實作 |
| --- | --- |
| Breadcrumb | Drawer 標題下方，最後一項 `aria-current="page"` |
| 返回上一層 | 「Back」按鈕（第 2 層以上） |
| 當前分析層級 | 「LEVEL 2 · DRILL-DOWN」 |
| 當前篩選條件 | 篩選 chips（Period、Month、Day、Product、Category、Channel） |
| 詳細資料表格 | 可點擊列（滑鼠 / 鍵盤按鈕）、CSV 匯出 |
| 相關統計 KPI | 每層 3–6 個 KPI |
| 圖表切換 | Bar ↔ Line ↔ Pie；渠道詳情有 Funnel / Trend / Segment 三張圖 tabs |

## 4. ECharts 事件
| 事件 | 用途 |
| --- | --- |
| `click` | 鑽取：以 `dataIndex` 對應 `rows[i]`；Pie 因有「Other」合併，改用名稱比對 |
| `datazoom` | Analytics 趨勢圖顯示「Zoomed in」狀態；資料點 > 31/40 時自動加入縮放滑桿 |
| `legendselectchanged` | Analytics 顯示目前被隱藏的系列 |
| `tooltip` | 每張圖都有；趨勢圖同時顯示本期、前期與變化 % |

## 5. 資料正確性（有測試保證）
`tests/unit/drilldown.test.ts`：
- 月營收 = 該月每日營收加總
- 某日營收 = 該日各商品營收加總
- 商品當日訂單金額（completed + pending）= 該商品當日營收
- 品類下商品營收加總 = 品類營收；商品只屬於該品類
- 渠道詳情漏斗最後一階 = 該渠道訂單數
- 圖表 categories 數量 = 表格列數（點擊對應正確）

## 6. 面試時怎麼講（30 秒版）
「Drill-down 我把它當成一個 stack：每一層是一個 `{kind, params}`。抽屜永遠只渲染 stack 最上面那一層，
資料由同一支 `/api/drilldown` 回傳統一格式的 `DrillView`，每一列自帶下一層的參數。
所以 Breadcrumb 就是 stack，返回就是 pop，新增流程只要加一個後端 builder，前端完全不用動。」
