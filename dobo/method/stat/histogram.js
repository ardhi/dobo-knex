import defErrorHandler from '../error-handler.js'

async function statHistogram ({ schema, filter = {}, options = {} }) {
  const { importModule, getPluginFile } = this.app.bajo
  const { fs } = this.lib
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  const errorHandler = await importModule(`${this.name}:/dobo/lib/${driver.type}/error-handler.js`)
  try {
    let file = getPluginFile(`${this.name}:/dobo/lib/${driver.type}/stat-histogram-${options.type}.js`)
    if (!fs.existsSync(file)) file = getPluginFile(`${this.name}:/dobo/method/stat/histogram/${options.type}.js`)
    const mod = await importModule(file)
    return await mod.call(this, { schema, filter, options })
  } catch (err) {
    throw errorHandler ? (await errorHandler.call(this, err)) : (await defErrorHandler.call(this, err))
  }
}

export default statHistogram
