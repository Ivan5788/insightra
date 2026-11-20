import type { ValueFormat } from '~/utils/format'

/** Column definition for the generic DataTable. */
export interface DataColumn<T> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  format?: ValueFormat
  /** Custom accessor; defaults to row[key]. */
  value?: (row: T) => string | number | null | undefined
  /** Hidden from the card layout on small screens. */
  hideOnMobile?: boolean
  /** Can't be hidden from the column picker. */
  required?: boolean
  width?: string
}
