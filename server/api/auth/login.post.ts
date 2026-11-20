import { z } from 'zod'
import type { AuthUser } from '~/types/app'

/**
 * POST /api/auth/login  { email, password }
 *
 * MOCK AUTHENTICATION — for demo purposes only.
 * Accepts the demo account below. A real implementation would verify a
 * password hash and set an httpOnly session cookie instead of returning
 * a token to JavaScript.
 */
const DEMO_EMAIL = 'demo@insightra.app'
const DEMO_PASSWORD = 'insightra2026'

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
})

export default defineEventHandler(async (event) => {
  const body = schema.safeParse(await readBody(event))
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please enter a valid email and a password of at least 8 characters.',
    })
  }
  const { email, password } = body.data
  if (email.toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect email or password.' })
  }
  const user: AuthUser = { id: 'u-001', name: 'Alex Morgan', email: DEMO_EMAIL, role: 'Head of E-commerce' }
  return {
    data: { user, token: 'mock-token-' + Date.now().toString(36) },
    meta: { mock: true, generatedAt: new Date().toISOString() },
  }
})
