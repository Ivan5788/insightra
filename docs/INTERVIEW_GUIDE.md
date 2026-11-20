# INTERVIEW_GUIDE — 面試技術說明

這份文件幫你在面試中**用自己的話**解釋這個專案。每一節都有：要講的重點、對應程式碼位置、可能的追問。
建議先把「3 分鐘介紹」背熟，再依面試官興趣展開。

---

## 0. 3 分鐘專案介紹（範本）

> 「Insightra 是我做的電商 BI 儀表板，技術是 Nuxt 3、Vue 3、TypeScript、Pinia、ECharts 和 SCSS。
> 我有 7 年平面設計背景，所以先從品牌和 Design Token 開始：顏色、字級、間距都是 CSS 變數，Light/Dark 切換只改一個屬性，圖表顏色也讀同一組變數，而且我用色盲模擬工具驗證過圖表色。
>
> 功能上有三個重點：第一，**全域日期篩選**——所有 KPI、圖表、表格都從同一個 Pinia store 的 filter 產生請求，所以數字永遠一致，還會自動跟前一個等長期間比較。第二，**Drill-down**——從月營收點到每日、每個商品、最後到訂單明細，我把它設計成 stack，每一層後端回傳統一格式，所以前端只用一個元件處理九種層級。第三，**可自訂的 Widget 儀表板**——新增、移除、拖曳、調整大小，用 draft 模式編輯，存在 localStorage 並用 Zod 驗證。
>
> 資料是我自己寫的 Mock API，用 Nuxt 的 Nitro 伺服器，以日期當 seed 產生一致的模擬資料，數字之間有因果關係，不是隨機亂數。最後我寫了 72 個單元測試和 18 個 Playwright E2E 測試，包含手機版沒有水平溢出的檢查。」

---

## 1. 架構為什麼這樣分層？
**重點**：pages 組合、components 顯示、composables 取資料、stores 存狀態、services 打 API、utils 純函式。
- 好處：元件不知道資料從哪來 → 換後端只改 `services/`；統計邏輯集中 → 不會兩個地方算出不同數字。
- 程式碼：`docs/SYSTEM_ARCHITECTURE.md` 第 2、3 節。

**追問：composable 和 store 差在哪？**
- Store（Pinia）是**全域單例**，跨頁面共享（篩選條件、Widget 配置）。
- Composable 是**可重用的邏輯**，每次呼叫可以有自己的狀態（`useApiQuery` 每個呼叫各自有 `data/pending/error`）。
- 本專案：`useFilterStore`（全域篩選）＋ `useOverview()`（讀篩選、取資料的邏輯）。

## 2. 資料怎麼從 API 傳到元件？
以 Total Revenue KPI 為例：
1. `DateRangePicker` 呼叫 `filters.setPreset('last30')`（`stores/filters.ts`）
2. `filters.apiFilter`（computed）變成 `{ from, to, ... }`，`filterKey` 跟著變
3. `KpiWidget` 裡的 `useOverview()` 的 key 是 `'overview:' + filterKey` → `watch` 偵測變化 → 呼叫 `analyticsService.overview(filter)`
4. `services/http.ts` 用 `$fetch` 打 `GET /api/analytics/overview?from=…&to=…`
5. 伺服器：Zod 驗證 → `getOverview()` → `rangeTotals()` 加總 → `deriveMetrics()` → `compareMetric()`
6. 回傳 `{ data, meta }` → service 取出 `data` → `useApiQuery` 放進 `data` ref
7. `KpiWidget` 的 computed 取出 `metrics.revenue` → 傳給 `StatCard` 顯示

**追問：6 張 KPI 卡會打 6 次 API 嗎？** 不會。`useApiQuery` 以 key 快取 promise，同 key 共用同一個請求（`composables/useApiQuery.ts`，有單元測試）。

**追問：快速切換日期，舊請求比較慢回來怎麼辦？** 每次請求有遞增的 `requestId`，只有最新的請求能寫入 `data`（race condition 處理，有測試）。

## 3. 日期篩選如何影響全域資料？
- 只有一個來源：`stores/filters.ts`。`range` 由 `resolvePreset(preset, today, customRange)` 算出。
- 比較期間：`previousRange(range)` = 緊接在前、天數相同。30 天 vs 前 30 天。
- 保存：preset 存 localStorage（下次打開沿用）、完整篩選同步到 URL（可分享、上一頁可還原），見 `useFilterUrlSync.ts`。
- 時間粒度 `auto`：≤ 45 天看日、≤ 180 天看週、更長看月（`suggestGranularity`）。

