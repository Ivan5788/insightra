import { CHANNELS, PRODUCTS, REGIONS } from '~/data/catalog'
import type {
  ChannelId,
  ChannelTraffic,
  Customer,
  CustomerSegment,
  ISODate,
  Order,
  OrderLine,
  OrderStatus,
  RegionId,
} from '~/types/domain'
import { addDays, diffDays, monthKey, weekdayIndex } from '~/utils/date'
import { hashString, jitter, mulberry32, weightedIndex, type Rng } from './random'

/**
 * MOCK DATA GENERATOR
 * -------------------
 * Builds a realistic, internally consistent e-commerce dataset:
 *   traffic (sessions per channel) → funnel → orders → order lines → customers
 *
 * Consistency rules:
 *  - Orders per channel = purchases in that channel's funnel, so conversion
 *    rate = orders / sessions is always coherent.
 *  - Every order references a real product and a real customer.
 *  - Each day is seeded by its date → the same day always has the same data.
 *
 * Business patterns built in (so charts have something to analyse):
 *  - ~15 % yearly growth, weekend peaks, Nov/Dec seasonality,
 *    shopping festivals (6.18, 11.11, Black Friday, 12.12),
 *    lunch-time and evening order peaks.
 *
 * ALL DATA IS SIMULATED. It is not real business data.
 */

export interface DayRecord {
  date: ISODate
  traffic: Record<ChannelId, ChannelTraffic>
  /** Ids of customers who registered that day. */
  signups: string[]
  orders: Order[]
}

export interface Dataset {
  firstDate: ISODate
  lastDate: ISODate
  dates: ISODate[]
  days: Map<ISODate, DayRecord>
  customers: Map<string, Customer>
  orders: Map<string, Order>
  /** customerId → set of 'YYYY-MM' months with at least one order */
  customerOrderMonths: Map<string, Set<string>>
  /** customerId → 'YYYY-MM' of first order inside the dataset */
  firstOrderMonth: Map<string, string>
  generatedAt: string
}

export interface GenerateOptions {
  /** Last day of the dataset (normally "today"). */
  today: ISODate
  /** How many days of history to create. */
  days?: number
  /** Current time — today's data only covers the hours elapsed so far. */
  now?: Date
}

// ---- Business assumptions -------------------------------------------------

const GROWTH_EPOCH: ISODate = '2024-01-01'
const BASE_SESSIONS = 3200

const CHANNEL_PROFILE: Record<ChannelId, { share: number; conversion: number }> = {
  organic: { share: 0.31, conversion: 0.021 },
  paid: { share: 0.22, conversion: 0.027 },
  social: { share: 0.19, conversion: 0.013 },
  email: { share: 0.08, conversion: 0.046 },
  direct: { share: 0.14, conversion: 0.031 },
  referral: { share: 0.06, conversion: 0.024 },
}

/** Monday … Sunday */
const WEEKDAY_FACTOR = [0.95, 0.93, 0.97, 1.0, 1.06, 1.15, 1.1]
/** Jan … Dec */
const MONTH_FACTOR = [0.9, 0.84, 0.95, 0.97, 1.0, 1.05, 0.98, 0.97, 1.0, 1.03, 1.2, 1.17]

const HOUR_WEIGHTS = [
  1.2, 0.7, 0.4, 0.3, 0.2, 0.3, 0.6, 1.2, 2.0, 2.6, 3.0, 3.6, 4.6, 4.4, 3.4, 3.1, 3.2, 3.5, 3.9, 4.4, 5.4,
  5.9, 4.8, 2.7,
]

const REGION_WEIGHTS: Record<RegionId, number> = { tw: 34, jp: 18, hk: 12, sg: 11, my: 8, au: 9, us: 8 }
const SEGMENT_WEIGHTS: [CustomerSegment, number][] = [
  ['standard', 70],
  ['plus', 23],
  ['vip', 7],
]

const FIRST_NAMES = [
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Ava',
  'Ethan',
  'Mia',
  'Lucas',
  'Chloe',
  'Leo',
  'Grace',
  'Ryan',
  'Sophie',
  'Kai',
  'Hana',
  'Yuki',
  'Wei',
  'Jun',
  'Mei',
  'Hao',
  'Ting',
  'Aiden',
  'Isla',
  'Zoe',
  'Ella',
  'Max',
  'Nina',
  'Oscar',
  'Ruby',
  'Sam',
  'Tara',
  'Victor',
  'Wen',
  'Yu',
  'Aria',
  'Ben',
  'Cara',
  'Dylan',
  'Eva',
  'Finn',
]
const LAST_NAMES = [
  'Chen',
  'Lin',
  'Wang',
  'Huang',
  'Tanaka',
  'Sato',
  'Lee',
  'Wong',
  'Tan',
  'Lim',
  'Smith',
  'Brown',
  'Taylor',
  'Wilson',
  'Martin',
  'Nguyen',
  'Kim',
  'Park',
  'Suzuki',
  'Ito',
  'Chang',
  'Liu',
  'Yang',
  'Wu',
  'Ng',
  'Ong',
  'Clark',
  'Hall',
]

