import type { ApiResponse } from '~/types/api'
import { getLang, tt } from '~/utils/locale'
import { ApiError } from './errors'

export { ApiError }

/**
 * Thin HTTP layer on top of Nuxt's $fetch (ofetch).
 *
 * Responsibilities:
 *  - base URL from runtime config (swap mock API → real API with an env var)
 *  - drop empty query params
 *  - normalise every failure into ApiError so the UI handles one error type
 */

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

function cleanQuery(query: QueryParams = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v
  }
  return out
}

interface FetchErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: { statusMessage?: string; message?: string; data?: unknown }
}

function toApiError(error: unknown): ApiError {
  const e = (error ?? {}) as FetchErrorLike
  const status = e.statusCode ?? 0
  const message =
    e.data?.statusMessage ??
    e.data?.message ??
    e.statusMessage ??
    (status === 0
      ? tt('Network error — please check your connection.', '網路錯誤，請檢查連線。')
      : (e.message ?? tt('Request failed', '請求失敗')))
  return new ApiError(status, message, e.data?.data)
}

function baseURL(): string {
  return useRuntimeConfig().public.apiBase || ''
}

export async function apiGet<T>(path: string, query?: QueryParams): Promise<ApiResponse<T>> {
  try {
    // Every request carries the UI language so the API can localize labels.
    return await $fetch<ApiResponse<T>>(path, {
      baseURL: baseURL(),
      query: cleanQuery({ lang: getLang(), ...query }),
      retry: 1,
    })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    return await $fetch<ApiResponse<T>>(path, { baseURL: baseURL(), method: 'POST', body })
  } catch (error) {
    throw toApiError(error)
  }
}
