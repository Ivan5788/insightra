# FIGMA_GUIDE — Figma 設計稿說明

## ⚠️ 重要聲明（請先閱讀）

**本專案目前「沒有」完成的 Figma 設計稿。**

開發時的 AI 環境沒有任何 Figma 整合工具（沒有 Figma API／MCP 連線，也無法登入 Figma），
因此**無法建立真正可開啟、可編輯的 `.fig` 檔或 Figma 連結**。依照專案原則，
本文件**不會**宣稱 Figma 已完成，也**沒有**用 HTML 偽裝成 Figma 截圖。

已經準備好的，是讓你**親手在 Figma 完成設計稿**所需的全部材料：

| 材料 | 位置 | 用途 |
| --- | --- | --- |
| Design Tokens（可直接匯入 Figma） | `design/tokens.json` | 用 **Tokens Studio for Figma** 外掛匯入 → 自動產生 Color / Typography / Spacing / Radius / Shadow 變數，Light & Dark 兩組 |
| 實際畫面參考截圖 | `design/reference/*.png` | Desktop 1440 / Tablet 768 / Mobile 375、Light / Dark、Drill-down、編輯模式、登入頁 |
| 設計規範 | `docs/UI_UX_GUIDE.md` | 色彩、字體、間距、元件狀態、圖表規則 |
| 元件對照表 | 本文件第 4 節 | 每個 Figma Component ↔ Vue 元件檔案 |

> 求職建議：面試時請誠實說明「設計系統與 Token 先定義在程式碼中，Figma 檔是依同一套 Token 建立」，
> 並展示 Figma 中的 Variables、Components、Variants、Auto Layout。這比假裝「先畫 Figma」更有說服力。

---

## 1. 建議的 Figma 工作流程（預估 1.5 – 2 天）

### Step 1 — 建立檔案與匯入 Token（約 30 分鐘）
1. 新增 Figma Design 檔：`Insightra — Design System & UI`。
2. 安裝外掛 **Tokens Studio for Figma**（免費版即可）。
3. Tokens Studio → `Load from file` → 選擇 `design/tokens.json`。
4. 勾選 token sets：`core` + `light` + `chart-light`（Light 主題），另建 Theme：`core` + `dark` + `chart-dark`。
5. `Styles & Variables → Export to Figma`：產生 Figma Variables（Collection：`Color` 有 Light / Dark 兩個 mode）。

> 替代方案：若不使用外掛，可依 `docs/UI_UX_GUIDE.md` 的色票手動建立 Variables（Color collection 加兩個 mode）。

### Step 2 — 頁面（Pages）結構
```
📄 00 Cover            封面、版本、作者、狀態
📄 01 Brand            Logo、品牌色、字體、Icon 系統
📄 02 Foundations      Color / Typography / Spacing / Grid / Radius / Shadow
📄 03 Components       所有元件（含 Variants）
📄 04 Wireframes       低保真線框（灰階）
📄 05 UI — Desktop     1440 高保真
📄 06 UI — Tablet      768
📄 07 UI — Mobile      375
📄 08 Prototype        互動流程（Login → Overview → Drill-down → Edit widgets）
📄 09 Handoff          元件對照表、Dev notes
```

### Step 3 — Grid（Layout Grid）
| Frame | Columns | Margin | Gutter | 說明 |
| --- | --- | --- | --- | --- |
| Desktop 1440 | 12 | 32（左側另扣 Sidebar 248） | 20 | Widget 寬度：sm=2、md=4、lg=8、full=12 欄 |
| Tablet 768 | 6 | 24 | 16 | sm=2、md=3、lg/full=6 欄；Sidebar 改為抽屜 |
| Mobile 375 | 2 | 16 | 12 | KPI 一列兩張，其餘全寬 |

### Step 4 — 元件（Components + Variants + Auto Layout）
每個元件用 **Auto Layout**，padding / gap 綁定 spacing token，顏色綁定 Variables（才能一鍵切換 Dark mode）。

