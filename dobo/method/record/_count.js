import defErrorHandler from '../error-handler.js'

async function count ({ schema, type, filter = {}, options = {} }) {
  const { importModule, importPkg } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  // count
  let result
  const mod = await importModule(`${this.name}:/dobo/lib/${driver.type}/_record-count.js`)
  const errorHandler = await importModule(`${this.name}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) result = await mod.call(this, { schema, filter, options })
    else {
      result = instance.client(schema.name)
      if (filter.query) result = mongoKnex(result, filter.query)
      result = await result.count('*', { as: 'cnt' })
      result = result[0].cnt
    }
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
  return { data: result }
}

export default count
