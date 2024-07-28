const stype = {
  integer: 'int',
  smallint: 'int',
  text: 'string',
  string: 'string',
  float: 'float',
  double: 'float',
  boolean: 'bool',
  date: 'timestamp',
  datetime: 'timestamp',
  time: 'timestamp',
  timestamp: 'timestamp',
  object: 'text',
  array: 'text'
}

async function modelCreate (schema) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  await instance.client.schema.createTable(schema.modelName, table => {
    for (const p of schema.properties) {
      if (p.name === 'id') continue
      if (schema.fullText.fields.includes(p.name)) table.specificType(p.name, 'string attribute indexed')
      else table.specificType(p.name, stype[p.type])
    }
    if (schema.engine) table.engine(`'${schema.engine}'`)
  })
}

export default modelCreate
