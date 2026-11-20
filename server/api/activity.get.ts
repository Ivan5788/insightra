import { z } from 'zod'
import { getDataset } from '../mock/db'
import { getActivity } from '../utils/feed'
import { apiOk } from '../utils/response'
import { langSchema, parseQuery } from '../utils/validation'
import { withLang } from '~/utils/locale'

const schema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  lang: langSchema,
})

/** GET /api/activity?limit=10 — latest notable events (large orders, refunds, VIP sign-ups). */
export default defineEventHandler((event) => {
  const { limit, lang } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(
    ds,
    withLang(lang, () => getActivity(ds, limit)),
  )
})
