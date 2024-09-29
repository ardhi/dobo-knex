import defErrorHandler from '../error-handler.js'

async function modelDrop ({ schema, options = {} }) {
  const { importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const mod = await importModule(`${this.name}:/dobo/lib/${driver.type}/model-drop.js`)
  const errorHandler = await importModule(`${this.name}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) return await mod.call(this, schema)
    return await instance.client.schema.dropTable(schema.modelName)
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
}

export default modelDrop
