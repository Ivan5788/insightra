import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import type { AppSettings, ThemeMode } from '~/types/app'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/**
 * User preferences (theme, language, defaults, profile, notifications).
 * Persisted to localStorage and restored on reload.
 */

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  locale: 'zh-TW',
  defaultPreset: 'last30',
  defaultGranularity: 'day',
  compareEnabled: true,
  sidebarCollapsed: false,
  hiddenColumns: ['region', 'segment'],
  profile: {
    name: 'Alex Morgan',
    email: 'demo@insightra.app',
    title: 'Head of E-commerce',
    company: 'Aurora Living Co.',
    timezone: 'Asia/Taipei',
  },
  notifications: {
    email: true,
    push: false,
    weeklyDigest: true,
    anomalyAlerts: true,
    reportReady: true,
  },
}

// Every field optional → older saved versions still load (forward compatible).
const settingsSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
    locale: z.enum(['en', 'zh-TW']),
    defaultPreset: z.enum([
      'today',
      'yesterday',
      'last7',
      'last30',
      'last90',
      'thisMonth',
      'lastMonth',
      'custom',
    ]),
    defaultGranularity: z.enum(['day', 'week', 'month']),
    compareEnabled: z.boolean(),
    sidebarCollapsed: z.boolean(),
    hiddenColumns: z.array(z.string()),
    profile: z.object({
      name: z.string(),
      email: z.string(),
      title: z.string(),
      company: z.string(),
      timezone: z.string(),
    }),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      weeklyDigest: z.boolean(),
      anomalyAlerts: z.boolean(),
      reportReady: z.boolean(),
    }),
  })
  .partial()

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = readStorage(STORAGE_KEYS.settings, settingsSchema)
  const settings = ref<AppSettings>({ ...clone(DEFAULT_SETTINGS), ...(stored.ok ? stored.value : {}) })

  /** Updated by plugins/theme.client.ts from matchMedia. */
  const systemPrefersDark = ref(false)

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (settings.value.theme === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return settings.value.theme
  })

  watch(settings, (value) => writeStorage(STORAGE_KEYS.settings, value), { deep: true })

  function update(patch: Partial<AppSettings>): void {
    settings.value = { ...settings.value, ...patch }
  }

  function setTheme(mode: ThemeMode): void {
    settings.value.theme = mode
  }

  /** Header toggle: switch to the opposite of what is currently shown. */
  function toggleTheme(): void {
    settings.value.theme = resolvedTheme.value === 'dark' ? 'light' : 'dark'
  }

  function toggleColumn(key: string): void {
    const hidden = new Set(settings.value.hiddenColumns)
    if (hidden.has(key)) hidden.delete(key)
    else hidden.add(key)
    settings.value.hiddenColumns = [...hidden]
  }

  function reset(): void {
    settings.value = clone(DEFAULT_SETTINGS)
  }

  return { settings, systemPrefersDark, resolvedTheme, update, setTheme, toggleTheme, toggleColumn, reset }
})
