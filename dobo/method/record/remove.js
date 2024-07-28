import getRecord from './get.js'

async function recordRemove ({ schema, id, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { noResult } = options
  const { getInfo } = this.app.dobo
  const { instance, driver } = getInfo(schema)

  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/record-remove.js`)
  const rec = noResult ? undefined : await getRecord.call(this, { schema, id })
  if (mod) await mod.call(this, { schema, id, options })
  else await instance.client(schema.modelName).where('id', id).del()
  return noResult ? undefined : { oldData: rec.data }
}

export default recordRemove
