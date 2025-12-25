import defErrorHandler from '../error-handler.js'

async function modelExists ({ schema, options = {} }) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)
  const mod = await importModule(`${this.ns}:/dobo/lib/${driver.type}/model-exists.js`)
  const errorHandler = await importModule(`${this.ns}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) return await mod.call(this, schema)
    const exists = await instance.client.schema.hasTable(schema.name)
    return !!exists
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
}

export default modelExists
