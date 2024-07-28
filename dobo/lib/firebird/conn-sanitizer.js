import path from 'path'

async function connSanitizer (item) {
  const { resolvePath, getPluginDataDir } = this.app.bajo
  const { fs } = this.app.bajo.lib
  if (!item.connection) this.fatal('\'%s@%s\' key is required', 'connection', item.name, { payload: item })
  const { isEmpty, pick } = this.app.bajo.lib._
  const newItem = pick(item, ['name', 'type', 'connection'])
  for (const i of ['database', 'user', 'password']) {
    if (!item.connection[i]) this.fatal('\'%s@%s\' key is required', i, item.name, { payload: item })
  }
  if (!path.isAbsolute(item.connection.database)) {
    let file = resolvePath(`${getPluginDataDir(this.name)}/db/${item.connection.database}`)
    const ext = path.extname(file)
    if (isEmpty(ext)) file += '.fdb'
    fs.ensureDirSync(path.dirname(file))
    newItem.connection.database = file
  }
  newItem.connection.host = newItem.connection.host ?? 'localhost'
  newItem.connection.port = newItem.connection.port ?? 3050
  newItem.createDatabaseIfNotExists = true
  return newItem
}

export default connSanitizer
