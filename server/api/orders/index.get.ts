import { z } from 'zod'
import { getDataset } from '../../mock/db'
import { queryOrders } from '../../utils/orders'
import { apiOk } from '../../utils/response'
import { checkRange, filterShape, isoDate, parseQuery } from '../../utils/validation'

const schema = z
  .object({
    ...filterShape,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(5000).default(20),
    sortBy: z.enum(['date', 'total', 'units', 'customerName', 'id', 'status']).default('date'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(100).optional(),
    status: z.enum(['completed', 'pending', 'refunded', 'cancelled']).optional(),
    day: isoDate.optional(),
  })
  .superRefine(checkRange)

/**
 * GET /api/orders?from&to&page=1&pageSize=20&sortBy=date&sortDir=desc&search=&status=
 * Server-side filtered, sorted and paginated order list.
 */
export default defineEventHandler((event) => {
  const query = parseQuery(event, schema)
  const ds = getDataset()
  const result = queryOrders(ds, query)
  return apiOk(ds, result, { total: result.total, page: result.page, pageSize: result.pageSize })
})
