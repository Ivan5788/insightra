import { todayISO } from '~/utils/date'
import { generateDataset, type Dataset } from './generator'

/**
 * In-memory "database" for the mock API.
 *
 * The dataset is generated lazily on the first request and cached.
 * It is rebuilt once per hour so "today" keeps growing during the day
 * (today's orders only cover hours that have already passed).
 *
 * To connect a real backend you would replace this module (or the
 * whole server/api folder) — the frontend only talks HTTP.
 */

/**
 * The store's business time zone. Hosting platforms (e.g. Vercel) run in
 * UTC, which would make the server's "today" lag 8 hours behind the
 * browser's in Taiwan. The mock data therefore follows the store's clock,
 * not the server's.
 */
export const STORE_TIME_ZONE = 'Asia/Taipei'

/**
 * Wall-clock time in `timeZone`, as a Date whose LOCAL fields
 * (getFullYear / getHours …) show that time — this is what the date
 * helpers and the generator read.
 */
export function storeClock(now: Date = new Date(), timeZone = STORE_TIME_ZONE): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  )
}

let cache: { key: string; dataset: Dataset } | null = null

export function getDataset(realNow: Date = new Date()): Dataset {
  const now = storeClock(realNow)
  const key = todayISO(now) + 'T' + now.getHours()
  if (!cache || cache.key !== key) {
    cache = { key, dataset: generateDataset({ today: todayISO(now), now }) }
  }
  return cache.dataset
}
