import type { ApiMeta, ApiResponse } from '~/types/api'
import type { Dataset } from '../mock/generator'

/** Wrap data in the standard response envelope. */
export function apiOk<T>(ds: Dataset, data: T, meta: Partial<ApiMeta> = {}): ApiResponse<T> {
  return { data, meta: { mock: true, generatedAt: ds.generatedAt, ...meta } }
}
