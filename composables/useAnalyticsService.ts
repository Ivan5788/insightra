import { analyticsService } from '~/services/analytics.service'

/**
 * Access to the analytics API client from components that need a custom
 * query (e.g. conditional queries). Keeps components from importing the
 * service layer directly, so it can be swapped/mocked in one place.
 */
export function useAnalyticsService() {
  return analyticsService
}
