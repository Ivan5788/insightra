# API_DOCUMENTATION — Mock REST API

Base URL：同源（`/api`）。可用 `NUXT_PUBLIC_API_BASE` 改成外部後端。
實作：`server/api/**`（Nuxt Nitro）。**所有回應皆為模擬資料**（`meta.mock = true`）。

## 共同規格

### 回應格式
```json
{
  "data": { "...": "payload" },
  "meta": { "mock": true, "generatedAt": "2026-11-20T04:00:00.000Z", "total": 3526, "page": 1, "pageSize": 20 }
}
```
`total / page / pageSize` 只出現在列表 API。

### 錯誤格式（400 / 401）
```json
{
  "statusCode": 400,
  "statusMessage": "Invalid query parameters",
  "data": [{ "path": "from", "message": "Expected a date in YYYY-MM-DD format" }]
}
```
前端 `services/http.ts` 會把所有錯誤轉成 `ApiError(status, message, details)`。

### 共同篩選參數（AnalyticsFilter）
| 參數 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `from` | `YYYY-MM-DD` | ✓ | 起日（含） |
| `to` | `YYYY-MM-DD` | ✓ | 迄日（含）；`from ≤ to`，最長 800 天 |
| `channel` | `organic\|paid\|social\|email\|direct\|referral` | | 渠道 |
| `category` | `electronics\|home\|fashion\|beauty\|sports\|books` | | 品類（流量類指標回傳 null） |
| `region` | `tw\|jp\|hk\|sg\|my\|au\|us` | | 市場（流量類指標回傳 null） |
| `productId` | `p-\d{3}` | | 單一商品 |
| `lang` | `en\|zh-TW` | | 回應中**標籤**的語言（渠道、品類、商品、漏斗、鑽取、通知文字），預設 `en`。數值不受影響。前端自動帶入目前介面語言；`/api/drilldown`、`/api/activity`、`/api/notifications` 也接受此參數。 |

比較期間一律為「緊接在前、長度相同」的期間（`previousRange`）。

---

## Analytics

### `GET /api/analytics/overview`
KPI（本期 vs 前期）＋ sparkline。
```
/api/analytics/overview?from=2026-10-22&to=2026-11-20
```
```json
{ "data": {
  "range": { "from": "2026-10-22", "to": "2026-11-20" },
  "previousRange": { "from": "2026-09-22", "to": "2026-10-21" },
  "metrics": {
    "revenue": { "key": "revenue", "current": 342163.65, "previous": 287095.7, "delta": 55067.95, "deltaPercent": 19.18, "direction": "up" },
    "orders": { "...": "..." }, "activeUsers": {}, "conversionRate": {}, "aov": {}, "revenueGrowth": {},
    "sessions": {}, "unitsSold": {}, "newCustomers": {}, "refundRate": {}
  },
  "sparklines": { "revenue": [11234.5, 10380.1, "..."] }
}}
```

### `GET /api/analytics/timeseries`
額外參數：`granularity=day|week|month`（預設 day）。回傳 `current[]`、`previous[]`，每點含所有指標。

### `GET /api/analytics/breakdown`
額外參數：`dimension=channel|category|region|product|segment`（必填）、`metric`（預設 revenue）。
`items[]` 依 value 遞減，含 `share`（%）、`deltaPercent`、`extra`（其他指標，product 另含 `price`）。

### `GET /api/analytics/series-by`
參數：`dimension`、`metric`、`granularity`。每個維度成員一條時間序列（最多 8 條，堆疊圖用）。

### `GET /api/analytics/funnel`
Sessions → Product views → Add to cart → Checkout → Purchase，含步驟轉換率與總轉換率。有品類/地區/商品篩選時 `stages: []`。

### `GET /api/analytics/heatmap`
`cells: [hour, weekday(0=Mon), orders][]`、`max`。

### `GET /api/analytics/target`
`to` 所在月份的營收目標：`target = 上個完整月營收 × 1.10`（取整到千），回傳 `achieved`、`progress`、`daysElapsed`、`daysInMonth`。

## Users

### `GET /api/users/overview`
`totalUsers`、`newUsers`、`activeUsers`、`returningRate`（MetricComparison）、`growth[]`、`bySource[]`、`byRegion[]`、`bySegment[]`。

### `GET /api/users/retention`
額外參數：`months=3..12`（預設 6）。以「首購月份」分群，`retention[k]` = 該群在第 k 個月再次下單的比例（%）；第 0 月為 100；未來月份為 `null`。

## Orders

### `GET /api/orders`
| 參數 | 預設 | 說明 |
| --- | --- | --- |
| `page` | 1 | ≥ 1 |
| `pageSize` | 20 | 1–5000（匯出用上限 5000） |
| `sortBy` | `date` | `date\|total\|units\|customerName\|id\|status` |
| `sortDir` | `desc` | `asc\|desc` |
| `search` | | 訂單編號、顧客名稱、商品名稱（不分大小寫） |
| `status` | | `completed\|pending\|refunded\|cancelled` |
| `day` | | 只看某一天（覆蓋 from/to） |

回傳 `Paginated<OrderRow>`：`{ items, total, page, pageSize }`。套用品類/商品篩選時，`total` 金額只計算符合的商品行。

## Drill-down

### `GET /api/drilldown`
| 參數 | 說明 |
| --- | --- |
| `kind` | `revenue-months\|revenue-days\|revenue-products\|product-orders\|categories\|category-products\|product-detail\|channels\|channel-detail` |
| `from`,`to` | 期間（categories / channels 系列） |
| `month` | `YYYY-MM`（revenue-days） |
| `day` | `YYYY-MM-DD`（revenue-products、product-orders） |
| `productId`、`category`、`channel` | 依層級需要 |

回傳統一的 `DrillView`（KPI + charts + columns + rows，每列可帶 `next` 下一層）。詳見 `docs/DRILL_DOWN_GUIDE.md`。

## 其他

| Endpoint | 說明 |
| --- | --- |
| `GET /api/activity?limit=10` | 最近 3 天的大額訂單、退款、VIP 註冊 |
| `GET /api/notifications` | 由資料推導的通知（營收異常、熱銷商品、目標進度、退款率警示…）；已讀狀態存在瀏覽器 |
| `GET /api/meta` | 資料集期間與筆數 |
| `POST /api/auth/login` `{ email, password }` | **Mock**：只接受 `demo@insightra.app` / `insightra2026`；錯誤回 401 |
| `POST /api/auth/forgot-password` `{ email }` | **Mock**：永遠回同一則訊息（不洩漏帳號是否存在），不會寄信 |

## Reports（前端 Repository）
報表定義屬於使用者資料，正式產品應為 `GET/POST/DELETE /api/reports`。
本 demo 由 `services/reports.service.ts` 以 **相同的 async 介面** 存在 localStorage（含模擬延遲），
未來改接後端只需改這一個檔案。

## 串接正式後端的檢查清單
1. 後端提供上述 endpoint，回傳 `{ data, meta }` 與相同型別（`types/*.ts` 可當合約）。
2. 設定 `NUXT_PUBLIC_API_BASE`；若跨網域需設定 CORS。
3. 驗證改用 httpOnly cookie；`services/http.ts` 加上 `credentials: 'include'`，401 時導向登入。
4. 移除或停用 `server/api`（或保留作為開發用 Mock）。
5. 把 `meta.mock` 改為 false，UI 的「Simulated data」標示可依此隱藏。