const CHANNEL_IDS = CHANNELS.map((c) => c.id)
const REGION_IDS = REGIONS.map((r) => r.id)
const REGION_W = REGION_IDS.map((r) => REGION_WEIGHTS[r])
const PRODUCT_W = PRODUCTS.map((p) => p.weight)
const CHANNEL_SHARE_W = CHANNEL_IDS.map((c) => CHANNEL_PROFILE[c].share)

// ---- Helpers --------------------------------------------------------------

/** 4th Friday of November = Black Friday. */
function isBlackFriday(date: ISODate): boolean {
  const [, m, d] = date.split('-').map(Number)
  return m === 11 && weekdayIndex(date) === 4 && d! >= 22 && d! <= 28
}

function specialDayFactor(date: ISODate): number {
  const md = date.slice(5)
  if (md === '11-11') return 2.3
  if (isBlackFriday(date)) return 1.85
  if (md === '12-12') return 1.6
  if (md === '06-18') return 1.5
  if (md === '11-10' || md === '11-12') return 1.25
  return 1
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function pickName(rng: Rng): string {
  return (
    FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)] +
    ' ' +
    LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
  )
}

function pickSegment(rng: Rng): CustomerSegment {
  return SEGMENT_WEIGHTS[
    weightedIndex(
      rng,
      SEGMENT_WEIGHTS.map((s) => s[1]),
    )
  ]![0]
}

function pickStatus(rng: Rng, ageDays: number): OrderStatus {
  // Recent orders are still pending; old orders are settled.
  const pendingShare = ageDays <= 0 ? 0.7 : ageDays === 1 ? 0.4 : ageDays === 2 ? 0.15 : 0
  const r = rng()
  if (r < pendingShare) return 'pending'
  const settled = (r - pendingShare) / (1 - pendingShare || 1)
  if (settled < 0.055) return 'refunded'
  if (settled < 0.1) return 'cancelled'
  return 'completed'
}

function compactDate(date: ISODate): string {
  return date.slice(2).replace(/-/g, '')
}

// ---- Generator ------------------------------------------------------------

