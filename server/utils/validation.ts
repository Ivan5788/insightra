import { z } from 'zod'
import type { H3Event } from 'h3'
import { createError, getQuery } from 'h3'
import { CATEGORY_IDS, CHANNEL_IDS, REGION_IDS } from '~/data/catalog'
import { isValidISODate, rangeLength } from '~/utils/date'

/**
 * Request validation with Zod.
 * Query strings are untrusted user input — validate shape, enums and
 * limits before touching data. Invalid requests get a clear 400 error.
 */

export const isoDate = z.string().refine(isValidISODate, { message: 'Expected a date in YYYY-MM-DD format' })

export const MAX_RANGE_DAYS = 800

/** UI language for labels in the response. Data and numbers never depend on it. */
export const langSchema = z.enum(['en', 'zh-TW']).default('en')

export const filterShape = {
  lang: langSchema,
  from: isoDate,
  to: isoDate,
  channel: z.enum(CHANNEL_IDS).optional(),
  category: z.enum(CATEGORY_IDS).optional(),
  region: z.enum(REGION_IDS).optional(),
  productId: z
    .string()
    .regex(/^p-\d{3}$/)
    .optional(),
}

type RangeLike = { from: string; to: string }

/** Shared cross-field rules for every schema that has from/to. */
export function checkRange(value: RangeLike, ctx: z.RefinementCtx): void {
  if (value.from > value.to) {
    ctx.addIssue({ code: 'custom', message: '"from" must be on or before "to"', path: ['from'] })
  } else if (rangeLength(value) > MAX_RANGE_DAYS) {
    ctx.addIssue({
      code: 'custom',
      message: 'Date range is limited to ' + MAX_RANGE_DAYS + ' days',
      path: ['to'],
    })
  }
}

export const filterSchema = z.object(filterShape).superRefine(checkRange)

export const granularitySchema = z.enum(['day', 'week', 'month'])

export const seriesMetricSchema = z.enum([
  'revenue',
  'orders',
  'activeUsers',
  'conversionRate',
  'aov',
  'sessions',
  'unitsSold',
  'newCustomers',
  'refundRate',
])

export const dimensionSchema = z.enum(['channel', 'category', 'region', 'product', 'segment'])

export function parseQuery<T>(event: H3Event, schema: z.ZodType<T>): T {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
      data: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  return result.data
}
