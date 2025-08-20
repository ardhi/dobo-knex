import sanitizeInput from './_sanitize-input.js'

async function recordCreate ({ schema, body, options } = {}) {
  const { isSet } = this.lib.aneka
  const { generateId } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { instance, returning } = getInfo(schema)
  const nbody = sanitizeInput.call(this, body, schema)
  if (!isSet(nbody.id)) nbody.id = generateId('int')
  return await instance.client(schema.name).insert(nbody, ...returning)
}

export default recordCreate
