import { z } from 'zod'
import { CATEGORY_IDS, CHANNEL_IDS } from '~/data/catalog'
import { getDataset } from '../mock/db'
import { getDrillView } from '../utils/drilldown'
import { apiOk } from '../utils/response'
import { isoDate, langSchema, parseQuery } from '../utils/validation'
import { withLang } from '~/utils/locale'

const schema = z.object({
  kind: z.enum([
    'revenue-months',
    'revenue-days',
    'revenue-products',
    'product-orders',
    'categories',
    'category-products',
    'product-detail',
    'channels',
    'channel-detail',
  ]),
  from: isoDate.optional(),
  to: isoDate.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  day: isoDate.optional(),
  productId: z
    .string()
    .regex(/^p-\d{3}$/)
    .optional(),
  category: z.enum(CATEGORY_IDS).optional(),
  channel: z.enum(CHANNEL_IDS).optional(),
  lang: langSchema,
})

/**
 * GET /api/drilldown?kind=revenue-days&month=2026-11
 * Returns a normalised DrillView (KPIs + charts + table) for any drill level.
 */
export default defineEventHandler((event) => {
  const { kind, lang, ...params } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(
    ds,
    withLang(lang, () => getDrillView(ds, kind, params)),
  )
})
