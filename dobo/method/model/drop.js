async function modelDrop ({ schema, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/model-drop.js`)
  if (mod) return await mod.call(this, schema)
  return await instance.client.schema.dropTable(schema.modelName)
}

export default modelDrop
