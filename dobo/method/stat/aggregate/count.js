async function count ({ schema, filter, options = {} }) {
  const { importPkg } = this.app.bajo
  const { camelCase } = this.app.bajo.lib._
  const { getInfo, prepPagination } = this.app.dobo
  const { instance } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const { limit, skip, sort, page } = await prepPagination(filter, schema, { allowSortUnindexed: true })
  const fields = options.fields ?? ['*']
  const [field] = fields
  let cursor = instance.client(schema.name)
  if (filter.query) cursor = mongoKnex(cursor, filter.query)
  if (field === '*') {
    const data = await cursor.count(field, { as: 'count' })
    return { data, page, limit }
  }
  const colName = camelCase(`${field} count`)
  if (!options.noLimit) cursor.limit(limit, { skipBinding: true }).offset(skip)
  cursor.select(field).groupBy(field)
  if (sort) {
    const f = Object.keys(sort)[0]
    let d = sort[f]
    d = d <= 0 ? 'desc' : 'asc'
    cursor.orderBy(f, d)
  }
  const data = await cursor.count(field, { as: colName })
  return { data, page, limit }
}

export default count
