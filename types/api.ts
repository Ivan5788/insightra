/**
 * Envelope used by every API response.
 * `meta.mock` is always true for the bundled API so the UI can
 * honestly label numbers as simulated data.
 */
export interface ApiResponse<T> {
  data: T
  meta: ApiMeta
}

export interface ApiMeta {
  mock: boolean
  generatedAt: string
  /** Pagination info (list endpoints only). */
  total?: number
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorShape {
  statusCode: number
  message: string
  details?: unknown
}

export interface DatasetInfo {
  firstDate: string
  lastDate: string
  orders: number
  customers: number
  products: number
}
