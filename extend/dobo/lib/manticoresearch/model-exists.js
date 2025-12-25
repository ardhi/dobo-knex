async function modelExists (schema) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  const tables = await instance.client.raw(`show tables like '${schema.name}'`)
  return tables[0].length > 0
}

export default modelExists
