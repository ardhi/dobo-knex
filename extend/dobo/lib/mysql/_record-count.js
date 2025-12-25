import applyFulltext from './_apply-fulltext.js'

async function count ({ schema, filter = {}, options = {} } = {}) {
  const { importPkg } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  let result = instance.client(schema.name)
  if (filter.query) result = mongoKnex(result, filter.query)
  await applyFulltext.call(this, schema, result, filter.match)
  result = await result.count('*', { as: 'cnt' })
  return result[0].cnt
}

export default count
