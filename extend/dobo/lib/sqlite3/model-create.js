import { create } from '../../method/model/create.js'

async function modelCreate (schema) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  await create.call(this, schema)

  function printCols (prefix) {
    let cols = [...schema.fullText.fields]
    if (prefix) cols = cols.map(c => `${prefix}.${c}`)
    return cols.join(', ')
  }

  if (schema.fullText.fields.length > 0) {
    const columns = schema.fullText.fields.join(', ')
    const stmtSchema = `
      CREATE VIRTUAL TABLE ${schema.name}_fts USING fts5 (
        ${printCols()}, content = '${schema.name}', content_rowid = 'id'
      );
    `
    const stmtTriggerInsert = `
      CREATE TRIGGER ${schema.name}_fts_insert AFTER INSERT ON ${schema.name}
      BEGIN
        INSERT INTO ${schema.name}_fts (rowid, ${columns}) VALUES (new.id, ${printCols('new')});
      END;
    `
    const stmtTriggerDelete = `
      CREATE TRIGGER ${schema.name}_fts_delete AFTER DELETE ON ${schema.name}
      BEGIN
        INSERT INTO ${schema.name}_fts (${schema.name}_fts, rowid, ${columns}) VALUES ('delete', old.id, ${printCols('old')});
      END;
    `

    const stmtTriggerUpdate = `
      CREATE TRIGGER ${schema.name}_fts_update AFTER UPDATE ON ${schema.name}
      BEGIN
        INSERT INTO ${schema.name}_fts (${schema.name}_fts, rowid, ${columns}) VALUES ('delete', old.id, ${printCols('old')});
        INSERT INTO ${schema.name}_fts (rowid, ${columns}) VALUES (new.id, ${printCols('new')});
      END;
    `
    await instance.client.raw(stmtSchema)
    await instance.client.raw(stmtTriggerInsert)
    await instance.client.raw(stmtTriggerDelete)
    await instance.client.raw(stmtTriggerUpdate)
  }
}

export default modelCreate
