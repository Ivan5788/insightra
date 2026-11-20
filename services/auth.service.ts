import type { AuthUser } from '~/types/app'
import { apiPost } from './http'

export const authService = {
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    return (await apiPost<{ user: AuthUser; token: string }>('/api/auth/login', { email, password })).data
  },

  async forgotPassword(email: string): Promise<string> {
    return (await apiPost<{ message: string }>('/api/auth/forgot-password', { email })).data.message
  },
}
