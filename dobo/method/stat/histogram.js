async function statHistogram ({ schema, filter = {}, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { fs } = this.app.bajo.lib
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  let file = `${currentLoc(import.meta).dir}/../../lib/${driver.type}/stat-histogram-${options.type}.js`
  if (!fs.existsSync(file)) file = `${currentLoc(import.meta).dir}/histogram/${options.type}.js`
  const mod = await importModule(file)
  return await mod.call(this, { schema, filter, options })
}

export default statHistogram
