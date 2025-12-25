import defErrorHandler from '../error-handler.js'
import getRecord from './get.js'

async function recordUpdate ({ schema, id, body, options }) {
  const { isSet } = this.app.lib.aneka
  const { importModule } = this.app.bajo
  const { noResult } = options
  const { getInfo } = this.app.dobo
  const { pick } = this.app.lib._
  const { instance, returning, driver } = getInfo(schema)

  for (const p of schema.properties) {
    if (['object', 'array'].includes(p.type) && isSet(body[p.name])) body[p.name] = JSON.stringify(body[p.name])
  }
  const old = await getRecord.call(this, { schema, id })
  let result
  const mod = await importModule(`${this.ns}:/dobo/lib/${driver.type}/record-update.js`)
  const errorHandler = await importModule(`${this.ns}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    if (mod) result = await mod.call(this, { schema, id, body, oldBody: old.data, options })
    else result = await instance.client(schema.name).where('id', id).update(body, ...returning)
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
  if (noResult) return
  if (!driver.returning) {
    const resp = await getRecord.call(this, { schema, id, options: { thrownNotFound: false } })
    if (returning[0].length > 0) resp.data = pick(resp.data, returning[0])
    result = [resp.data]
  }
  return { oldData: old.data, data: result[0] }
}

export default recordUpdate
