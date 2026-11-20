import type { DrillLevel, DrillView } from '~/types/drilldown'
import { apiGet } from './http'

export const drilldownService = {
  async view(level: DrillLevel): Promise<DrillView> {
    return (await apiGet<DrillView>('/api/drilldown', { kind: level.kind, ...level.params })).data
  },
}
