import knex from 'knex'
import modelCreate from '../method/model/create.js'
import modelExists from '../method/model/exists.js'

const stripWarns = [
  '.returning() is not supported by mysql and will not have any effect'
]

const extDialect = {
}

async function instantiate ({ connection, schemas, noRebuild = true }) {
  const { importPkg, getPluginFile } = this.app.bajo
  const { fs } = this.app.lib
  const { merge, pick, find } = this.app.lib._
  this.instances = this.instances ?? []
  const [, type] = connection.type.split(':')
  const driverPkg = find(this.drivers, { name: type })
  const dialect = driverPkg.dialect ?? type
  let dialectFile = getPluginFile(`${this.name}:/extend/dobo/boot/dialect/${dialect}.js`)
  if (!fs.existsSync(dialectFile)) dialectFile = `knex/lib/dialects/${dialect}/index.js`
  const client = extDialect[type] ?? (await import(dialectFile)).default
  let driver
  try {
    driver = await importPkg(`main:${driverPkg.adapter}`, { thrownNotFound: true })
  } catch (err) {
    throw this.error('driverNotInstalled%s', driverPkg.adapter)
  }
  client.prototype._driver = () => driver
  const instance = pick(connection, ['name', 'type'])
  const log = {
    error: this.log.error,
    debug: this.log.debug,
    deprecate: this.log.warn,
    warn: msg => {
      let match
      for (const w of stripWarns) {
        if (msg.includes(w)) match = true
      }
      if (match) return
      return this.log.warn(msg)
    }
  }
  instance.client = knex(merge({}, connection, this.config.connOptions, { log, client }))
  this.instances.push(instance)
  const isMem = type === 'sqlite3' && connection.connection.filename === ':memory:'
  if (isMem) noRebuild = false
  if (noRebuild) return
  for (const schema of schemas) {
    const exists = await modelExists.call(this, schema)
    if (!exists) {
      try {
        await modelCreate.call(this, schema)
        this.log.trace('modelBuiltOnthefly%s%s%s', schema.name, connection.name)
      } catch (err) {
        this.fatal('unableBuildModel%s%s%s', schema.name, connection.name, err.message)
      }
    }
  }
}

export default instantiate
