async function modelClear ({ schema, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { truncate = true } = options
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const method = truncate ? 'truncate' : 'del'
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/model-clear.js`)
  if (mod) await mod.call(this, { schema, options })
  else await instance.client(schema.modelName)[method]()
  return true
}

export default modelClear
