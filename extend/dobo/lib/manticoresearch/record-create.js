import sanitizeInput from './_sanitize-input.js'

async function recordCreate ({ schema, body, options } = {}) {
  const { isSet } = this.app.lib.aneka
  const { generateId } = this.app.lib.aneka
  const { getInfo } = this.app.dobo
  const { instance, returning } = getInfo(schema)
  const nbody = sanitizeInput.call(this, body, schema)
  if (!isSet(nbody.id)) nbody.id = generateId('int')
  return await instance.client(schema.name).insert(nbody, ...returning)
}

export default recordCreate
