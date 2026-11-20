# DEVELOPMENT_LOG — 開發紀錄

> 依 Phase 記錄實際完成內容、驗收方式與遇到的問題。日期：2026-11-20。

## Phase 1 — 產品企劃 ✅
- 評估 6 個題材，選定「電商 BI」（理由見 PRD 第 1 節），把行銷、使用者行為整合為子分析。
- 完成 PRD、Persona、MoSCoW 優先級、Sitemap、User Flows、指標定義。
- 技術選型與「不用的套件」決策（SYSTEM_ARCHITECTURE 第 1 節）。

## Phase 2 — UI/UX 設計稿 ✅（更新）
- 2026-11-20 補上設計稿：Claude Design canvas（https://claude.ai/artifact/EFWVzdVAhzkxwLZyUXQfCf），
  5 個 Pages、18 個 artboards：Case study、Personas & flows、IA、Design system（foundations + components）、
  Wireframes（desktop / drill-down / edit / mobile）、Hi-fi（Login、Overview light/dark、Drill-down、Data table、Tablet、4 個 Mobile 畫面），
  並包含可點擊原型（Login → Overview → Drill-down；Mobile drawer / data cards）。
- 下方為最初版本紀錄（當時無設計工具可用）。

## Phase 2（原始紀錄）— UI/UX 與 Figma ⚠️ 部分完成
- ✅ 品牌（名稱、Logo SVG、色彩、字體、Icon 系統）、Design Tokens、Light/Dark、UI 規範文件。
- ✅ 圖表色盤以色盲模擬工具驗證（以實際卡片底色 #ffffff / #151a24，全部 PASS；Light 模式 3 色對比 < 3:1 → 以 Legend / Tooltip / Table 檢視緩解）。
- ✅ `design/tokens.json`（Tokens Studio 格式，可匯入 Figma Variables）、`design/reference/` 實際畫面截圖。
- ❌ **Figma 設計稿未建立**：開發環境沒有 Figma 整合（無 API / MCP / 登入），無法產生可編輯的 Figma 檔。
  已撰寫 `FIGMA_GUIDE.md` 逐步說明如何建立 Pages、Variables、Components、Variants、Auto Layout、Prototype。

## Phase 3 — 專案初始化 ✅
- Nuxt 3.21.11、Vue 3.5、TypeScript strict、Pinia 3、ECharts 6、Sass、Zod 4、vuedraggable、ESLint 10、Prettier、Vitest 5、Playwright。
- 問題 1：`npm install` 一次安裝全部套件時 npm 11 arborist 報錯 `Cannot read properties of null (reading 'edgesOut')`（peer 相依解析 bug）。
  → 改為分批安裝（runtime → 型別/工具 → 測試 → ESLint）後成功。