export function generateDataset(options: GenerateOptions): Dataset {
  const { today, days = 800, now = new Date() } = options
  const firstDate = addDays(today, -(days - 1))

  const dataset: Dataset = {
    firstDate,
    lastDate: today,
    dates: [],
    days: new Map(),
    customers: new Map(),
    orders: new Map(),
    customerOrderMonths: new Map(),
    firstOrderMonth: new Map(),
    generatedAt: now.toISOString(),
  }

  // Existing customer base before the dataset starts ("legacy" customers),
  // so returning-customer behaviour looks realistic from day one.
  const pool: Customer[] = []
  const legacyRng = mulberry32(hashString('insightra|legacy'))
  for (let i = 0; i < 6000; i++) {
    const c: Customer = {
      id: 'C-L' + String(i).padStart(5, '0'),
      name: pickName(legacyRng),
      signupDate: addDays(firstDate, -1 - Math.floor(legacyRng() * 540)),
      channel: CHANNEL_IDS[weightedIndex(legacyRng, CHANNEL_SHARE_W)]!,
      region: REGION_IDS[weightedIndex(legacyRng, REGION_W)]!,
      segment: pickSegment(legacyRng),
    }
    pool.push(c)
    dataset.customers.set(c.id, c)
  }

  const hourFraction = Math.max(0.04, (now.getHours() + now.getMinutes() / 60) / 24)
  const currentHour = now.getHours()

  for (let i = 0; i < days; i++) {
    const date = addDays(firstDate, i)
    const rng = mulberry32(hashString('insightra|' + date))
    const isToday = date === today
    const ageDays = diffDays(date, today)
    const month = Number(date.slice(5, 7)) - 1

    const growth = Math.max(0.45, 0.78 + 0.00041 * diffDays(GROWTH_EPOCH, date))
    const special = specialDayFactor(date)
    let demand =
      growth * WEEKDAY_FACTOR[weekdayIndex(date)]! * MONTH_FACTOR[month]! * special * jitter(rng, 0.09)
    if (isToday) demand *= hourFraction

    const totalSessions = BASE_SESSIONS * demand
    const record: DayRecord = {
      date,
      traffic: {} as Record<ChannelId, ChannelTraffic>,
      signups: [],
      orders: [],
    }

    let customerSeq = 0
    const newCustomer = (channel: ChannelId): Customer => {
      const c: Customer = {
        id: 'C-' + compactDate(date) + '-' + String(++customerSeq).padStart(3, '0'),
        name: pickName(rng),
        signupDate: date,
        channel,
        region: REGION_IDS[weightedIndex(rng, REGION_W)]!,
        segment: pickSegment(rng),
      }
      dataset.customers.set(c.id, c)
      record.signups.push(c.id)
      return c
    }

    const dayOrders: Omit<Order, 'id'>[] = []
    const newToday: Customer[] = []

    for (const channel of CHANNEL_IDS) {
      const profile = CHANNEL_PROFILE[channel]
      const sessions = Math.round(totalSessions * profile.share * jitter(rng, 0.15))
      const festivalBoost = special > 1 ? 1.12 : 1
      const conversion = profile.conversion * jitter(rng, 0.12) * festivalBoost
      const purchases = Math.round(sessions * conversion)
      const productViews = Math.round(sessions * (0.55 + rng() * 0.1))
      const checkout = Math.min(productViews, Math.round(purchases / (0.6 + rng() * 0.1)))
      const addToCart = Math.min(
        productViews,
        Math.max(checkout, Math.round(checkout / (0.45 + rng() * 0.1))),
      )

      record.traffic[channel] = {
        sessions,
        activeUsers: Math.round(sessions * (0.7 + rng() * 0.04)),
        productViews,
        addToCart,
        checkout,
        purchases,
      }

      for (let k = 0; k < purchases; k++) {
        const isNew = pool.length === 0 || rng() < 0.4
        let customer: Customer
        if (isNew) {
          customer = newCustomer(channel)
          newToday.push(customer)
        } else {
          // Bias towards more recent customers (they are more likely to come back).
          const idx = Math.floor(pool.length * (1 - rng() ** 2.2))
          customer = pool[Math.min(idx, pool.length - 1)]!
        }

        let hour = weightedIndex(rng, HOUR_WEIGHTS)
        if (isToday) hour = Math.min(hour, currentHour)

        const lineCount = rng() < 0.62 ? 1 : rng() < 0.75 ? 2 : 3
        const lines: OrderLine[] = []
        const used = new Set<string>()
        for (let l = 0; l < lineCount; l++) {
          const product = PRODUCTS[weightedIndex(rng, PRODUCT_W)]!
          if (used.has(product.id)) continue
          used.add(product.id)
          const quantity =
            product.price < 40 && rng() < 0.3 ? 2 + Math.floor(rng() * 2) : rng() < 0.85 ? 1 : 2
          const discount = special > 1 ? 0.85 : rng() < 0.15 ? 0.9 : 1
          lines.push({ productId: product.id, quantity, unitPrice: round2(product.price * discount) })
        }

        dayOrders.push({
          date,
          hour,
          customerId: customer.id,
          channel,
          region: customer.region,
          status: pickStatus(rng, ageDays),
          isNewCustomer: isNew,
          lines,
        })
      }
    }

    // Registrations without a purchase (newsletter / account sign-ups).
    const extraSignups = Math.round(totalSessions * 0.006)
    for (let s = 0; s < extraSignups; s++) {
      newToday.push(newCustomer(CHANNEL_IDS[weightedIndex(rng, CHANNEL_SHARE_W)]!))
    }
    pool.push(...newToday)

    // Stable ids in chronological order: ORD-261120-0001
    dayOrders.sort((a, b) => a.hour - b.hour)
    const prefix = 'ORD-' + compactDate(date) + '-'
    record.orders = dayOrders.map((o, idx) => ({ ...o, id: prefix + String(idx + 1).padStart(4, '0') }))

    const mk = monthKey(date)
    for (const order of record.orders) {
      dataset.orders.set(order.id, order)
      let months = dataset.customerOrderMonths.get(order.customerId)
      if (!months) {
        months = new Set()
        dataset.customerOrderMonths.set(order.customerId, months)
      }
      months.add(mk)
      if (order.isNewCustomer && !dataset.firstOrderMonth.has(order.customerId)) {
        dataset.firstOrderMonth.set(order.customerId, mk)
      }
    }

    dataset.days.set(date, record)
    dataset.dates.push(date)
  }

  return dataset
}
