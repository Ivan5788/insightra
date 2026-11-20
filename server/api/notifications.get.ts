import { z } from 'zod'
import { withLang } from '~/utils/locale'
import { getDataset } from '../mock/db'
import { getNotifications } from '../utils/feed'
import { apiOk } from '../utils/response'
import { langSchema, parseQuery } from '../utils/validation'

const schema = z.object({ lang: langSchema })

/** GET /api/notifications — system notifications derived from the data. Read state is kept client-side. */
export default defineEventHandler((event) => {
  const { lang } = parseQuery(event, schema)
  const ds = getDataset()
  return apiOk(
    ds,
    withLang(lang, () => getNotifications(ds)),
  )
})