- 問題 2：`@nuxt/eslint` 需要 ESLint 10 → 升級。
- 問題 3（Windows）：在 `e:` 小寫磁碟代號的路徑執行 Vitest 會載入兩份 vitest 模組（`Vitest failed to find the runner`）。
  → 從 `E:\` 大寫路徑執行即正常（README 有註記）。

## Phase 4 — 核心架構 ✅
- SCSS 架構：abstracts（只含變數/函式/mixin，自動注入每個元件）/ base（tokens、reset、typography）/ components / layout / utilities。
- 型別（domain / analytics / api / widgets / drilldown / app）。
- Mock 資料產生器（seeded、因果一致、商業規律）＋ 聚合引擎（Totals → deriveMetrics）。
- Nitro API 15 支，全部 Zod 驗證。
- **驗收**：先寫資料層單元測試（45 個）全部通過，再開始做 UI；產生 800 天資料 ≈ 0.4 秒、一年 overview 查詢 26 ms。

## Phase 5 — Dashboard 與圖表 ✅
- Layout（Sidebar 可收合 / 手機抽屜、Header、Footer）、全域搜尋、通知、使用者選單。
- 全域篩選 store、URL 同步、`useApiQuery`（去重、TTL、競態、SWR）。
- 圖表 option builders（10 種）、`BaseChart`（ResizeObserver、事件）、`ChartCard`（四種狀態 + 表格檢視）。
- **問題**：截圖發現頁面多出 59px 水平捲動 → 原因是隱藏中的 tooltip（`visibility:hidden` 仍佔排版）。改為 `v-show`（display:none）並在靠近邊緣時自動對齊。
- **問題**：圖表字體變成 serif → 原本從 `<html>` 讀 font-family（瀏覽器預設），改讀 `<body>`。

## Phase 6 — 進階資料互動 ✅
- Drill-down：stack store、統一 `DrillView`、9 種層級、3 條流程、圖表類型切換、CSV。
- Widget：registry / store / renderer、draft 編輯、vuedraggable（觸控長按）、鍵盤 ←/→、尺寸、設定 Modal、多組版面、離開確認。
- Light/Dark：CSS 變數 + 圖表同步 + 防閃爍 inline script。

## Phase 7 — 其他頁面 ✅
Analytics、Sales、Users、Reports（列表 / 建立 / 詳細 / CSV / PDF 列印）、Data Table、Settings、Profile、Notifications、Login、Forgot Password、404。

## Phase 8 — RWD 與測試 ✅
- 以 Playwright 實際截圖檢查 1440 / 768 / 375、Light / Dark。
- **E2E 抓到的真實 bug**：編輯模式下 KPI（small）Widget 的工具列比卡片寬，造成水平捲動且第一個刪除按鈕被推出畫面。
  → 工具列改為可換行、small 尺寸隱藏類型文字；並新增 E2E 回歸檢查。
- 修正：軸標籤 `$0.00` → `$0`、KPI 標籤改為兩行截斷、「dayly」錯字、漏斗窄段標籤被截斷、座標軸標籤重疊（`hideOverlap`）、渠道圖改水平長條。
- 結果：見 TEST_REPORT。

## Phase 9 — 部署與作品整理 ✅（部署待使用者執行）
- README、12 份文件、截圖腳本 `scripts/capture-screenshots.mjs`。
- `npm run build` 成功，`node .output/server/index.mjs` 可執行並通過 E2E。
- 正式部署需要使用者自己的 Vercel / Render 帳號（步驟見 README）。

## Phase 10 — 配色、跨瀏覽器、部署準備、繁中化 ✅（2026-11-21）
- **配色**：主色從類 Bootstrap 藍改為「深潟青 Lagoon」＋「番紅花 Saffron」強調色；WCAG 對比與圖表色盲檢查重新驗證（見 UI_UX_GUIDE）。
- **跨瀏覽器**：Playwright 新增 Firefox、WebKit、iPhone 14 project。WebKit 抓到報表頁在手機上水平溢出 65px（grid 子元素預設 `min-width: auto`），已修正。
- **部署準備**：`Dockerfile`（multi-stage、非 root）、`.dockerignore`、GitHub Actions CI（lint → typecheck → test → build → 三瀏覽器 E2E）。實際部署仍需使用者的平台帳號。
- **全站繁體中文（預設）**，與設計稿一致，English 可切換：
  - 共用字串用 `t('key')`（型別安全字典）；只出現一次的頁面文案用 `tt('English', '中文')`，兩種語言寫在同一行，不用在檔案間跳來跳去。
  - 日期、目錄（商品 / 渠道 / 品類 / 地區）、指標名稱的 helper 都吃 `lang` 參數。
  - Mock API 也雙語：client 每個請求自動帶 `lang`；伺服器只翻譯標籤，數字不變。查詢快取以語言分區，切換語言不會拿到另一種語言的快取。
  - 伺服器不能用全域語言變數（多個請求同時進來）。分析 API 明確傳遞 `filter.lang`；鑽取與通知是同步計算，用 `withLang(lang, fn)` 在計算期間設定語言並在 `finally` 還原。
  - 預設 Widget 標題存成空字串，畫面依語言產生（例如「營收趨勢」）；使用者自己輸入的標題不會被翻譯。
  - 問題：用 `String.replace` 自動改檔時，替換字串裡的 `$'` 被當成特殊符號，插入了一段重複程式碼；已修復，之後的腳本改用 `split/join`。
- **部署時區**：Vercel 等平台以 UTC 執行，伺服器的「今天」會比台灣晚 8 小時（台灣 00:00–08:00 今日資料會是空的）。模擬資料改用店家時區 `Asia/Taipei`（`server/mock/db.ts` 的 `storeClock`）。
- 測試：單元 84 / 84、E2E 54 / 54（見 TEST_REPORT）。

## 後續可改進
1. 依 FIGMA_GUIDE 完成 Figma 設計稿並放上連結。
2. 部署並在 README 放上 Demo 網址。
3. 數字格式依語系調整（目前金額固定為 USD、千分位逗號）；考慮改用 `Intl` 與 ICU 複數規則。
4. Widget 自由尺寸（grid-row span、拖曳調整）。
5. 將 Widget / 報表存到後端，跨裝置同步。
6. 加入 Lighthouse CI 與視覺回歸測試。
