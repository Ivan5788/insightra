import { z } from 'zod'

/**
 * POST /api/auth/forgot-password { email }
 * MOCK: always answers with the same message (never reveals whether an
 * account exists — a real security best practice). No email is sent.
 */
const schema = z.object({ email: z.email() })

export default defineEventHandler(async (event) => {
  const body = schema.safeParse(await readBody(event))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }
  return {
    data: {
      message:
        'If an account exists for this email, a reset link has been sent. (Demo: no email is actually sent.)',
    },
    meta: { mock: true, generatedAt: new Date().toISOString() },
  }
})
