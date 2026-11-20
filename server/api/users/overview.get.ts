import { getDataset } from '../../mock/db'
import { apiOk } from '../../utils/response'
import { getUsersOverview } from '../../utils/users'
import { filterSchema, parseQuery } from '../../utils/validation'

/** GET /api/users/overview?from&to — user totals, growth, sources, regions, segments. */
export default defineEventHandler((event) => {
  const filter = parseQuery(event, filterSchema)
  const ds = getDataset()
  return apiOk(ds, getUsersOverview(ds, filter))
})
