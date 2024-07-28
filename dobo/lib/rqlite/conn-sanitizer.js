async function connSanitizer (item) {
  if (!item.connection) this.fatal('\'%s@%s\' key is required', 'connection', item.name, { payload: item })
  const { pick } = this.app.bajo.lib._
  const newItem = pick(item, ['name', 'type', 'connection'])
  newItem.connection.host = newItem.connection.host ?? 'localhost'
  newItem.connection.port = newItem.connection.port ?? 4001
  return newItem
}

export default connSanitizer