| Component | Variants（property = values） | Auto Layout 規格 |
| --- | --- | --- |
| Button | variant = primary / secondary / ghost / danger；size = sm / md / lg；state = default / hover / disabled / loading；iconOnly = true/false | 水平、gap 8、padding 0×14、height 36（sm 30 / lg 44）、radius md |
| Input | state = default / focus / error / disabled；hasIcon | 水平、padding 0×12、height 38 |
| Select | state = default / open / disabled | 同 Input + chevron icon |
| Dropdown / Menu | type = menu / popover | 垂直、padding 6、item height 36 |
| Tabs | state = active / inactive | 水平、active 底線 2px primary |
| SegmentedControl | options = 2 / 3 / 4 | 水平、padding 3、item height 28 |
| Card | padding = 16 / 20 | 垂直、radius lg、border 1px、shadow sm |
| StatCard (KPI) | trend = up / down / flat / n/a；loading = true/false | 垂直 gap 6：Label+info → Value → DeltaBadge+prev → Sparkline |
| DeltaBadge | tone = positive / negative / neutral | 水平 gap 3，pill |
| Badge / StatusBadge | status = completed / pending / refunded / cancelled | pill、icon + label（不可只靠顏色） |
| Modal | size = sm / md / lg | Header / Body / Footer 三段 |
| Drawer | side = left / right | 全高，Header + 捲動 Body |
| Tooltip | placement = top / bottom | 深色底、max-width 260 |
| Sidebar | state = expanded / collapsed | 寬 248 / 72 |
| NavItem | state = default / hover / active；collapsed | height 40 |
| Header | breakpoint = desktop / mobile | height 64 |
| DataTable | density = default；row = default / hover / selected | 表頭 surface-2、row padding 12 |
| Pagination | — | 水平 gap 4，按鈕 32×32 |
| ChartCard | state = loading / empty / error / ready；view = chart / table | 垂直：Header（title + actions）→ Body |
| WidgetContainer | mode = view / edit；size = sm / md / lg / full；hidden | edit 模式虛線邊框 + 工具列 |
| DrillDownPanel | level = 1–4 | Drawer + Breadcrumb + KPI row + Chart + Table |
| Toast | type = success / error / warning / info | 左側 3px 色條 + icon |
| EmptyState / ErrorState | compact = true/false | 垂直置中 |

### Step 5 — Wireframes（低保真）
只用灰階方塊與文字，確認資訊層級：
1. Overview：Header（篩選）→ 6 KPI → 主趨勢圖 + 占比 → 排行 / 活動 → 交易表
2. Analytics：指標 Tabs → 趨勢圖 + 統計摘要 → 多指標比較 → 流量 / 雷達 → 漏斗 / 熱力圖 → Drill-down 入口
3. Data Table：工具列（搜尋、狀態、欄位、匯出）→ 批次操作列 → 表格 → 分頁
4. Drill-down Drawer：返回 + 層級 → 標題 → Breadcrumb → 篩選 chips → KPI → 圖表 → 明細表
5. Mobile：漢堡選單、篩選列換行、KPI 2 欄、表格改卡片

### Step 6 — 高保真 UI
以 `design/reference/` 截圖為準，在對應 Frame 用 Components 組出畫面：
- Desktop 1440：Overview（Light / Dark）、Analytics、Sales、Users、Reports、Report detail、Data Table、Settings、Login、404、Drill-down 開啟狀態、Widget 編輯模式
- Tablet 768：Overview、Data Table
- Mobile 375：Overview、Data Table（卡片）、Navigation drawer、Drill-down

> 可加速的合法方法：Figma 外掛 **html.to.design** 可把執行中的網頁（`npm run dev`）匯入成可編輯圖層，
> 再把圖層替換成你的 Components。請在作品說明中**誠實註明**此步驟，不要宣稱是「先設計後開發」。

