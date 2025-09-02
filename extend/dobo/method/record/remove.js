import defErrorHandler from '../error-handler.js'
import getRecord from './get.js'

async function recordRemove ({ schema, id, options = {} }) {
  const { importModule } = this.app.bajo
  const { noResult } = options
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const mod = await importModule(`${this.ns}:/dobo/lib/${driver.type}/record-remove.js`)
  const errorHandler = await importModule(`${this.ns}:/dobo/lib/${driver.type}/error-handler.js`)
  let old
  if (!noResult) old = await getRecord.call(this, { schema, id })
  try {
    if (mod) await mod.call(this, { schema, id, options })
    else await instance.client(schema.name).where('id', id).del()
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
  return noResult ? undefined : { oldData: old.data }
}

export default recordRemove
