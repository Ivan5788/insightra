import { z } from 'zod'
import { getDataset } from '../../mock/db'
import { getTimeSeries } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import { checkRange, filterShape, granularitySchema, parseQuery } from '../../utils/validation'

const schema = z
  .object({ ...filterShape, granularity: granularitySchema.default('day') })
  .superRefine(checkRange)

/**
 * GET /api/analytics/timeseries?from&to&granularity=day|week|month
 * All series metrics per bucket, for the current AND previous period.
 */
export default defineEventHandler((event) => {
  const { granularity, ...filter } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(ds, getTimeSeries(ds, filter, granularity))
})
