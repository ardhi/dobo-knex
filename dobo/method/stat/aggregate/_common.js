async function common ({ schema, filter, options = {} }) {
  const { importPkg } = this.app.bajo
  const { camelCase } = this.lib._
  const { getInfo, prepPagination, aggregateTypes } = this.app.dobo
  const { instance } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const { limit, skip, sort, page } = await prepPagination(filter, schema, { allowSortUnindexed: true })
  const group = options.group
  if (!group) throw this.error('fieldGroupAggregateMissing')
  const [field] = options.fields ?? []
  if (!field) throw this.error('fieldCalcAggregateMissing')
  let cursor = instance.client(schema.name)
  if (filter.query) cursor = mongoKnex(cursor, filter.query)
  if (!options.noLimit) cursor.limit(limit, { skipBinding: true }).offset(skip)
  cursor.select(group).groupBy(group)
  if (sort) {
    const f = Object.keys(sort)[0]
    let d = sort[f]
    d = d <= 0 ? 'desc' : 'asc'
    cursor.orderBy(f, d)
  }
  for (const t of options.aggregate) {
    if (!aggregateTypes.includes(t)) throw this.error('unsupportedAggregate%s', t)
    cursor[t](field, { as: camelCase(`${field} ${t}`) })
  }
  const data = await cursor
  return { data, page, limit }
}

export default common
