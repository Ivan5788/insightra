import { PRODUCTS } from '~/data/catalog'
import type { DatasetInfo } from '~/types/api'
import { getDataset } from '../mock/db'
import { apiOk } from '../utils/response'

/** GET /api/meta — information about the mock dataset (date window, sizes). */
export default defineEventHandler(() => {
  const ds = getDataset()
  const info: DatasetInfo = {
    firstDate: ds.firstDate,
    lastDate: ds.lastDate,
    orders: ds.orders.size,
    customers: ds.customers.size,
    products: PRODUCTS.length,
  }
  return apiOk(ds, info)
})
