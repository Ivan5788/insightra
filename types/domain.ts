/**
 * Domain model — the "raw" business entities of the e-commerce store
 * that Insightra analyses. These shapes mirror what a real backend
 * (orders service, CRM, web analytics) would return.
 */

/** Calendar date in ISO format: 'YYYY-MM-DD' (no time, no timezone). */
export type ISODate = string

export type ChannelId = 'organic' | 'paid' | 'social' | 'email' | 'direct' | 'referral'
export type CategoryId = 'electronics' | 'home' | 'fashion' | 'beauty' | 'sports' | 'books'
export type RegionId = 'tw' | 'jp' | 'hk' | 'sg' | 'my' | 'au' | 'us'
export type CustomerSegment = 'standard' | 'plus' | 'vip'
export type OrderStatus = 'completed' | 'pending' | 'refunded' | 'cancelled'

export interface Channel {
  id: ChannelId
  label: string
}

export interface Category {
  id: CategoryId
  label: string
}

export interface Region {
  id: RegionId
  label: string
}

export interface Product {
  id: string
  name: string
  category: CategoryId
  /** Unit list price in USD. */
  price: number
  /** Relative popularity used by the mock generator. */
  weight: number
}

export interface Customer {
  id: string
  name: string
  signupDate: ISODate
  channel: ChannelId
  region: RegionId
  segment: CustomerSegment
}

export interface OrderLine {
  productId: string
  quantity: number
  /** Price actually paid per unit (after discounts). */
  unitPrice: number
}

export interface Order {
  id: string
  date: ISODate
  /** Hour of day 0–23 (store local time). */
  hour: number
  customerId: string
  channel: ChannelId
  region: RegionId
  status: OrderStatus
  /** True if this was the customer's first purchase. */
  isNewCustomer: boolean
  lines: OrderLine[]
}

/** Daily web-analytics funnel per acquisition channel. */
export interface ChannelTraffic {
  sessions: number
  activeUsers: number
  productViews: number
  addToCart: number
  checkout: number
  purchases: number
}
