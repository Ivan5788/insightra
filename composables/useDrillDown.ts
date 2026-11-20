import { tt } from '~/utils/locale'
import { categoryLabel, channelLabel, getProduct, productLabel } from '~/data/catalog'
import type { CategoryId, ChannelId, ISODate } from '~/types/domain'
import type { DrillLevel } from '~/types/drilldown'
import { formatMonth, formatShortDate, monthKey } from '~/utils/date'

/**
 * useDrillDown — entry points into the three drill-down flows.
 *
 * Any chart can open a flow at any depth. For example, clicking the
 * "Nov 2026" point on the revenue chart starts the stack at
 *   [Revenue by month] → [Nov 2026]
 * so the breadcrumb still lets the user go back up to the top level.
 *
 * The panel itself (DrillDownPanel.vue) is generic: it renders whatever
 * DrillView the API returns for the current level.
 */
export function useDrillDown() {
  const drill = useDrillStore()
  const filters = useFilterStore()

  const range = () => ({ from: filters.range.from, to: filters.range.to })

  const monthsLevel = (): DrillLevel => ({
    kind: 'revenue-months',
    label: tt('Revenue by month', '各月營收'),
    params: { to: filters.range.to },
  })

  const daysLevel = (month: string): DrillLevel => ({
    kind: 'revenue-days',
    label: formatMonth(month),
    params: { month },
  })

  /** Flow 1 — revenue. Optionally jump straight to a month. */
  function openRevenue(month?: string): void {
    drill.start(month ? [monthsLevel(), daysLevel(month)] : [monthsLevel()])
  }

  /** Flow 1 — jump to the products of a single day. */
  function openRevenueDay(day: ISODate): void {
    drill.start([
      monthsLevel(),
      daysLevel(monthKey(day)),
      { kind: 'revenue-products', label: formatShortDate(day), params: { day } },
    ])
  }

  const categoriesLevel = (): DrillLevel => ({
    kind: 'categories',
    label: tt('Categories', '品類'),
    params: range(),
  })

  /** Flow 2 — category → products → product detail. */
  function openCategory(category?: CategoryId): void {
    const levels: DrillLevel[] = [categoriesLevel()]
    if (category) {
      levels.push({
        kind: 'category-products',
        label: categoryLabel(category),
        params: { ...range(), category },
      })
    }
    drill.start(levels)
  }

  function openProduct(productId: string): void {
    const product = getProduct(productId)
    if (!product) return
    drill.start([
      categoriesLevel(),
      {
        kind: 'category-products',
        label: categoryLabel(product.category),
        params: { ...range(), category: product.category },
      },
      { kind: 'product-detail', label: productLabel(productId), params: { ...range(), productId } },
    ])
  }

  /** Flow 3 — acquisition channel → funnel & behaviour. */
  function openChannel(channel?: ChannelId): void {
    const levels: DrillLevel[] = [{ kind: 'channels', label: tt('Channels', '渠道'), params: range() }]
    if (channel)
      levels.push({ kind: 'channel-detail', label: channelLabel(channel), params: { ...range(), channel } })
    drill.start(levels)
  }

  return { openRevenue, openRevenueDay, openCategory, openProduct, openChannel }
}
