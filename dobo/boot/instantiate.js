import knex from 'knex'
import modelCreate from '../method/model/create.js'
import modelExists from '../method/model/exists.js'

const stripWarns = [
  '.returning() is not supported by mysql and will not have any effect'
]

const extDialect = {
}

async function instantiate ({ connection, schemas, noRebuild = true }) {
  const { importPkg, currentLoc } = this.app.bajo
  const { fs } = this.app.bajo.lib
  const { merge, pick, find } = this.app.bajo.lib._
  this.instances = this.instances ?? []
  const [, type] = connection.type.split(':')
  const driverPkg = find(this.drivers, { name: type })
  const dialect = driverPkg.dialect ?? type
  let dialectFile = `${currentLoc(import.meta).dir}/dialect/${dialect}.js`
  if (!fs.existsSync(dialectFile)) dialectFile = `knex/lib/dialects/${dialect}/index.js`
  const Dialect = extDialect[type] ?? (await import(dialectFile)).default
  let driver
  try {
    driver = await importPkg(`app:${driverPkg.adapter}`, { thrownNotFound: true })
  } catch (err) {
    throw this.error('Problem with \'%s\' driver file. Not installed yet?', driverPkg.adapter)
  }
  Dialect.prototype._driver = () => driver
  const instance = pick(connection, ['name', 'type'])
  const knexLog = {
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
  instance.client = knex(merge({}, connection, { log: knexLog, client: Dialect }))
  this.instances.push(instance)
  const isMem = type === 'sqlite3' && connection.connection.filename === ':memory:'
  if (isMem) noRebuild = false
  if (noRebuild) return
  for (const schema of schemas) {
    const exists = await modelExists.call(this, schema)
    if (!exists) {
      try {
        await modelCreate.call(this, schema)
        this.log.trace('Model \'%s@%s\' successfully built on the fly', schema.name, connection.name)
      } catch (err) {
        this.fatal('Unable to build modelection \'%s@%s\': %s', schema.name, connection.name, err.message)
      }
    }
  }
}

export default instantiate
