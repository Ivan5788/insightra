/**
 * Client plugin: keeps <html> in sync with user preferences.
 *  - data-theme="light|dark" (drives every CSS token, incl. chart colours)
 *  - lang attribute for screen readers
 *  - follows the OS theme when the user picked "System"
 *  - refreshes "today" when the tab becomes visible again
 */
import { setQueryScope } from '~/composables/useApiQuery'
import { setLang } from '~/utils/locale'

export default defineNuxtPlugin(() => {
  const settings = useSettingsStore()
  const filters = useFilterStore()

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  settings.systemPrefersDark = mql.matches
  mql.addEventListener('change', (event) => {
    settings.systemPrefersDark = event.matches
  })

  // flush: 'sync' → the attribute changes BEFORE components re-render, so
  // charts that read CSS variables during render already get the new colours.
  watch(
    () => settings.resolvedTheme,
    (theme) => {
      document.documentElement.dataset.theme = theme
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#0f1214' : '#0f6e73')
    },
    { immediate: true, flush: 'sync' },
  )

  // Language: pure helpers (dates, catalog, metrics) read utils/locale.ts,
  // API requests send `lang`, and the query cache is scoped per language.
  // app.vue keys the layout on the locale, so the whole UI re-renders.
  setQueryScope(() => settings.settings.locale)
  watch(
    () => settings.settings.locale,
    (locale, previous) => {
      setLang(locale)
      document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant-TW' : 'en'
      if (previous) useNotificationStore().load(true)
    },
    { immediate: true, flush: 'sync' },
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') filters.refreshToday()
  })
})
