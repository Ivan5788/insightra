import type {
  ActivityItem,
  AnalyticsFilter,
  BreakdownData,
  DimensionKey,
  FunnelData,
  Granularity,
  HeatmapData,
  NotificationItem,
  OverviewData,
  RetentionData,
  SeriesByDimensionData,
  SeriesMetricKey,
  TargetData,
  TimeSeriesData,
  UsersOverviewData,
} from '~/types/analytics'
import type { DatasetInfo } from '~/types/api'
import { apiGet, type QueryParams } from './http'

/**
 * Analytics API client. One function per endpoint, fully typed.
 * Components never call $fetch directly — they go through composables,
 * which call these functions. Replacing the backend = changing this layer.
 */

function filterParams(filter: AnalyticsFilter): QueryParams {
  return {
    from: filter.from,
    to: filter.to,
    channel: filter.channel,
    category: filter.category,
    region: filter.region,
    productId: filter.productId,
  }
}

export const analyticsService = {
  async overview(filter: AnalyticsFilter): Promise<OverviewData> {
    return (await apiGet<OverviewData>('/api/analytics/overview', filterParams(filter))).data
  },

  async timeSeries(filter: AnalyticsFilter, granularity: Granularity): Promise<TimeSeriesData> {
    return (
      await apiGet<TimeSeriesData>('/api/analytics/timeseries', { ...filterParams(filter), granularity })
    ).data
  },

  async breakdown(
    filter: AnalyticsFilter,
    dimension: DimensionKey,
    metric: SeriesMetricKey,
  ): Promise<BreakdownData> {
    return (
      await apiGet<BreakdownData>('/api/analytics/breakdown', { ...filterParams(filter), dimension, metric })
    ).data
  },

  async seriesBy(
    filter: AnalyticsFilter,
    dimension: DimensionKey,
    metric: SeriesMetricKey,
    granularity: Granularity,
  ): Promise<SeriesByDimensionData> {
    return (
      await apiGet<SeriesByDimensionData>('/api/analytics/series-by', {
        ...filterParams(filter),
        dimension,
        metric,
        granularity,
      })
    ).data
  },

  async funnel(filter: AnalyticsFilter): Promise<FunnelData> {
    return (await apiGet<FunnelData>('/api/analytics/funnel', filterParams(filter))).data
  },

  async heatmap(filter: AnalyticsFilter): Promise<HeatmapData> {
    return (await apiGet<HeatmapData>('/api/analytics/heatmap', filterParams(filter))).data
  },

  async target(filter: AnalyticsFilter): Promise<TargetData> {
    return (await apiGet<TargetData>('/api/analytics/target', filterParams(filter))).data
  },

  async usersOverview(filter: AnalyticsFilter): Promise<UsersOverviewData> {
    return (await apiGet<UsersOverviewData>('/api/users/overview', filterParams(filter))).data
  },

  async retention(filter: AnalyticsFilter, months = 6): Promise<RetentionData> {
    return (await apiGet<RetentionData>('/api/users/retention', { ...filterParams(filter), months })).data
  },

  async activity(limit = 10): Promise<ActivityItem[]> {
    return (await apiGet<ActivityItem[]>('/api/activity', { limit })).data
  },

  async notifications(): Promise<NotificationItem[]> {
    return (await apiGet<NotificationItem[]>('/api/notifications')).data
  },

  async meta(): Promise<DatasetInfo> {
    return (await apiGet<DatasetInfo>('/api/meta')).data
  },
}
