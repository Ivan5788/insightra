import { describe, expect, it } from 'vitest'
import { storeClock } from '~/server/mock/db'
import { todayISO } from '~/utils/date'

describe('store clock (server time zone independent)', () => {
  it('uses Taipei time even when the instant is still "yesterday" in UTC', () => {
    // 2026-11-20 23:30 UTC = 2026-11-21 07:30 in Taipei
    const clock = storeClock(new Date(Date.UTC(2026, 10, 20, 23, 30)))
    expect(todayISO(clock)).toBe('2026-11-21')
    expect(clock.getHours()).toBe(7)
    expect(clock.getMinutes()).toBe(30)
  })

  it('handles midnight with a 24-hour clock', () => {
    // 2026-11-20 16:00 UTC = 2026-11-21 00:00 in Taipei
    const clock = storeClock(new Date(Date.UTC(2026, 10, 20, 16, 0)))
    expect(todayISO(clock)).toBe('2026-11-21')
    expect(clock.getHours()).toBe(0)
  })
})
