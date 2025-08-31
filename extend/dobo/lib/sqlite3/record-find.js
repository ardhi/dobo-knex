import applyFulltext from './_apply-fulltext.js'

async function recordFind ({ schema, filter = {}, options = {} } = {}) {
  const { importPkg } = this.app.bajo
  const { prepPagination, getInfo } = this.app.dobo
  const { forOwn } = this.app.lib._
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const { instance } = getInfo(schema)
  const { noLimit } = options
  const { limit, skip, sort } = await prepPagination(filter, schema)

  let data = instance.client(schema.name)
  if (filter.query) data = mongoKnex(data, filter.query)
  await applyFulltext.call(this, schema, data, filter.match)
  if (!noLimit) data.limit(limit, { skipBinding: true }).offset(skip)
  if (sort) {
    const sorts = []
    forOwn(sort, (v, k) => {
      sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
    })
    data.orderBy(sorts)
  }
  return await data
}

export default recordFind
