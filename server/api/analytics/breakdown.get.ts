import { z } from 'zod'
import { getDataset } from '../../mock/db'
import { getBreakdown } from '../../utils/analytics'
import { apiOk } from '../../utils/response'
import {
  checkRange,
  dimensionSchema,
  filterShape,
  parseQuery,
  seriesMetricSchema,
} from '../../utils/validation'

const schema = z
  .object({
    ...filterShape,
    dimension: dimensionSchema,
    metric: seriesMetricSchema.default('revenue'),
  })
  .superRefine(checkRange)

/**
 * GET /api/analytics/breakdown?from&to&dimension=channel&metric=revenue
 * One metric split by a dimension (channel, category, region, product, segment).
 */
export default defineEventHandler((event) => {
  const { dimension, metric, ...filter } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(ds, getBreakdown(ds, filter, dimension, metric))
})
