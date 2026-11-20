import { computed } from 'vue'
import { en, type MessageKey } from '~/locales/en'
import { zhTW } from '~/locales/zh-TW'
import { byLang } from '~/utils/locale'

/**
 * Minimal i18n (no extra dependency). Two ways to translate:
 *
 *  t('nav.overview')               shared UI wording, keyed dictionaries in
 *                                  locales/ — a typo in the key is a compile
 *                                  error and zh-TW must define every key.
 *  tt('Sales trend', '銷售趨勢')    one-off page copy, kept next to the
 *                                  component that uses it (less indirection).
 *
 * Both support {name} placeholders: t('x', { n: 3 }).
 * For a larger product we would move to @nuxtjs/i18n (lazy-loaded locale
 * files, pluralisation, translator workflow).
 */
const messages = { en, 'zh-TW': zhTW } as const

type Params = Record<string, string | number>

function interpolate(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}

export function useI18n() {
  const settings = useSettingsStore()
  const locale = computed(() => settings.settings.locale)

  function t(key: MessageKey, params?: Params): string {
    return interpolate(messages[locale.value][key] ?? en[key] ?? key, params)
  }

  function tt(enText: string, zhText: string, params?: Params): string {
    return interpolate(byLang(enText, zhText, locale.value), params)
  }

  return { t, tt, locale }
}
