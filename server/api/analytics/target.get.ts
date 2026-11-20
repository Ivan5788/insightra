import { getDataset } from '../../mock/db'
import { getTarget } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import { filterSchema, parseQuery } from '../../utils/validation'

/** GET /api/analytics/target?from&to — monthly revenue target progress (month of `to`). */
export default defineEventHandler((event) => {
  const filter = parseQuery(event, filterSchema)
  const ds = getDataset()
  return apiOk(ds, getTarget(ds, filter))
})
