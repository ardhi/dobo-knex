import path from 'path'

async function connSanitizer (item) {
  const { getPluginDataDir } = this.app.bajo
  const { fs } = this.app.lib
  if (!item.connection) this.fatal('keyIsRequired%s%s', 'connection', item.name, { payload: item })
  const { isEmpty, pick } = this.app.lib._
  const newItem = pick(item, ['name', 'type', 'connection'])
  if (!item.connection.filename) this.fatal('keyIsRequired%s%s', 'filename', item.name, { payload: item })
  let file = item.connection.filename
  if (file.indexOf('/') === -1) {
    file = `${getPluginDataDir('dobo')}/db/${file}`
    const ext = path.extname(file)
    if (isEmpty(ext)) file += '.sqlite3'
    fs.ensureDirSync(path.dirname(file))
  } else {
    if (file.indexOf('{appDir}') > -1) file = file.replace('{appDir}', this.app.dir)
    if (file.indexOf('{dataDir}') > -1) file = file.replace('{dataDir}', this.app.bajo.dir.data)
    if (file.indexOf('{tmp-dir}') > -1) file = file.replace('{tmp-dir}', this.app.bajo.dir.tmp)
  }
  newItem.connection.filename = file
  newItem.useNullAsDefault = true
  newItem.memory = item.connection.filename === ':memory:'
  return newItem
}

export default connSanitizer
