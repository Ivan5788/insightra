import type { OrderRow, OrdersQuery } from '~/types/analytics'
import type { Paginated } from '~/types/api'
import { apiGet } from './http'

export const ordersService = {
  async list(query: OrdersQuery): Promise<Paginated<OrderRow>> {
    const res = await apiGet<Paginated<OrderRow>>('/api/orders', {
      from: query.from,
      to: query.to,
      channel: query.channel,
      category: query.category,
      region: query.region,
      productId: query.productId,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      search: query.search,
      status: query.status,
      day: query.day,
    })
    return res.data
  },
}
