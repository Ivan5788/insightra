# DATA_STRUCTURE — 資料結構

> ⚠️ 所有資料都是 `server/mock/generator.ts` 產生的**模擬資料**，不是真實商業資料。

## 1. 為什麼這份模擬資料「可信」
多數 Dashboard 作品的問題是：每張圖各自 `Math.random()`，KPI 與圖表互相矛盾。本專案：

1. **只有一份資料來源**：先產生「原始資料」（每日流量、訂單、訂單明細、顧客），所有統計都從它計算。
2. **Seeded random**：每一天用日期字串當 seed（`mulberry32(hash('insightra|2026-11-11'))`），同一天永遠產生同樣的資料 → 重新整理數字不變、測試可重現。
3. **因果一致**：每個渠道的訂單數 = 該渠道漏斗的 purchases → 轉換率永遠合理；每筆訂單都指向真實存在的商品與顧客。
4. **有商業規律可分析**：年成長約 15%、週末高峰、11–12 月旺季、6.18 / 11.11 / Black Friday / 12.12 檔期、午餐與晚間下單高峰、近 3 天的訂單多為 pending。

規模（以 2026-11-20 為例）：約 800 天、≈ 69,000 筆訂單、≈ 50,000 位顧客、39 項商品；產生耗時約 0.4 秒（伺服器啟動後快取，每小時重建一次讓「今天」持續累積）。

## 2. 主檔（Master data）— `data/catalog.ts`
前後端共用，確保標籤一致。

| 實體 | 欄位 | 數量 |
| --- | --- | --- |
| Channel | `id`（organic / paid / social / email / direct / referral）、`label` | 6 |
| Category | `id`（electronics / home / fashion / beauty / sports / books）、`label` | 6 |
| Region | `id`（tw / jp / hk / sg / my / au / us）、`label` | 7 |
| Segment | standard / plus / vip | 3 |
| Product | `id`、`name`、`category`、`price`（USD）、`weight`（熱銷權重） | 39 |

## 3. 原始資料（Domain）— `types/domain.ts`

```ts
interface Order {
  id: string            // 'ORD-261111-0042'（日期 + 當日序號）
  date: ISODate         // '2026-11-11'
  hour: number          // 0–23
  customerId: string
  channel: ChannelId
  region: RegionId
  status: 'completed' | 'pending' | 'refunded' | 'cancelled'
  isNewCustomer: boolean
  lines: { productId: string; quantity: number; unitPrice: number }[]
}

interface Customer {
  id: string; name: string; signupDate: ISODate
  channel: ChannelId; region: RegionId; segment: 'standard' | 'plus' | 'vip'
}

interface ChannelTraffic {   // 每天 × 每個渠道
  sessions: number; activeUsers: number
  productViews: number; addToCart: number; checkout: number; purchases: number
}
```

伺服器記憶體中的結構（`server/mock/generator.ts → Dataset`）：
```ts
interface Dataset {
  days: Map<ISODate, { traffic: Record<ChannelId, ChannelTraffic>; signups: string[]; orders: Order[] }>
  customers: Map<string, Customer>
  orders: Map<string, Order>
  customerOrderMonths: Map<string, Set<'YYYY-MM'>>   // 留存分析用索引
  firstOrderMonth: Map<string, 'YYYY-MM'>            // cohort 分群用
}
```
用 `Map` 依日期索引：查詢某一段期間只需迭代那些日期，不必掃描全部 69,000 筆訂單。

## 4. 統計中介結構 — `Totals`
```ts
interface Totals {           // 只放「可以相加」的值
  revenue; orders; revenueOrders; units; refunded; newCustomers
  sessions; activeUsersSum; productViews; addToCart; checkout; purchases
  days                       // 用來算平均 DAU
}
```
`dayTotals(date, filter)` → 每日 Totals；`rangeTotals` = 加總；`deriveMetrics(totals)` 才算出比率。
**同一套函式**同時供 KPI、時間序列、Breakdown、Drill-down 使用 → 數字必然一致（有單元測試驗證）。

## 5. 呈現資料（API 回傳）— `types/analytics.ts`

| 型別 | 用於 |
| --- | --- |
| `AnalyticsFilter { from, to, channel?, category?, region?, productId? }` | 所有分析 API 的共同參數 |
| `MetricComparison { key, current, previous, delta, deltaPercent, direction }` | KPI 卡 |
| `OverviewData { range, previousRange, metrics: Record<MetricKey, MetricComparison>, sparklines }` | Overview |
| `TimeSeriesData { granularity, current: TimeSeriesPoint[], previous: TimeSeriesPoint[] }` | 趨勢圖（本期 + 前期） |
| `BreakdownData { dimension, metric, total, items: BreakdownItem[] }` | 占比、排行、雷達、散佈圖 |
| `SeriesByDimensionData { buckets, series: {key,label,values}[] }` | 堆疊長條 / 堆疊面積 |
| `FunnelData`、`HeatmapData`、`TargetData`、`UsersOverviewData`、`RetentionData` | 其他圖表 |
| `OrderRow`、`Paginated<OrderRow>` | 資料表 |
| `DrillView`（見 DRILL_DOWN_GUIDE） | Drill-down |

**原始資料與呈現資料分離**：前端永遠拿不到 `Order.lines` 這種原始結構，只拿已整理好的呈現資料；未來換成真實後端時，只要後端回傳同樣的呈現格式即可。

## 6. 比較計算規則（`utils/stats.ts`）

| 情況 | `percentChange(current, previous)` |
| --- | --- |
| 120 vs 100 | +20 |
| 0 vs 0 | 0（無變化） |
| 50 vs 0 | `null`（從 0 成長無法定義為 %，UI 顯示 n/a，不顯示 ∞） |
| null / NaN | `null` |
| -50 vs -100 | +50（除以 \|previous\|，正負號永遠代表方向） |

`direction`：delta 為 0 或變化 < 0.05% → `flat`；無法比較 → `none`。
百分比型指標（轉換率、退款率、成長率）的差異以 **percentage points（pp）** 顯示。

## 7. 前端持久化資料（localStorage）— 皆以 Zod 驗證

| Key | 內容 | 驗證失敗時 |
| --- | --- | --- |
| `insightra:settings:v1` | 主題、語言、預設期間、隱藏欄位、個人資料、通知偏好 | 欄位逐一回退預設 |
| `insightra:filters:v1` | 日期 preset、自訂區間、粒度、比較開關 | 回到預設期間 |
| `insightra:dashboards:v1` | `DashboardState`（所有版面與 Widget） | 載入預設版面並以 Toast 告知 |
| `insightra:reports:v1` | 報表定義 | 載入範例報表 |
| `insightra:notifications-read:v1` | 已讀通知 id | 全部未讀 |
| `insightra:flagged-orders:v1` | 標記待審訂單 id | 空 |
| `insightra:auth:v1` | Mock 使用者與 token | 視為未登入 |

Key 帶版本號 `v1`：日後結構改變可升為 `v2` 並寫遷移程式，不會讀到舊格式而壞掉。