### Step 7 — Prototype
| 起點 | 觸發 | 目的地 |
| --- | --- | --- |
| Login「Sign in」 | On click | Overview |
| KPI Revenue 的 drill icon | On click | Drill-down Level 1（Open overlay，右側滑入） |
| Drill 表格第一列 | On click | Level 2（Navigate，Smart animate） |
| Breadcrumb 第一項 | On click | Level 1 |
| 「Edit dashboard」 | On click | Overview — Edit mode |
| 「Save layout」 | On click | Overview + Toast |
| Header 主題按鈕 | On click | Change to（Variables mode = Dark） |
| Mobile 漢堡選單 | On click | Navigation drawer（Open overlay，左側） |

### Step 8 — Handoff
- 在 `09 Handoff` 放下方的「元件對照表」。
- 開啟 Dev Mode，確認 Variables 名稱與 CSS 變數一致（例：`color/primary` ↔ `--color-primary`）。

---

## 2. 命名規則（Figma ↔ 程式碼一致）

| Figma | CSS / SCSS | 例 |
| --- | --- | --- |
| Variable `color/primary` | `--color-primary` | `var(--color-primary)` |
| Variable `chart/1` | `--chart-1` | 圖表第 1 個類別色 |
| Variable `space/4` | `space(4)` = 16px | `padding: space(4)` |
| Variable `radius/lg` | `$radius-lg` | 12px |
| Text style `typography/h1` | `.text-h1` | 28 / Bold |

## 3. 品牌資產
- Logo：`components/common/AppLogo.vue`（SVG，可直接複製 path 貼入 Figma）、`public/favicon.svg`
- Icon：`data/icons.ts`（24×24、2px stroke、round cap）。在 Figma 建立 `Icon / {name}` Component，Instance swap 屬性給 Button / NavItem 使用。

## 4. 元件對照表（Figma Component ↔ Vue）

| Figma Component | Vue 檔案 |
| --- | --- |
| Button | `components/common/BaseButton.vue` |
| Icon | `components/common/AppIcon.vue` |
| Logo | `components/common/AppLogo.vue` |
| Input / Select | `assets/scss/components/_forms.scss`、`components/forms/SelectInput.vue` |
| Search | `components/forms/SearchInput.vue`、`components/layout/GlobalSearch.vue` |
| DateRangePicker | `components/forms/DateRangePicker.vue` |
| FilterPanel | `components/forms/FilterPanel.vue` |
| Dropdown | `components/common/BaseDropdown.vue` |
| Tabs | `components/common/BaseTabs.vue` |
| SegmentedControl | `components/common/SegmentedControl.vue` |
| Toggle | `components/common/ToggleSwitch.vue` |
| Tooltip | `components/common/InfoTooltip.vue` |
| Modal | `components/common/BaseModal.vue` |
| Drawer | `components/common/BaseDrawer.vue` |
| Toast | `components/common/ToastContainer.vue` |
| Breadcrumb | `components/common/Breadcrumb.vue` |
| PageHeader | `components/common/PageHeader.vue` |
| Sidebar / NavItem | `components/layout/AppSidebar.vue` |
| Header | `components/layout/AppHeader.vue` |
| StatCard | `components/dashboard/StatCard.vue` |
| DeltaBadge / StatusBadge | `components/common/DeltaBadge.vue`、`StatusBadge.vue` |
| ChartCard | `components/charts/ChartCard.vue` |
| DataTable / Pagination | `components/tables/DataTable.vue`、`Pagination.vue` |
| WidgetContainer | `components/widgets/WidgetContainer.vue` |
| DrillDownPanel | `components/dashboard/DrillDownPanel.vue`、`DrillDownView.vue` |
| Empty / Error / Skeleton | `components/common/EmptyState.vue`、`ErrorState.vue`、`SkeletonBlock.vue` |

## 5. 完成後要更新的地方
1. 在 README「Figma」段落貼上 Figma 檔的分享連結（View only）。
2. 把本文件開頭的「重要聲明」改為實際完成狀態與完成日期。
3. 若設計稿調整了 Token，先更新 Figma Variables，再同步 `assets/scss/base/_tokens.scss` 與 `design/tokens.json`。
