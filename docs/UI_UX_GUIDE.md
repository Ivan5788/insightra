# UI_UX_GUIDE — UI/UX 設計規範

## 1. 品牌識別

| 項目 | 規範 |
| --- | --- |
| 產品名稱 | **Insightra**（Insight + -ra，「洞察」的品牌化） |
| 標語 | From raw orders to clear decisions. |
| Logo | 圓角方形「鏡頭」＋三根遞增長條（資料）＋右上光點（洞察）。漸層深潟青 `#0f6e73` → `#1f9e96`，洞察光點為番紅花 `#e3a12f` |
| 個性 | 專業、冷靜、可信賴；避免過度裝飾，讓資料成為主角 |
| 字體 | Inter（數字清楚、等寬數字支援）；中文回退 PingFang TC / Microsoft JhengHei |

## 2. 色彩系統

### 色彩概念：深潟青 Lagoon ＋ 番紅花 Saffron
初版使用 Tailwind 預設的靛藍（`#4f46e5`）與冷灰藍（slate），辨識度低、看起來像 Bootstrap / Tailwind 範本。
2026-11-21 改為自訂色票：
- **主色 深潟青 `#0F6E73`**：沉穩、可信賴的深青綠，與圖表第 1 色（藍 `#2a78d6`）明顯不同，**介面操作色不會被誤認為資料色**。
- **輔助色 番紅花 `#E3A12F`**：只用在品牌重點（Logo 洞察光點、封面），不拿來表示狀態，避免和「警示」混淆。
- **暖調中性色**：背景 `#F4F3EF`（紙感）、文字 `#1A1C22`（帶暖的墨色），取代常見的冷灰藍。
- **功能色重新調校**：成功 jade、警示 amber-brown、危險 vermilion、資訊 steel blue，皆不是框架預設值。
- 全部文字組合以 WCAG 對比計算驗證（主色對白底 6.0:1、次要文字 5.1:1、各狀態標籤 ≥ 4.5:1）。

### 品牌與功能色（Light / Dark）
| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--color-primary` | `#0f6e73` | `#4fc1bc` | 主要按鈕、選取狀態、連結 |
| `--color-accent` | `#e3a12f` | `#f0b54e` | 品牌輔助色（番紅花） |
| `--color-bg` | `#f4f3ef` | `#0f1214` | 頁面背景 |
| `--color-surface` | `#ffffff` | `#171b1e` | 卡片 |
| `--color-text` | `#1a1c22` | `#eceae4` | 主要文字 |
| `--color-text-muted` | `#6b6e78` | `#8e8b84` | 次要文字（對白底對比 5.09:1） |
| `--color-success` | `#237a57` | `#4cb782` | 正向變化、完成 |
| `--color-warning` | `#a35c0a` | `#e9a345` | 退款、警告 |
| `--color-danger` | `#b43b2a` | `#f07563` | 負向變化、刪除 |
| `--color-info` | `#2c5f8a` | `#79a9d6` | 提示、處理中 |

**Dark mode 不是反轉**：每個顏色都為深色背景重新挑選（提高明度、降低飽和），對比度另外驗證。

### 資料視覺化色彩
類別色（固定順序，**顏色跟著實體，不跟排名**——Email 在所有圖表中永遠是同一色）：

| # | Light | Dark |
| --- | --- | --- |
| 1 | `#2a78d6` blue | `#3987e5` |
| 2 | `#eb6834` orange | `#d95926` |
| 3 | `#1baf7a` aqua | `#199e70` |
| 4 | `#eda100` yellow | `#c98500` |
| 5 | `#e87ba4` magenta | `#d55181` |
| 6 | `#008300` green | `#0ca30c` |
| 7 | `#6250d6` violet | `#9085e9` |
| 8 | `#e34948` red | `#e66767` |

**驗證結果**（以實際卡片底色 #ffffff / #171b1e 執行色盲模擬檢查）：
- Lightness band、Chroma、相鄰色 CVD 距離（ΔE ≥ 8）、一般視覺距離（ΔE ≥ 15）全部 PASS
- Light 模式 3 個顏色（aqua / yellow / magenta）對白底 < 3:1 → 緩解方式：所有圖表都有 Legend、Tooltip，主要圖表提供「Table」檢視
- 散佈圖限制使用單色（超過 3 色在散佈圖中無法保證色盲可辨識）