**追問：為什麼日期用字串不用 Date？** `'2026-11-20'` 可直接比較大小、放進 URL / JSON、沒有時區問題；運算時一律轉 UTC，避免夏令時間讓一天變 23 小時（`utils/date.ts`）。

## 4. 成長率的邊界情況
`utils/stats.ts → percentChange`
- 前期 0、本期 0 → 0%；前期 0、本期 > 0 → `null`（顯示 n/a，不是 ∞）
- 負數前期：除以絕對值，-100 → -50 是 +50%（改善）
- 比率型指標的差異用 **pp（百分點）**：轉換率 2.4% → 2.5% 是 +0.1 pp，不是 +4.2%
- 退款率下降是「好事」→ 綠色（`isPositiveChange` 依 `higherIsBetter`）

**追問：為什麼先加總再算比率？** 平均每日轉換率會讓小流量的日子權重過大。正確做法：總訂單 ÷ 總 sessions。`Totals` 只存可加總的值就是為了這點。

## 5. 圖表資料如何轉換？
1. API 回傳業務資料（`TimeSeriesData`）
2. 元件用 computed 呼叫 `trendLineOption({ categories, current, previous, ... }, theme)`（`utils/charts/options.ts`，純函式）
3. `BaseChart` 收到新 option → `chart.setOption(option, { notMerge: true })`
4. 主題切換 → `useChartTheme()` 讀 CSS 變數 → computed 重算 → 圖表重繪

**追問：為什麼 option builder 寫成純函式？** 可測試、可重用（Overview、Analytics、Drill-down 共用）、元件變薄；設計規則（不雙軸、細線、Legend）集中在一處。

**追問：為什麼不用雙 Y 軸？** 兩個刻度的對齊是任意的，會製造假的相關性。多指標比較我改成「以期初 = 100 做指數化」放在同一軸（Analytics 頁）。

## 6. 元件之間如何溝通？
| 方式 | 例子 |
| --- | --- |
| Props down / Events up | `DataTable` emit `sort`，父頁決定排序 |
| v-model（`defineModel`） | `SegmentedControl`、`ToggleSwitch` |
| Slots | `DataTable` 的 `#cell-status`、`ChartCard` 的 `#table` |
| Pinia store | 篩選、Widget、Drill-down stack（跨頁面、跨層級） |
| Promise-based 全域服務 | `const ok = await confirm({...})`（ui store + `ConfirmDialog`） |

## 7. TypeScript 型別設計的目的
- **型別即合約**：`types/analytics.ts` 定義 API 回應，前後端同用；改欄位時編譯器會指出所有受影響的地方。
- **Union types**：`MetricKey`、`WidgetType`、`DrillKind` → 打錯字是編譯錯誤；`Record<WidgetType, Component>` 確保每種 Widget 都有元件。
- **泛型元件**：`DataTable<T>` 的 `rowKey`、slot 的 `row` 都是 `T`。
- **i18n key 型別**：`zhTW: Record<MessageKey, string>` → 漏翻任何 key 都無法編譯。
- **執行期驗證**：TypeScript 只在編譯時有效，所以外部輸入（API query、localStorage）用 Zod 在執行期驗證。
- 全專案 `strict: true`、ESLint 禁止 `any`。

## 8. Nuxt SSR、CSR 與 Hydration
- **SSR**：伺服器產生 HTML → 首屏快、SEO 好 → 瀏覽器 hydrate 接手。
- **CSR / SPA**：瀏覽器下載 JS 後才渲染。
- **Hydration mismatch**：伺服器與瀏覽器渲染結果不同（localStorage 主題、`Date.now()`、隨機數）→ Vue 警告、畫面閃爍。
- **本專案選 SPA（`ssr: false`）**：登入後的後台不需 SEO；個人化設定只存在瀏覽器；ECharts 需要 `window`。仍使用 Nitro 提供 API。
- **如果要 SSR**：圖表包 `<ClientOnly>`、主題改存 cookie、用 `useAsyncData` 在伺服器預取資料。
- 防止主題閃爍：`nuxt.config.ts` 在 `<head>` 放 inline script，在 Vue 啟動前就設定 `data-theme`。

## 9. Drill-down 如何切換層級？
見 `docs/DRILL_DOWN_GUIDE.md` 第 6 節（30 秒版）。關鍵字：**stack、統一 DrillView、row.next、Breadcrumb = stack、Back = pop**。

## 10. Widget 配置如何保存與恢復？
見 `docs/WIDGET_SYSTEM.md` 第 9 節。關鍵字：**registry / config / renderer 分離、draft pattern、陣列順序 = 畫面順序、Zod 驗證、版本化 key、損壞回退**。

