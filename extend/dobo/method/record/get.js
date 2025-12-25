import defErrorHandler from '../error-handler.js'

async function recordGet ({ schema, id, options = {} }) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)
  const { thrownNotFound = true } = options

  let result
  const mod = await importModule(`${this.ns}:/dobo/lib/${driver.type}/record-get.js`)
  const errorHandler = await importModule(`${this.ns}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) result = await mod.call(this, { schema, id, options })
    else result = await instance.client(schema.name).where('id', id)
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
  if (result.length === 0 && thrownNotFound) throw this.error('recordNotFound%s%s', id, schema.name, { statusCode: 404 })
  return { data: result[0] }
}

export default recordGet
