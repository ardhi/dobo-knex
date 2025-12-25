import sanitizeOutput from './_sanitize-output.js'

async function recordGet ({ schema, id, options } = {}) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const result = await instance.client(schema.name).where('id', id)
  return result.map(r => {
    return sanitizeOutput.call(this, r, schema)
  })
}

export default recordGet
