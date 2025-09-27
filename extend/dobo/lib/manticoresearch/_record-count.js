import applyFulltext from './_apply-fulltext.js'

async function count ({ schema, filter = {}, options = {} } = {}) {
  const { importPkg } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  let result = instance.client(schema.name)
  if (filter.query) result = mongoKnex(result, filter.query)
  await applyFulltext.call(this, result, filter.match)
  const item = result.count('*', { as: 'cnt' }).toSQL().toNative()
  item.sql = item.sql.replaceAll('`' + schema.name + '`.', '')
  result = await instance.client.raw(item.sql, item.bindings)
  return result[0][0].cnt
}

export default count
