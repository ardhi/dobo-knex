async function modelDrop (schema) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  await instance.client.schema.dropTable(schema.modelName)
  if (schema.fullText.fields.length > 0) {
    await instance.client.schema.dropTable(`${schema.modelName}_fts`)
  }
}

export default modelDrop
