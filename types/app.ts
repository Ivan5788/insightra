import type { DatePresetKey, DateRange, Granularity, MetricKey } from './analytics'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Locale = 'en' | 'zh-TW'

export interface UserProfile {
  name: string
  email: string
  title: string
  company: string
  timezone: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  weeklyDigest: boolean
  anomalyAlerts: boolean
  reportReady: boolean
}

export interface AppSettings {
  theme: ThemeMode
  locale: Locale
  defaultPreset: DatePresetKey
  defaultGranularity: Granularity
  compareEnabled: boolean
  sidebarCollapsed: boolean
  /** Column keys hidden in the orders data table. */
  hiddenColumns: string[]
  profile: UserProfile
  notifications: NotificationPreferences
}

export type ReportType = 'sales' | 'traffic' | 'customers' | 'products'
export type ReportSchedule = 'none' | 'weekly' | 'monthly'

export interface ReportDefinition {
  id: string
  name: string
  description: string
  type: ReportType
  metrics: MetricKey[]
  preset: DatePresetKey
  customRange?: DateRange
  granularity: Granularity
  schedule: ReportSchedule
  owner: string
  createdAt: string
  updatedAt: string
}

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  timeout: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}
