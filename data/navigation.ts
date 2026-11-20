import type { MessageKey } from '~/locales/en'
import type { IconName } from './icons'

export interface NavItem {
  to: string
  labelKey: MessageKey
  icon: IconName
  section: 'analyze' | 'manage'
  /** Extra search keywords for the global search. */
  keywords: string
}

/** Sitemap of the app — used by the sidebar AND the global search. */
export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.overview',
    icon: 'dashboard',
    section: 'analyze',
    keywords: 'dashboard home kpi widgets',
  },
  {
    to: '/analytics',
    labelKey: 'nav.analytics',
    icon: 'line-chart',
    section: 'analyze',
    keywords: 'trend compare funnel traffic heatmap',
  },
  {
    to: '/sales',
    labelKey: 'nav.sales',
    icon: 'bar-chart',
    section: 'analyze',
    keywords: 'products categories regions target',
  },
  {
    to: '/users',
    labelKey: 'nav.users',
    icon: 'users',
    section: 'analyze',
    keywords: 'customers retention cohort growth',
  },
  {
    to: '/reports',
    labelKey: 'nav.reports',
    icon: 'file-text',
    section: 'manage',
    keywords: 'export pdf csv report',
  },
  {
    to: '/data',
    labelKey: 'nav.data',
    icon: 'table',
    section: 'manage',
    keywords: 'orders table transactions',
  },
  {
    to: '/notifications',
    labelKey: 'nav.notifications',
    icon: 'bell',
    section: 'manage',
    keywords: 'alerts',
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    section: 'manage',
    keywords: 'preferences theme language profile',
  },
]
