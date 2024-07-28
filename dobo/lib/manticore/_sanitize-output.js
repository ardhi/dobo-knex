function sanitizeOutput (body, schema) {
  const { dayjs } = this.app.bajo.lib
  const nbody = {}
  for (const k in body) {
    const v = body[k]
    const prop = schema.properties.find(p => k === p.name.toLowerCase())
    if (!prop) continue
    nbody[prop.name] = v
    if ([undefined, null].includes(v)) continue
    switch (prop.type) {
      case 'boolean': nbody[prop.name] = v === 1; break
      case 'date':
      case 'time':
      case 'datetime': nbody[prop.name] = v === 0 ? null : dayjs.unix(v).toDate(); break
      case 'timestamp': nbody[prop.name] = v === 0 ? null : v
    }
  }
  return nbody
}

export default sanitizeOutput
