import { analyticsService } from '~/services/analytics.service'
import { ordersService } from '~/services/orders.service'
import type { DimensionKey, Granularity, SeriesMetricKey } from '~/types/analytics'
import { useApiQuery } from './useApiQuery'

/**
 * Analytics composables — the bridge between the global filter and the API.
 *
 *   filterStore.apiFilter ─► cache key ─► useApiQuery ─► analyticsService ─► /api/...
 *
 * Every function builds its cache key from `filterStore.filterKey`, so when
 * the date range changes ALL composables re-fetch, and identical requests
 * from several widgets are de-duplicated into one HTTP call.
 */

export function useOverview() {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'overview:' + filters.filterKey,
    () => analyticsService.overview(filters.apiFilter),
  )
}

export function useTimeSeries(granularity?: () => Granularity) {
  const filters = useFilterStore()
  const g = () => (granularity ? granularity() : filters.effectiveGranularity)
  return useApiQuery(
    () => 'timeseries:' + g() + ':' + filters.filterKey,
    () => analyticsService.timeSeries(filters.apiFilter, g()),
  )
}

export function useBreakdown(dimension: () => DimensionKey, metric: () => SeriesMetricKey) {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'breakdown:' + dimension() + ':' + metric() + ':' + filters.filterKey,
    () => analyticsService.breakdown(filters.apiFilter, dimension(), metric()),
  )
}

export function useSeriesBy(dimension: () => DimensionKey, metric: () => SeriesMetricKey) {
  const filters = useFilterStore()
  return useApiQuery(
    () =>
      'seriesBy:' +
      dimension() +
      ':' +
      metric() +
      ':' +
      filters.effectiveGranularity +
      ':' +
      filters.filterKey,
    () => analyticsService.seriesBy(filters.apiFilter, dimension(), metric(), filters.effectiveGranularity),
  )
}

export function useFunnel() {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'funnel:' + filters.filterKey,
    () => analyticsService.funnel(filters.apiFilter),
  )
}

export function useHeatmap() {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'heatmap:' + filters.filterKey,
    () => analyticsService.heatmap(filters.apiFilter),
  )
}

export function useTarget() {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'target:' + filters.filterKey,
    () => analyticsService.target(filters.apiFilter),
  )
}

export function useUsersOverview() {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'users:' + filters.filterKey,
    () => analyticsService.usersOverview(filters.apiFilter),
  )
}

export function useRetention(months = 6) {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'retention:' + months + ':' + filters.filterKey,
    () => analyticsService.retention(filters.apiFilter, months),
  )
}

export function useActivity(limit: () => number) {
  return useApiQuery(
    () => 'activity:' + limit(),
    () => analyticsService.activity(limit()),
  )
}

export function useRecentOrders(limit: () => number) {
  const filters = useFilterStore()
  return useApiQuery(
    () => 'recentOrders:' + limit() + ':' + filters.filterKey,
    () =>
      ordersService.list({
        ...filters.apiFilter,
        page: 1,
        pageSize: limit(),
        sortBy: 'date',
        sortDir: 'desc',
      }),
  )
}
