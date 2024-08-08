async function modelExists ({ schema, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/model-exists.js`)
  if (mod) return await mod.call(this, schema)
  const exists = await instance.client.schema.hasTable(schema.modelName)
  return !!exists
}

export default modelExists
