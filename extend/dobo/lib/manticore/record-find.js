import sanitizeOutput from './_sanitize-output.js'
import applyFulltext from './_apply-fulltext.js'

async function recordFind ({ schema, filter = {}, options = {} } = {}) {
  const { importPkg } = this.app.bajo
  const { dayjs } = this.app.lib
  const { prepPagination, getInfo } = this.app.dobo
  const { forOwn, get } = this.app.lib._
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const cfg = this.app.doboKnex.config
  const { instance } = getInfo(schema)
  const { noLimit } = options
  const { limit, skip, sort } = await prepPagination(filter, schema)

  let data = instance.client(schema.name)
  if (filter.query) data = mongoKnex(data, filter.query)
  await applyFulltext.call(this, data, filter.match)
  if (!noLimit) data.limit(limit, { skipBinding: true }).offset(skip)
  if (sort) {
    const sorts = []
    forOwn(sort, (v, k) => {
      sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
    })
    data.orderBy(sorts)
  }
  const item = data.toSQL().toNative()
  item.sql = item.sql.replaceAll('`' + schema.name + '`.', '')
  const maxMatches = get(options, 'req.headers.x-max-matches', cfg.manticore.maxMatches)
  item.sql += ` option max_matches=${maxMatches}`
  for (const i in item.bindings) {
    const val = item.bindings[i]
    if (val instanceof Date) item.bindings[i] = dayjs(val).unix()
  }
  const result = await instance.client.raw(item.sql, item.bindings)
  return result[0].map(r => {
    return sanitizeOutput.call(this, r, schema)
  })
}

export default recordFind
