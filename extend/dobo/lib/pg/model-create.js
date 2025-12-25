import { create } from '../../method/model/create.js'

async function applyTable (schema, table) {
  for (const ft of schema.fullText ?? []) {
    for (const f of ft.fields ?? []) {
      table.specificType(f, 'tsvector')
      table.index(f, null, 'gin')
    }
  }
}

async function modelCreate (schema) {
  await create.call(this.schema, applyTable)
}

export default modelCreate
