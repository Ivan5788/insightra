import { getDataset } from '../../mock/db'
import { getFunnel } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import { filterSchema, parseQuery } from '../../utils/validation'

/** GET /api/analytics/funnel?from&to[&channel] — sessions → purchase funnel. */
export default defineEventHandler((event) => {
  const filter = parseQuery(event, filterSchema)
  const ds = getDataset()
  return apiOk(ds, getFunnel(ds, filter))
})
