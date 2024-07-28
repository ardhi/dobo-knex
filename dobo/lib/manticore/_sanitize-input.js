function sanitizeInput (body, schema) {
  const { dayjs } = this.app.bajo.lib
  const nbody = {}
  for (const k in body) {
    const v = body[k]
    nbody[k] = v
    const prop = schema.properties.find(p => p.name === k)
    if (!prop || v === undefined) continue
    switch (prop.type) {
      case 'string':
      case 'text': nbody[k] = v === null ? '' : v; break
      case 'integer':
      case 'smallint':
      case 'float':
      case 'double': nbody[k] = v === null ? 0 : v; break
      case 'boolean': nbody[k] = v ? 1 : 0; break
      case 'date':
      case 'time':
      case 'timestamp':
      case 'datetime': nbody[k] = v === null ? 0 : dayjs(v).unix(); break
    }
  }
  return nbody
}

export default sanitizeInput
