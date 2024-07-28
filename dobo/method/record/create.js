import getRecord from './get.js'

async function recordCreate ({ schema, body, options = {} }) {
  const { isSet, importModule, currentLoc } = this.app.bajo
  const { noResult } = options
  const { getInfo } = this.app.dobo
  const { pick } = this.app.bajo.lib._
  const { instance, returning, driver } = getInfo(schema)

  for (const p of schema.properties) {
    if (['object', 'array'].includes(p.type) && isSet(body[p.name])) body[p.name] = JSON.stringify(body[p.name])
  }
  let result
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/record-create.js`)
  if (mod) result = await mod.call(this, { schema, body, options })
  else result = await instance.client(schema.modelName).insert(body, ...returning)
  if (noResult) return
  if (!driver.returning) {
    const resp = await getRecord.call(this, { schema, id: result[0], options: { thrownNotFound: false } })
    if (returning[0].length > 0) resp.data = pick(resp.data, returning[0])
    result = [resp.data]
  }
  return { data: result[0] }
}

export default recordCreate
