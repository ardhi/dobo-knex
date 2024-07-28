async function statAggregate ({ schema, filter = {}, options = {} }) {
  const { importModule, currentLoc } = this.app.bajo
  const { fs } = this.app.bajo.lib
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)

  let file = `${currentLoc(import.meta).dir}/../../lib/${driver.type}/stat-aggregate-${options.aggregate}.js`
  if (!fs.existsSync(file)) file = `${currentLoc(import.meta).dir}/../../lib/${driver.aggregate}/_stat-aggregate-common.js`
  if (!fs.existsSync(file)) file = `${currentLoc(import.meta).dir}/aggregate/${options.aggregate}.js`
  if (!fs.existsSync(file)) file = `${currentLoc(import.meta).dir}/aggregate/_common.js`
  const mod = await importModule(file)
  return await mod.call(this, { schema, filter, options })
}

export default statAggregate
