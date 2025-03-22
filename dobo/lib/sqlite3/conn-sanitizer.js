import path from 'path'

async function connSanitizer (item) {
  const { getPluginDataDir } = this.app.bajo
  const { fs } = this.lib
  if (!item.connection) this.fatal('keyIsRequired%s%s', 'connection', item.name, { payload: item })
  const { isEmpty, pick } = this.lib._
  const newItem = pick(item, ['name', 'type', 'connection'])
  if (!item.connection.filename) this.fatal('keyIsRequired%s%s', 'filename', item.name, { payload: item })
  const isMem = item.connection.filename === ':memory:'
  const isAbs = path.isAbsolute(item.connection.filename)
  const isUp = item.connection.filename.startsWith('../')
  if (!(isMem || isAbs || isUp)) {
    let file = `${getPluginDataDir('dobo')}/db/${item.connection.filename}`
    const ext = path.extname(file)
    if (isEmpty(ext)) file += '.sqlite3'
    fs.ensureDirSync(path.dirname(file))
    newItem.connection.filename = file
  }
  newItem.useNullAsDefault = true
  newItem.memory = item.connection.filename === ':memory:'
  return newItem
}

export default connSanitizer
