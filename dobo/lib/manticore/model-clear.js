async function modelClear ({ schema } = {}) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  await instance.client.raw(`truncate table ${schema.name}`)
}

export default modelClear
