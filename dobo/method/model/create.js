export async function create (schema, applyTable, applyColumn) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  const { has, omit, cloneDeep, isEmpty } = this.app.bajo.lib._
  await instance.client.schema.createTable(schema.modelName, table => {
    for (let p of schema.properties) {
      p = cloneDeep(p)
      if (p.specificType) {
        table.specificType(p.name, p.specificType)
        continue
      }
      if (['object', 'array'].includes(p.type)) p.type = 'text'
      const args = []
      for (const a of ['maxLength', 'precision', 'kind']) {
        if (has(p, a)) args.push(p[a])
        if (a === 'precision' && has(p, 'scale')) args.push(p.scale)
      }
      let col
      if (p.autoInc && ['smallint', 'integer'].includes(p.type)) col = table.increments(p.name)
      else if (p.specificType) table.specificType(p.name, p.specificType)
      else col = table[p.type](p.name, ...args)
      if (p.index) {
        const opts = omit(p.index, ['name', 'type'])
        if (p.index.type === 'primary') {
          if (p.index.name) opts.constraintName = p.index.name
          col.primary(isEmpty(opts) ? undefined : opts)
        } else if (p.index.type === 'unique') {
          if (p.index.name) opts.indexName = p.index.name
          col.unique(isEmpty(opts) ? undefined : opts)
        } else {
          col.index(p.index.name, isEmpty(opts) ? undefined : opts)
        }
      }
      if (p.required) col.notNullable()
      // if (p.default) col.defaultTo(p.default)
      if (p.unsigned && ['integer', 'smallint', 'float', 'double'].indexOf(p.type)) col.unsigned()
      if (p.comment) col.comment(p.comment)
      if (applyColumn) applyColumn.call(this, schema, table, col)
    }
    for (const idx of schema.indexes ?? []) {
      const opts = omit(idx, ['name', 'unique', 'fields'])
      if (idx.name) opts.indexName = idx.name
      if (idx.unique) table.unique(idx.fields, opts)
      else table.index(idx.fields, idx.name, opts)
    }
    if (applyTable) applyTable.call(this, schema, table)
  })
}

async function modelCreate ({ schema, options = {} }) {
  const { currentLoc, importModule } = this.app.bajo
  const { getInfo } = this.app.dobo
  const { driver } = getInfo(schema)
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/model-create.js`)
  if (mod) return await mod.call(this, schema)
  return await create.call(this, schema)
}

export default modelCreate
