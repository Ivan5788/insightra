import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { authService } from '~/services/auth.service'
import type { AuthUser } from '~/types/app'
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/**
 * MOCK authentication state.
 * The token is kept in localStorage for the demo only. In production use an
 * httpOnly, Secure, SameSite cookie set by the server (not readable by JS).
 */

const authSchema = z.object({
  token: z.string(),
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.string() }),
})

export const useAuthStore = defineStore('auth', () => {
  const stored = readStorage(STORAGE_KEYS.auth, authSchema)
  const user = ref<AuthUser | null>(stored.ok ? stored.value.user : null)
  const token = ref<string | null>(stored.ok ? stored.value.token : null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string): Promise<void> {
    const result = await authService.login(email, password)
    user.value = result.user
    token.value = result.token
    writeStorage(STORAGE_KEYS.auth, result)
  }

  function logout(): void {
    user.value = null
    token.value = null
    removeStorage(STORAGE_KEYS.auth)
  }

  return { user, token, isAuthenticated, login, logout }
})
