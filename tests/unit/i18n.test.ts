import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { channelLabel, productLabel } from '~/data/catalog'
import { widgetTitle } from '~/data/widget-registry'
import { generateDataset, type Dataset } from '~/server/mock/generator'
import { getBreakdown, getFunnel } from '~/server/utils/analytics'
import { getDrillView } from '~/server/utils/drilldown'
import { getNotifications } from '~/server/utils/feed'
import type { WidgetConfig } from '~/types/widgets'
import { formatLongDate, formatRange } from '~/utils/date'
import { getLang, setLang, tt, withLang } from '~/utils/locale'

const RANGE = { from: '2026-10-22', to: '2026-11-20' }
let ds: Dataset

beforeAll(() => {
  ds = generateDataset({ today: '2026-11-20', days: 400, now: new Date('2026-11-20T23:00:00') })
})

afterEach(() => setLang('en'))

describe('locale helpers', () => {
  it('tt picks the language and fills {placeholders}', () => {
    expect(tt('{n} orders', '{n} 筆訂單', { n: 3 })).toBe('3 orders')
    setLang('zh-TW')
    expect(tt('{n} orders', '{n} 筆訂單', { n: 3 })).toBe('3 筆訂單')
  })

  it('withLang restores the previous language, also when the function throws', () => {
    expect(withLang('zh-TW', () => getLang())).toBe('zh-TW')
    expect(getLang()).toBe('en')
    expect(() =>
      withLang('zh-TW', () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    expect(getLang()).toBe('en')
  })

  it('formats dates the Taiwanese way in zh-TW', () => {
    expect(formatLongDate('2026-11-18', 'zh-TW')).toBe('2026/11/18')
    expect(formatRange(RANGE, 'zh-TW')).toBe('2026/10/22 – 11/20')
  })

  it('translates catalog labels and falls back to English', () => {
    expect(channelLabel('organic', 'zh-TW')).toBe('自然搜尋')
    expect(productLabel('p-101', 'en')).toBe('Aurora Wireless Earbuds')
    expect(productLabel('p-999', 'zh-TW')).toBe('p-999')
  })
})

describe('widget titles', () => {
  const widget: WidgetConfig = {
    id: 'w1',
    type: 'line',
    title: '',
    size: 'lg',
    visible: true,
    settings: { metric: 'revenue' },
  }

  it('generates a title in the current language when none was typed', () => {
    expect(widgetTitle(widget, 'en')).toBe('Revenue trend')
    expect(widgetTitle(widget, 'zh-TW')).toBe('營收趨勢')
  })

  it('keeps a title the user typed, in every language', () => {
    expect(widgetTitle({ ...widget, title: 'My chart' }, 'zh-TW')).toBe('My chart')
  })
})

describe('API labels follow the request language, numbers do not', () => {
  it('breakdown: same values, translated labels', () => {
    const en = getBreakdown(ds, { ...RANGE, lang: 'en' }, 'channel', 'revenue')
    const zh = getBreakdown(ds, { ...RANGE, lang: 'zh-TW' }, 'channel', 'revenue')
    expect(zh.items.map((i) => i.value)).toEqual(en.items.map((i) => i.value))
    expect(zh.items[0]!.label).toBe(channelLabel(zh.items[0]!.key as never, 'zh-TW'))
    expect(zh.items[0]!.label).not.toBe(en.items[0]!.label)
  })

  it('funnel stage names are translated', () => {
    expect(getFunnel(ds, { ...RANGE, lang: 'zh-TW' }).stages[0]!.label).toBe('工作階段')
    expect(getFunnel(ds, { ...RANGE }).stages[0]!.label).toBe('Sessions')
  })

  it('drill-down views are built in the requested language without leaking it', () => {
    const zh = withLang('zh-TW', () => getDrillView(ds, 'revenue-months', { to: '2026-11-20' }))
    const en = getDrillView(ds, 'revenue-months', { to: '2026-11-20' })
    expect(zh.title).toBe('各月營收')
    expect(en.title).toBe('Revenue by month')
    expect(zh.kpis.map((k) => k.value)).toEqual(en.kpis.map((k) => k.value))
  })

  it('notifications keep the same ids in both languages (read state survives a switch)', () => {
    const zh = withLang('zh-TW', () => getNotifications(ds))
    const en = getNotifications(ds)
    expect(zh.map((n) => n.id)).toEqual(en.map((n) => n.id))
    expect(zh[0]!.title).not.toBe(en[0]!.title)
  })
})
