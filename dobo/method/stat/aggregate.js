import defErrorHandler from '../error-handler.js'

async function statAggregate ({ schema, filter = {}, options = {} }) {
  const { importModule, getPluginFile } = this.app.bajo
  const { fs } = this.app.bajo.lib
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)

  const errorHandler = await importModule(`${this.name}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    let file = getPluginFile(`${this.name}:/dobo/lib/${driver.type}/stat-aggregate-${options.aggregate}.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.name}:/dobo/lib/${driver.aggregate}/_stat-aggregate-common.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.name}:/dobo/method/stat/aggregate/${options.aggregate}.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.name}:/dobo/method/stat/aggregate/_common.js`)
    const mod = await importModule(file)
    return await mod.call(this, { schema, filter, options })
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
}

export default statAggregate
