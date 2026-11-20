import { getDataset } from '../../mock/db'
import { getHeatmap } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import { filterSchema, parseQuery } from '../../utils/validation'

/** GET /api/analytics/heatmap?from&to — orders by weekday × hour. */
export default defineEventHandler((event) => {
  const filter = parseQuery(event, filterSchema)
  const ds = getDataset()
  return apiOk(ds, getHeatmap(ds, filter))
})
