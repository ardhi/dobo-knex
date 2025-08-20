async function connSanitizer (payload) {
  payload.connection = payload.connection ?? {}
  payload.connection.port = payload.connection.port ?? 9306
  payload.connection.host = payload.connection.host ?? '127.0.0.1'
  payload.useNullAsDefault = true
  return payload
}

export default connSanitizer
