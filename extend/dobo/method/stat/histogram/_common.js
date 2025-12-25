async function common ({ handler, schema, filter, options = {} }) {
  const { importPkg } = this.app.bajo
  const { getInfo, prepPagination } = this.app.dobo
  const { instance } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const { limit, skip, sort, page } = await prepPagination(filter, schema, { allowSortUnindexed: true })
  let cursor = instance.client(schema.name)
  const [field] = options.fields ?? []
  if (!field) throw this.error('baseFieldForHistogramMissing')
  const prop = schema.properties.find(p => p.name === field)
  if (!prop) throw this.error('unknownBaseFieldForHistogram%s', field)
  if (!['datetime', 'date'].includes(prop.type)) throw this.error('fieldTypeMustBeDatetime%s%s', field, schema.name)
  const aggregate = options.aggregate ?? 'count'
  const group = aggregate === 'count' ? '*' : options.group
  if (filter.query) cursor = mongoKnex(cursor, filter.query)
  if (!options.noLimit) cursor.limit(limit, { skipBinding: true }).offset(skip)
  if (sort) {
    // const f = Object.keys(sort)[0]
    // let d = sort[f]
    // d = d <= 0 ? 'desc' : 'asc'
    // cursor.orderBy(f, d)
  }
  const item = cursor.toSQL().toNative()
  await handler.call(this, { field, item, schema, aggregate, group })
  const result = await instance.client.raw(item.sql, item.bindings)
  return { data: result[0], page, limit }
}

export default common
