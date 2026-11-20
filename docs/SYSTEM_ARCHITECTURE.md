# SYSTEM_ARCHITECTURE — 系統架構

## 1. 技術選型與理由

| 技術 | 版本 | 為什麼選它 |
| --- | --- | --- |
| Nuxt 3 | 3.21 | 檔案式路由、自動匯入、內建 Nitro 伺服器（可直接寫 Mock REST API）、部署 preset 多 |
| Vue 3 + `<script setup lang="ts">` | 3.5 | Composition API 讓邏輯可抽成 composable 重用 |
| TypeScript（strict） | 5.9 | API 回應、Widget 設定、Drill-down 層級全部有型別，重構安全 |
| Pinia | 3 | 官方狀態管理；setup store 寫法與 composable 一致、DevTools 支援 |
| ECharts（tree-shaken） | 6 | 圖表種類完整（漏斗、熱力圖、雷達、Gauge）、事件 API（click / datazoom / legend） |
| Sass（SCSS） | 1.108 | `@use` 模組化、mixin（RWD、focus ring）、搭配 CSS 變數做主題 |
| Zod | 4 | 同一套 schema 驗證 API query（伺服器）與 localStorage（瀏覽器） |
| vuedraggable（SortableJS） | 4 | 支援觸控、動畫、v-model 直接改陣列順序；自己寫 DnD 成本高且觸控難 |
| Vitest + Vue Test Utils | 5 | 與 Vite 同設定、速度快 |
| Playwright | 1.65 | 跨瀏覽器 E2E、可測 mobile viewport、下載檔案 |
| ESLint（@nuxt/eslint）+ Prettier | 10 / 3 | 程式碼品質與格式一致 |

**刻意不用的套件**：UI 元件庫（為了展示自建 Design System）、axios（Nuxt 內建 `$fetch`）、
date-fns / dayjs（日期需求簡單，自寫 `utils/date.ts` 並有完整測試）、jsPDF（用瀏覽器列印產生 PDF，零 bundle 成本）、
@nuxtjs/i18n（自寫型別安全的 `useI18n` ＋ `utils/locale.ts`，見下方「多語系」）。

## 2. 分層架構

```
┌──────────────────────────── Browser (SPA) ────────────────────────────┐
│ pages/            路由頁面（組合元件，不放商業邏輯）                     │
│ components/       UI 元件（common / layout / charts / tables / widgets） │
│ composables/      useOverview、useDrillDown、useWidgetManager …          │
│ stores/ (Pinia)   filters（全域篩選）、dashboard、drilldown、settings …   │
│ services/         analytics / orders / drilldown / reports / auth        │
│ utils/            date、stats、format、csv、storage、charts/options      │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTP (JSON, $fetch)   GET /api/...
┌──────────────────────────────▼─────────── Nitro server ────────────────┐
│ server/api/*      路由：Zod 驗證 query → 呼叫 utils → 回傳 {data, meta}  │
│ server/utils/     analytics.ts（聚合引擎）、drilldown.ts、users.ts …     │
│ server/mock/      generator.ts（seeded 模擬資料）、db.ts（記憶體快取）    │
└────────────────────────────────────────────────────────────────────────┘
```

**原則**：元件只負責顯示；資料怎麼來（services）、怎麼算（server/utils、utils/stats）、怎麼存（stores）分開。

## 3. 資料流（從 API 到畫面）

```
API / Mock Data            server/mock/generator.ts      每天的流量、訂單、顧客（seeded）
→ Data Transformation      server/utils/analytics.ts     dayTotals() → Totals（可加總的數值）
→ Statistics Calculation   deriveMetrics() + utils/stats  AOV、轉換率、成長率（compareMetric）
→ HTTP                     GET /api/analytics/overview    { data, meta: { mock: true } }
→ Service                  services/analytics.service.ts  解包 data、型別化
→ Pinia / Composables      useOverview() + useApiQuery()   快取、去重、競態處理
→ Dashboard Components     KpiWidget.vue                   computed 取出要顯示的指標
→ Charts / Tables / KPI    StatCard / BaseChart / DataTable
```

