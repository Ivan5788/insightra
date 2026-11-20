/** Normalised payload emitted by BaseChart on click. */
export interface ChartClickEvent {
  name: string
  dataIndex: number
  seriesName?: string
  value: unknown
}