連續色（熱力圖、留存）：單一色相藍色由淺到深；漏斗使用有序藍階。

## 3. 字體層級
| 樣式 | 大小 / 字重 / 行高 | 用途 |
| --- | --- | --- |
| H1 | 28 / 700 / 1.25（手機 22） | 頁面標題 |
| H2 | 22 / 600 / 1.3 | 區塊標題 |
| H3 / Card title | 16 / 600 / 1.4 | 卡片標題 |
| KPI value | 28 / 700 / 1.2 | KPI 數字 |
| Body | 14 / 400 / 1.5 | 內文 |
| Small | 13 | 表格、輔助說明 |
| Caption | 12 / 500 | 標籤、表頭（大寫 + 字距） |
表格與座標軸使用 `font-variant-numeric: tabular-nums`，數字上下對齊。

## 4. 間距、圓角、陰影
- **4px 網格**：`space(1)=4 … space(4)=16 … space(8)=32`
- 卡片 padding 16（手機）/ 20（≥768）；區塊間距 16 / 20
- 圓角：sm 6（tag）、md 8（按鈕、輸入框）、lg 12（卡片）、xl 16（Modal）、full（pill）
- 陰影：sm（卡片）、md（hover）、lg（Modal / Dropdown / Toast）

## 5. 版面與 Grid
| 斷點 | 寬度 | 版面 |
| --- | --- | --- |
| Mobile | < 768 | 2 欄 Widget grid（KPI 兩張一列）、Sidebar → 抽屜、表格 → 卡片 |
| Tablet | 768–1279 | 6 欄、Sidebar 在 ≥1024 顯示 |
| Desktop | ≥ 1280 | 12 欄；Sidebar 248（可收合成 72） |
內容最大寬度 1600px，避免超寬螢幕閱讀困難。

## 6. 元件狀態規範
每個互動元件都定義：default / hover / focus-visible（2px 外框）/ active / disabled / loading。
資料元件都定義四種狀態：

| 狀態 | 呈現 |
| --- | --- |
| Loading（首次） | Skeleton（保持版面高度，不跳動） |
| Refreshing（已有資料） | 保留舊資料 + 標題旁小 spinner |
| Empty | 圖示 + 「No data for this period」+ 建議 |
| Error | 錯誤訊息 + Retry 按鈕 |

## 7. 資料視覺化規則
1. **不使用雙 Y 軸**：不同單位的指標用「Index = 100」比較，或拆成兩張圖（Users 頁的總使用者 vs 新使用者）。
2. 細線條：折線 2px、前期比較線 1.5px 灰色；長條圓角 4px；甜甜圈切片間 2px 間隔。
3. 格線為實線細線、低對比；座標軸標籤 11px muted。
4. ≥ 2 個系列一定有 Legend；可點擊 Legend 切換系列。
5. 每張圖都有 Tooltip；折線圖 Tooltip 同時顯示本期、前期與變化 %。
6. 甜甜圈最多 6 片，其餘合併為「Other」。
7. 地區分布用排序長條圖而非地圖：7 個市場差異大，長度比顏色更容易比較精確數值（亦避免引入大型 GeoJSON）。
8. 漲跌顏色代表「好 / 壞」而非「上 / 下」：退款率下降顯示綠色；並同時有箭頭與正負號，不只靠顏色。

## 8. 無障礙（a11y）
- 鍵盤：Tab 順序合理、Skip link、Modal / Drawer focus trap 與 Esc 關閉、Tabs 方向鍵、搜尋 combobox 方向鍵。
- ARIA：`aria-sort`、`aria-current`、`aria-expanded`、`role="dialog"`、`aria-live`（Toast、拖曳結果）。
- 圖表：`role="img"` + `aria-label`；重要圖表提供表格檢視。
- 觸控：`pointer: coarse` 時按鈕最小 40px；導覽項目 44px。
- `prefers-reduced-motion` 時關閉動畫。

## 9. 文案原則
- 動詞開頭的按鈕：「Save layout」「Export CSV」。
- 錯誤訊息說明原因與解法：「"From" must be before "To".」
- 破壞性操作一律確認（刪除報表、移除 Widget、離開未儲存編輯）。
- 模擬資料在 Header、Footer、Settings 都有標示。
