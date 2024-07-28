async function count ({ schema, type, filter = {}, options = {} }) {
  const { importModule, currentLoc, importPkg } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  // count
  let result
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/_record-count.js`)
  if (mod) result = await mod.call(this, { schema, filter, options })
  else {
    result = instance.client(schema.modelName)
    if (filter.query) result = mongoKnex(result, filter.query)
    result = await result.count('*', { as: 'cnt' })
    result = result[0].cnt
  }
  return { data: result }
}

export default count
