import { z } from 'zod'
import { getDataset } from '../../mock/db'
import { apiOk } from '../../utils/response'
import { getRetention } from '../../utils/users'
import { checkRange, filterShape, parseQuery } from '../../utils/validation'

const schema = z
  .object({ ...filterShape, months: z.coerce.number().int().min(3).max(12).default(6) })
  .superRefine(checkRange)

/** GET /api/users/retention?from&to&months=6 — monthly purchase cohorts ending at `to`. */
export default defineEventHandler((event) => {
  const { months, ...filter } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(ds, getRetention(ds, filter.to, months, filter))
})
