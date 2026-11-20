import { getDataset } from '../../mock/db'
import { getOverview } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import { filterSchema, parseQuery } from '../../utils/validation'

/**
 * GET /api/analytics/overview?from=2026-10-22&to=2026-11-20[&channel=&category=&region=&productId=]
 * KPI values for the period + the previous period of equal length.
 */
export default defineEventHandler((event) => {
  const filter = parseQuery(event, filterSchema)
  const ds = getDataset()
  return apiOk(ds, getOverview(ds, filter))
})