## 11. 效能
- ECharts tree-shaking + `LazyBaseChart`（獨立 chunk ~240 KB gzip，不擋首屏）
- 每種 Widget `defineAsyncComponent`
- 請求去重、TTL 快取、stale-while-revalidate
- 伺服器端分頁、搜尋 debounce 300 ms
- `ResizeObserver` + `requestAnimationFrame` 節流圖表 resize
- **誠實補充**：Zod 也打包進前端（用於 localStorage 驗證），若要再瘦身可改成輕量手寫驗證。

## 12. 無障礙
Skip link、focus-visible、Modal/Drawer focus trap、Tabs 方向鍵、Combobox 搜尋、`aria-sort`、`aria-live`、圖表表格檢視、色盲安全配色、不只靠顏色表達漲跌、觸控目標 ≥ 40px、`prefers-reduced-motion`。

## 13. 測試策略
- **單元**：純函式（日期、統計、格式、CSV）、資料一致性（KPI = 時間序列加總 = 表格筆數）、Drill-down 各層加總相符、Store（篩選、Widget）、`useApiQuery`、元件（StatCard、Pagination、DataTable）。
- **E2E**：登入守衛、日期篩選同步 URL 與 KPI、Widget 儲存後重新整理仍在、Drill-down 四層與 Breadcrumb、資料表搜尋 / 排序 / 分頁 / 批次 / CSV、手機版無水平溢出與抽屜導覽。
- 結果見 `docs/TEST_REPORT.md`（實際執行輸出，非估計）。

## 14. 誠實面對的限制（面試官一定會欣賞）
1. **Figma 設計稿尚未完成**：開發環境沒有 Figma 整合；已提供 `design/tokens.json`（可匯入 Figma）與完整建構指南，稿件需自行完成（見 FIGMA_GUIDE）。
2. **資料為模擬**：Mock API，非真實業務資料，介面處處標示。
3. **登入為 Mock**：示範流程，非安全機制。
4. **多語系範圍**：全站繁中（預設）/ English，含圖表、日期與 API 標籤；使用者輸入的內容與 HTTP 錯誤訊息不翻譯（登入頁依狀態碼顯示中文）。
5. **地圖**：以排序長條圖呈現地區分布（設計決策，理由見 UI_UX_GUIDE）。
6. **無正式部署網址**：已驗證 production build 可執行、附 Dockerfile 與 CI workflow，部署需使用者帳號（見 README）；Dockerfile 與 CI 尚未在實際環境跑過。

## 15. 可能的追問與回答提示
| 問題 | 回答方向 |
| --- | --- |
| 如果資料量變成 1000 萬筆？ | 前端不變；後端改成資料倉儲預先聚合（每日 rollup），API 只回傳聚合結果 |
| 怎麼做即時更新？ | `useApiQuery` 加 polling（`setInterval` + refresh）或改用 SSE / WebSocket；篩選邏輯不變 |
| 為什麼不用 UI 套件？ | 展示 Design System 能力；套件會帶入不需要的樣式與體積；但在團隊中我會評估 Headless UI 類方案 |
| localStorage vs 後端存 Widget？ | Demo 用 localStorage；正式應存後端以跨裝置同步，store 的 `persist()` 換成 API 呼叫即可 |
| 怎麼避免 props drilling？ | 跨層狀態用 Pinia；同元件樹可用 provide/inject；本專案主要用 store |
| 為什麼 Reports 不打 API？ | 報表定義是使用者資料，我用相同 async 介面的 repository 存 localStorage，換後端只改 service |

## 16. 多語系常見追問
- **為什麼不用 @nuxtjs/i18n？** 需求只有兩種語言、純 SPA；自寫 `useI18n` ＋ `tt('English','中文')` 不到 100 行，key 有型別檢查，英中寫在同一行比較好維護。語言多於兩種時會改用 vue-i18n 與翻譯檔。
- **切換語言時怎麼讓整站更新？** `app.vue` 用語言當 `NuxtLayout` 的 key，整個版面重建；API 快取的 key 也帶語言，所以會重新抓對應語言的標籤。
- **伺服器怎麼知道語言、會不會互相干擾？** 前端每個請求帶 `lang`。伺服器不使用全域語言變數；同步計算的鑽取與通知用 `withLang(lang, fn)`，因為 JavaScript 同步程式碼不會被別的請求打斷，`finally` 一定還原。單元測試驗證了「同一份資料兩種語言數值相同、標籤不同」。
- **使用者自訂的 Widget 標題會被翻譯嗎？** 不會。預設標題存空字串、畫面依語言產生；使用者輸入的文字原樣保留。
