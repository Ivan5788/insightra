/**
 * Current UI language for pure helpers (dates, catalog labels, metrics).
 *
 * The browser sets it from user settings (plugins/theme.client.ts) and the
 * app re-renders when it changes.
 *
 * Server code never calls setLang(): requests are concurrent, so a
 * module-level value set by one request must not leak into another. The
 * server either passes the request's `lang` explicitly, or wraps a
 * SYNCHRONOUS builder in withLang() (see below).
 */
export type Lang = 'en' | 'zh-TW'

let current: Lang = 'en'

export function setLang(lang: Lang): void {
  current = lang
}

export function getLang(): Lang {
  return current
}

/**
 * Run a synchronous function with `lang` as the current language, then
 * restore the previous value (also on errors). Safe on the server because
 * JavaScript runs synchronous code to completion — no other request can
 * run in the middle. Never pass an async function.
 */
export function withLang<T>(lang: Lang, fn: () => T): T {
  const previous = current
  current = lang
  try {
    return fn()
  } finally {
    current = previous
  }
}

/** Choose the English or Chinese variant. */
export function byLang<T>(en: T, zhTW: T, lang: Lang = current): T {
  return lang === 'zh-TW' ? zhTW : en
}

/**
 * Store-free translation helper for presentational components (usable in
 * unit tests without Pinia). Supports {name} placeholders.
 */
export function tt(en: string, zhTW: string, params?: Record<string, string | number>): string {
  const text = byLang(en, zhTW)
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}
