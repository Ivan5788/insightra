# TEST_REPORT — 測試紀錄

> 執行日期：2026-11-21 · 環境：Windows 11、Node 22.14、Playwright 1.65（Chromium / Firefox / WebKit）
> 以下皆為**實際執行結果**，未經修飾或估算。

## 1. 總覽

| 檢查 | 指令 | 結果 |
| --- | --- | --- |
| ESLint | `npm run lint` | ✅ 0 errors / 0 warnings |
| TypeScript（vue-tsc） | `npm run typecheck` | ✅ 0 errors |
| 單元測試（Vitest） | `npm test` | ✅ **84 / 84 passed**（10 files，約 2 s） |
| Production build | `npm run build` | ✅ 成功 |
| E2E（Playwright，對 production build） | `npm run test:e2e` | ✅ **58 / 58 passed**（6 個 project，約 66 s） |

## 2. 單元測試明細

| 檔案 | 測試數 | 內容 |
| --- | --- | --- |
| `date.test.ts` | 13 | ISO 日期驗證、跨月/閏年加減、週一起算、8 種 preset、自訂區間正規化、前期計算、粒度建議 |
| `stats.test.ts` | 13 | 成長率（零值、空值、負數）、compareMetric 方向、好壞判斷（退款率）、加總/平均/安全除法、序列摘要、指數化、貨幣與百分比格式 |
| `analytics.test.ts` | 15 | 產生器確定性、漏斗 = 訂單、訂單參照存在的顧客、11.11 高峰；每日序列加總 = 期間總計、週粒度 = 日粒度、KPI 訂單數 = 訂單表筆數、渠道/品類占比加總、品類篩選停用流量指標、漏斗末階 = 訂單數；訂單排序/篩選/分頁/搜尋；總使用者成長 = 新使用者、留存 cohort |
| `drilldown.test.ts` | 6 | 月 = 日加總、日 = 商品加總、商品訂單 = 商品營收、圖表與列對應、品類商品歸屬與加總、渠道漏斗 |
| `dashboard-store.test.ts` | 8 | 預設版面、草稿與儲存、取消、排序/隱藏/尺寸限制、隱藏不顯示、重新載入還原、損壞資料回退、版面複製與刪除保護 |
| `filter-store.test.ts` | 5 | preset → 區間與前期、API filter 含分群、反向自訂區間、日期偏好持久化、cache key 變化 |
| `use-api-query.test.ts` | 4 | 請求去重、key 改變重抓與忽略過期回應、錯誤與不快取失敗、null key 停用 |
| `components.test.ts` | 8 | StatCard（格式、成長、退款率反向顏色、不可用說明）、Pagination（摘要、事件、停用）、DataTable（排序事件、aria-sort、全選）、CSV 跳脫與公式注入 |
| `store-clock.test.ts` | 2 | 伺服器在 UTC（例如 Vercel）時，模擬資料的「今天」仍以台北時間計算（含午夜邊界） |
| `i18n.test.ts` | 10 | `tt` 語言選擇與 `{參數}`、`withLang` 執行後（含拋錯）還原語言、繁中日期格式、目錄標籤翻譯與後備、Widget 自動標題（雙語、保留使用者輸入）、API 標籤隨語言變但數值相同（breakdown、漏斗、鑽取）、通知 id 在兩種語言相同（已讀狀態不會因切換語言消失） |

## 3. E2E 明細（`tests/e2e`）

| Project | 裝置 / 引擎 | 跑哪些 spec | 結果 |
| --- | --- | --- | --- |
| desktop-chromium | Desktop Chrome | 除 responsive 外全部（16） | 16 passed |
| desktop-firefox | Desktop Firefox | 同上（16） | 16 passed |
| desktop-webkit | Desktop Safari（WebKit） | 同上（16） | 16 passed |
| mobile-chromium | Pixel 7 | responsive（5） | 5 passed |
| mobile-webkit | iPhone 14（WebKit） | responsive（5） | 5 passed |
| **合計** | | | **58 passed** |

E2E 斷言使用預設語言（繁體中文）的畫面文字。