### 為什麼「先加總、再算比率」
`Totals` 只放可相加的值（營收、訂單數、sessions…）。AOV、轉換率等比率是在**加總後**才計算。
若先算每日轉換率再平均，會得到錯誤答案（流量大的日子權重被低估）。這是資料處理正確性的關鍵。

## 4. 全域篩選與跨元件同步

```
DateRangePicker / FilterPanel
        │ setPreset() / setSegments()
        ▼
stores/filters.ts ── computed: range、comparisonRange、apiFilter、filterKey
        │
        ├─► useOverview()        key = 'overview:' + filterKey
        ├─► useTimeSeries()      key = 'timeseries:' + granularity + filterKey
        ├─► useBreakdown(...)    key = 'breakdown:' + dimension + metric + filterKey
        └─► useRecentOrders()    …
```
- 每個查詢的 **cache key 包含 filterKey**；篩選改變 → key 改變 → `useApiQuery` 的 `watch` 自動重新請求。
- 所有元件用**同一個 `apiFilter`**，所以 KPI、圖表、表格永遠一致。
- 同一 key 的請求只發一次（6 張 KPI 卡 = 1 個請求）。

### 篩選條件保存
| 資料 | 存放 | 原因 |
| --- | --- | --- |
| 日期 preset、自訂區間、粒度、比較開關 | localStorage | 下次開啟仍是使用者習慣的期間 |
| 日期＋渠道/品類/地區 | URL query（`?range=last30&channel=email`） | 可分享連結、瀏覽器上一頁可還原 |
| Data Table 的搜尋、排序、分頁 | URL query | 重新整理不會遺失 |
| 主題、語言、欄位顯示 | localStorage（settings） | 使用者偏好 |

## 5. SSR vs CSR 與 Hydration

| | SSR（伺服器渲染） | CSR / SPA（本專案） |
| --- | --- | --- |
| 首屏 HTML | 伺服器產生完整 HTML | 空殼 HTML，JS 執行後渲染 |
| SEO | 好 | 差（但後台不需要） |
| Hydration | 需要：瀏覽器把 HTML「接手」成 Vue app | 不需要 |
| 風險 | 伺服器與瀏覽器輸出不一致 → hydration mismatch | 無此問題 |

**決策：`ssr: false`（SPA）**，理由：
1. 所有頁面在登入後，SEO 沒有價值。
2. 個人化資料（主題、Widget 配置）存在 localStorage，伺服器讀不到 → 若 SSR，伺服器輸出預設值、瀏覽器輸出使用者設定 → **hydration mismatch** 與畫面閃爍。
3. ECharts 需要 `window` 與 canvas，只能在瀏覽器執行。

**Hydration mismatch 是什麼？** SSR 時伺服器先輸出 HTML，瀏覽器再用 Vue 「接手」（hydrate）。若兩邊算出的 DOM 不同（例如伺服器不知道使用者選了 Dark mode、`new Date()` 時間不同、`Math.random()`），Vue 會警告並重新渲染，造成閃爍。
在 SSR 專案中的解法：`<ClientOnly>` 包住只能在瀏覽器渲染的元件、用 cookie 而不是 localStorage 存主題、避免在 render 中使用隨機值。
本專案仍保留 SSR 思維：`BaseChart` 只在 `onMounted` 才初始化 ECharts；主題用 `<head>` 內的 inline script 在 Vue 啟動前套用，避免閃爍（FOUC）。

## 6. 效能策略
- **Code splitting**：`<LazyBaseChart>` 讓 ECharts（~240 KB gzip）獨立成 chunk；每種 Widget 用 `defineAsyncComponent` 分割。
- **Tree-shaking**：`utils/charts/echarts.ts` 只註冊用到的圖表與元件。
- **請求去重與快取**：`useApiQuery` 共用 promise、60 秒 TTL、失敗不快取。
- **Stale-while-revalidate**：切換篩選時保留舊資料並顯示小 spinner，不閃 skeleton。
- **Debounce**：搜尋框 300 ms。
- **伺服器端分頁**：訂單表只傳當頁 20 筆，不把 6 萬筆送到瀏覽器。
- **computed**：衍生資料（圖表 option）只在依賴改變時重算。
- **ResizeObserver + rAF**：容器尺寸改變才 `chart.resize()`。

