import defErrorHandler from '../error-handler.js'

async function statAggregate ({ schema, filter = {}, options = {} }) {
  const { importModule, getPluginFile } = this.app.bajo
  const { isString } = this.app.lib._
  const { fs } = this.app.lib
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  options.aggregate = options.aggregate ?? ''
  if (isString(options.aggregate)) options.aggregate = options.aggregate.split(',')
  options.fields = options.fields ?? ['*']
  if (isString(options.fields)) options.fields = options.fields.split(',')

  const errorHandler = await importModule(`${this.ns}:/extend/dobo/lib/${driver.type}/error-handler.js`)
  try {
    let file = getPluginFile(`${this.ns}:/extend/dobo/lib/${driver.type}/stat-aggregate-${options.aggregate}.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.ns}:/extend/dobo/lib/${driver.aggregate}/_stat-aggregate-common.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.ns}:/extend/dobo/method/stat/aggregate/${options.aggregate}.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.ns}:/extend/dobo/method/stat/aggregate/_common.js`)
    const mod = await importModule(file)
    return await mod.call(this, { schema, filter, options })
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
}

export default statAggregate