| Spec | 案例 |
| --- | --- |
| `auth.spec.ts` | 未登入導向登入頁（帶 redirect）· 錯誤密碼提示 · 登入後回到原頁 · 404 頁 |
| `dashboard.spec.ts` | KPI / 圖表 / 模擬資料標示 · 切換日期 → KPI 改變且 URL 更新 · 移除＋新增 Widget → 儲存 → 重新整理仍保留 · 取消還原（含「編輯模式無水平捲動」回歸檢查）· Dark mode 套用並記住 |
| `drilldown.spec.ts` | 營收四層鑽取 + Back + Breadcrumb 回第一層 · 渠道流程顯示漏斗 |
| `data-table.spec.ts` | 依訂單編號搜尋（URL 同步、1 筆）· 依金額排序 + 分頁 · 全選 → 批次標記 · CSV 下載檔名 |
| `responsive.spec.ts`（Pixel 7、iPhone 14） | 8 個主要頁面無水平溢出 · 漢堡選單抽屜導覽 · 資料表切換為卡片 · 320px 寬時所有下拉選單都在畫面內 · 回到頂部按鈕 |
| `i18n.spec.ts` | 預設繁中（`<html lang="zh-Hant-TW">`）→ 設定頁切換 English → 標題變英文、仍停在同一個分頁、KPI 數字不變、鑽取面板（API 標籤）為英文、重新整理後保留選擇 |

## 4. 測試過程中發現並修正的問題
| 問題 | 發現方式 | 修正 |
| --- | --- | --- |
| 隱藏的 tooltip 造成 59px 水平捲動 | Playwright 量測 `scrollWidth` | tooltip 改 `v-show` + 邊緣自動對齊 |
| 編輯模式 KPI 工具列超出卡片、刪除鈕被推出畫面 | E2E 點擊逾時 → 截圖 | 工具列換行；新增回歸斷言 |
| 圖表字型為 serif | 截圖目視 | 改讀 `<body>` 字型 |
| 座標軸 `$0.00`、標籤重疊、漏斗標籤截斷、「dayly」 | 截圖目視 | 格式化與 option 調整 |
| E2E 在 grid 尚未渲染時計數 | E2E 失敗 | 先等待第一個 Widget 可見 |
| iPhone（WebKit）報表頁水平溢出 65px | 新增 mobile-webkit project 後 responsive 測試失敗 | 手機卡片改 `minmax(0, 1fr)` ＋ `min-width: 0`，長標題可截斷 |
| 切換語言後設定頁跳回第一個分頁 | 撰寫 i18n E2E 時發現 | 分頁狀態同步到 URL（`?tab=`） |
| 鑽取每日表格出現兩個「日期」欄 | 繁中截圖目視 | 星期欄改為「星期」 |
| 手機版下拉選單超出畫面左側（320px 寬：篩選 −202px、通知 −36px、欄位 −58px） | 使用者回報 → Playwright 量測選單位置 | `BaseDropdown` 開啟後量測位置，水平位移到距畫面邊緣至少 12px；新增回歸測試 |
| 通知選單「Mark all as read」未翻譯 | 手機截圖目視 | 改用 `tt()` |
| CI 的 E2E 拿不到 build 結果 | GitHub Actions 失敗訊息 | `upload-artifact` 預設略過以點開頭的 `.output`，加上 `include-hidden-files` |

## 5. RWD 檢查（實際截圖）
`design/reference/` 中的截圖由 `scripts/capture-screenshots.mjs` 對 production build 擷取：
Desktop 1440（Light / Dark、Analytics、Sales、Data、Drill-down、編輯模式、登入）、Tablet 768、Mobile 375（Light / Dark）。
人工確認：無水平溢出、KPI 依寬度重排（6 → 3 → 2 欄）、Sidebar 在 < 1024 轉為抽屜、表格在 < 768 轉為卡片、觸控目標 ≥ 40px。

## 6. 效能量測（實測）
| 項目 | 數值 |
| --- | --- |
| 產生 800 天模擬資料 | ≈ 390 ms（約 68,800 訂單、50,300 顧客；伺服器快取，每小時重建） |
| `overview` 一年期間（伺服器計算） | ≈ 26 ms |
| API 回應（本機 dev，30 天期間） | 4 – 22 ms |
| 最大 JS chunk（ECharts，延遲載入） | 716 KB raw / ≈ 242 KB gzip |
| 主要 entry chunk | 343 KB raw / ≈ 121 KB gzip |
| 伺服器輸出總計 | 2.8 MB（683 KB gzip） |

未執行 Lighthouse 量測（未在此報告中宣稱分數）。

## 7. 瀏覽器相容性
- 自動化測試：Chromium、Firefox、WebKit（桌機），Pixel 7（Chromium）、iPhone 14（WebKit）模擬，全部通過（見第 3 節）。
- WebKit 是 Safari 的引擎，但 Playwright 的 WebKit 不等於實機 Safari / iOS；**未在實機上測試**。

## 8. 已知限制
- Vitest 5.1.1 在 Windows 以小寫磁碟代號（`e:\`）路徑執行，或使用檔名篩選時，可能出現 `Vitest failed to find the runner`；從 `E:\` 執行完整測試即正常。
- 「今天」只包含已經過的小時數，所以趨勢圖最後一點偏低是預期行為（與 Google Analytics 相同）。
