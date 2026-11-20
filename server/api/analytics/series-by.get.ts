import { z } from 'zod'
import { getDataset } from '../../mock/db'
import { getSeriesByDimension } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import {
  checkRange,
  dimensionSchema,
  filterShape,
  granularitySchema,
  parseQuery,
  seriesMetricSchema,
} from '../../utils/validation'

const schema = z
  .object({
    ...filterShape,
    dimension: dimensionSchema,
    metric: seriesMetricSchema.default('revenue'),
    granularity: granularitySchema.default('day'),
  })
  .superRefine(checkRange)

/**
 * GET /api/analytics/series-by?from&to&dimension=channel&metric=sessions&granularity=week
 * One time series per dimension member (for stacked bar / stacked area charts).
 */
export default defineEventHandler((event) => {
  const { dimension, metric, granularity, ...filter } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(ds, getSeriesByDimension(ds, filter, dimension, metric, granularity))
})
