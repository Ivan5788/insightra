# PRD — Insightra 產品需求文件

> 版本 1.0 · 2026-11-20 · 狀態：已實作（作品集專案，資料為模擬資料）

## 1. 產品定位

**Insightra** 是一套給中小型電商品牌使用的 **Business Intelligence & Analytics SaaS**。
它把「訂單、流量、顧客」三種原始資料整合成同一個儀表板，讓管理者不用匯出 Excel 就能回答：

- 這段期間賣得好不好？跟上一期比呢？
- 營收是從哪個渠道、哪個品類、哪個市場來的？
- 某一天營收暴增（例如 11.11），是哪些商品、哪些訂單造成的？
- 哪個行銷渠道帶來的流量轉換率最好？
- 新顧客有沒有回購？

### 為什麼選「電商銷售分析」題材（而不是把所有題材混在一起）
| 考量 | 說明 |
| --- | --- |
| 資料關聯性強 | 流量 → 漏斗 → 訂單 → 商品 → 顧客，天然形成可鑽取（drill-down）的階層 |
| 圖表種類合理 | 時間序列、占比、排行、漏斗、熱力圖、留存 cohort 都有真實情境，不必硬湊 |
| 面試官容易理解 | 每個人都懂「營收、訂單、轉換率」，能專注在前端實作 |
| 可展示資料處理能力 | 期間比較、比率指標的正確計算、零值處理 |

行銷、使用者行為、財務不另開題材，而是**作為電商分析的一部分**（流量渠道、漏斗、留存）。

## 2. 目標使用者（Personas）

| Persona | 角色 | 主要任務 | 痛點 |
| --- | --- | --- | --- |
| Alex — 電商主管 | Head of E-commerce | 每週看 KPI、向老闆報告 | 數字散在多個後台，比較期間要手算 |
| Jamie — 行銷專員 | Growth Marketer | 比較渠道成效、找轉換瓶頸 | 不知道哪個渠道的流量「品質」最好 |
| Sam — 營運分析 | Ops Analyst | 查異常、匯出明細 | 從總數追到單筆訂單要跨好幾個系統 |

情境虛構公司：**Aurora Living Co.**（亞太區生活風格電商，6 大品類、39 項商品、7 個市場）。

## 3. 功能需求與優先級（MoSCoW）

| # | 功能 | 優先級 | 狀態 |
| --- | --- | --- | --- |
| F1 | 全域日期篩選（8 種 preset + 自訂）並同步所有元件 | Must | ✅ |
| F2 | 與「前一個等長期間」比較（目前 / 前期 / 差異 / 成長率） | Must | ✅ |
| F3 | Overview 6 個 KPI + 趨勢 / 占比 / 排行 / 交易 / 活動 | Must | ✅ |
| F4 | 三條 Drill-down 流程（營收、品類、渠道） | Must | ✅ |
| F5 | Widget 管理：新增、移除、隱藏、拖曳、尺寸、儲存、還原、多組配置 | Must | ✅ |
| F6 | Light / Dark Mode（含圖表）並記住設定 | Must | ✅ |
| F7 | Data Table：搜尋、篩選、排序、分頁、欄位顯示、多選、批次、CSV | Must | ✅ |
| F8 | RWD（Desktop / Tablet / Mobile） | Must | ✅ |
| F9 | Analytics：指標切換、時間維度、縮放、Legend、多指標比較、匯出 | Should | ✅ |
| F10 | Sales / Users 頁 | Should | ✅ |
| F11 | Reports：列表、建立、詳細、CSV、PDF（列印） | Should | ✅ |
| F12 | 通知中心、全域搜尋、Toast、確認 Modal | Should | ✅ |
| F13 | 渠道 / 品類 / 地區分群篩選 | Could | ✅ |
| F14 | 語系切換（繁中預設 / EN） | Could | ✅（全站，含圖表、日期、API 標籤） |
| F15 | 真實後端、登入權限、多使用者協作 | Won't（本版） | — |

## 4. Sitemap

```
/auth/login ──► /auth/forgot-password
/  Overview（Widget 儀表板）
├── /analytics      數據分析
├── /sales          銷售管理
├── /users          使用者分析
├── /reports        報表列表 ──► /reports/:id 報表詳細
├── /data           資料表格（訂單）
├── /notifications  通知中心
├── /settings       系統設定（Profile / Preferences / Notifications / System）
├── /profile        個人資料
└── 404             錯誤頁
＋ 全域 Drill-down Drawer（任何頁面都可開啟）
```

## 5. 核心 User Flows

### 5.1 查看期間表現
登入 → Overview → 日期選「Last 30 days」→ KPI / 圖表 / 表格同步更新 → 看 KPI 上的成長率與前期數值。

### 5.2 追查營收異常（Drill-down）
Overview 營收趨勢點擊 11/11 → Drawer 開到「Nov 2026 每日營收」→ 點 Nov 11 → 商品營收 → 點商品 → 該日訂單明細 → 用 Breadcrumb 回到月份。

### 5.3 自訂儀表板
Edit dashboard → 移除不需要的 Widget → Add widget → 拖曳排序 / 調整尺寸 → Save layout → 重新整理仍保留。

### 5.4 匯出明細
Data Table → 搜尋 / 狀態篩選 → 多選 → Export selected（或 Export CSV 全部符合條件的資料）。

## 6. 指標定義（避免歧義）

| 指標 | 公式 |
| --- | --- |
| Total Revenue | 已完成＋處理中訂單的商品金額（排除退款、取消） |
| Total Orders | 期間內所有下單數（含退款、取消） |
| Active Users | 期間內「每日活躍使用者」的平均（DAU） |
| Conversion Rate | 訂單數 ÷ Sessions × 100（套用商品/品類/地區篩選時不提供） |
| AOV | 營收 ÷ 產生營收的訂單數 |
| Revenue Growth | 本期營收 vs 前期營收的 %；比較值為「成長率的變化（pp）」 |
| Refund Rate | 退款訂單 ÷ 全部訂單 × 100（越低越好） |

## 7. 非功能需求
- **誠實**：所有畫面標示「Simulated data」；不宣稱即時真實資料。
- **效能**：API 回應 < 50 ms（實測 4–22 ms）；ECharts 依需求載入。
- **無障礙**：鍵盤可操作、focus 可見、ARIA、圖表提供表格替代檢視、色彩通過 CVD 檢查。
- **可維護**：TypeScript strict、無 `any`、ESLint / Prettier、單元與 E2E 測試。

## 8. 成功指標（若為真實產品）
- 週活躍管理者比例 > 70%
- 「從 KPI 找到原因」平均點擊數 ≤ 4（Drill-down 設計目標）
- 匯出 Excel 的次數下降（代表儀表板已能回答問題）