## 7. 安全與限制（誠實說明）
- 登入是 **Mock**：任何人知道 demo 帳密即可登入；token 存 localStorage 僅為展示。正式環境應使用 httpOnly Secure cookie，並在 API 驗證 session。
- 路由守衛（middleware）只是 UX，不是安全邊界。
- API query 全部經 Zod 驗證（日期格式、enum、長度、範圍上限 800 天）。
- CSV 匯出防止公式注入（`=`, `+`, `-`, `@` 開頭加 `'`）。
- 模板不使用 `v-html`（ESLint 規則禁止）→ 降低 XSS 風險。

## 8. 部署
- `npm run build` 產生 `.output/`（Nitro node-server）。`node .output/server/index.mjs` 即可執行（含 Mock API）。
- 可部署到 Vercel / Netlify / Render / Railway（Nitro 自動偵測 preset）。
- 純靜態主機（GitHub Pages）**不適用**，因為 Mock API 需要 Nitro 伺服器。
- 串接正式後端：設定 `NUXT_PUBLIC_API_BASE=https://api.example.com`，前端 services 就會改打外部 API（回應格式需符合 `docs/API_DOCUMENTATION.md`）。

## 9. 目錄結構（實際）
```
insightra/
├── assets/scss/        abstracts / base / components / layout / utilities / main.scss
├── components/         common / layout / charts / tables / widgets / dashboard / forms
├── composables/        useApiQuery、useAnalytics、useDrillDown、useWidgetManager、useDashboard、useDateFilter …
├── data/               catalog、widget-registry、navigation、icons、report-options
├── design/             tokens.json（Figma Tokens Studio）、reference/（畫面截圖）
├── docs/               12 份文件
├── layouts/            default、auth
├── locales/            en、zh-TW
├── middleware/         auth.global.ts
├── pages/              index、analytics、sales、users、reports、data、settings、profile、notifications、auth
├── plugins/            theme.client.ts
├── server/             api/、mock/、utils/
├── services/           http、analytics、orders、drilldown、reports、auth
├── stores/             filters、dashboard、drilldown、settings、auth、notifications、reports、ui、orderFlags
├── tests/              unit/（Vitest）、e2e/（Playwright）
├── types/              domain、analytics、api、widgets、drilldown、app、table、charts
└── utils/              date、stats、format、metrics、csv、storage、id、charts/
```

## 多語系（繁體中文預設 / English）

| 層 | 做法 |
| --- | --- |
| 語言狀態 | `settings.locale`（預設 `zh-TW`，存 localStorage）。`plugins/theme.client.ts` 監看它，呼叫 `setLang()`、設定 `<html lang>`。 |
| 重新渲染 | `app.vue` 以語言當 `NuxtLayout` 的 `key`：切換時整個版面重建，所有 `tt()` / 日期格式重新計算，不必每個元件各自監聽。 |
| 介面文字 | 共用字串：`t('nav.sales')`（`locales/*.ts`，key 有型別檢查）。單一頁面文案：`tt('English', '中文', { n })`。 |
| 純函式 helper | `utils/date.ts`、`data/catalog.ts`、`utils/metrics.ts` 都接受 `lang` 參數，預設讀 `getLang()`；單元測試不需要 Pinia。 |
| API | `services/http.ts` 每個 GET 自動加 `lang`；Zod schema 驗證 `lang`（`en` / `zh-TW`，預設 `en`）。只有標籤會變，數值完全相同（有單元測試保證）。 |
| 快取 | `useApiQuery` 的 key 前面加上語言（`setQueryScope`），避免切換後顯示另一種語言的快取。 |
| 伺服器並行安全 | 伺服器**不**呼叫 `setLang()`。分析 / 使用者 / 訂單 API 明確傳 `filter.lang`；鑽取與通知用 `withLang(lang, fn)`：只包同步函式，執行期間不會有別的請求插進來，`finally` 一定還原。 |
| 不翻譯的內容 | 使用者輸入（自訂標題、儀表板名稱、已儲存報表）、顧客姓名、訂單編號、HTTP 錯誤訊息（reason phrase 必須是 ASCII；登入頁依狀態碼顯示中文訊息）。 |
