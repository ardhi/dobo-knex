import defErrorHandler from '../error-handler.js'

async function modelClear ({ schema, options = {} }) {
  const { importModule } = this.app.bajo
  const { truncate = true } = options
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const method = truncate ? 'truncate' : 'del'
  const mod = await importModule(`${this.name}:/dobo/lib/${driver.type}/model-clear.js`)
  const errorHandler = await importModule(`${this.name}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) await mod.call(this, { schema, options })
    else await instance.client(schema.name)[method]()
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
  return true
}

export default modelClear
