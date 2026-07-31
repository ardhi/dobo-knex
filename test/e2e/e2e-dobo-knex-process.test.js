/* global describe, it */

import { expect } from 'chai'
import { runNodeInline } from './_run.js'

describe('e2e dobo-knex process', () => {
  it('builds plugin and adapter classes and runs adapter methods in separate process', async function () {
    this.timeout(12000)
    const code = `
import factory from './index.js'
import knexFactory from './extend/dobo/adapter/knex.js'
import { createAppStub, Base, createFakeClient } from './test/unit/_stub.js'
const app = createAppStub('/tmp/dobo-knex-e2e')
const DoboKnex = await factory.call({ app }, 'dobo-knex')
const plugin = new DoboKnex()
app.baseClass.DoboKnex = DoboKnex
const Adapter = await knexFactory.call(plugin)
const adapter = new Adapter(plugin, 'mysql')
const client = createFakeClient()
const model = {
  name: 'Order', collName: 'orders', connection: { client },
  properties: [{ name: 'id', type: 'integer', autoInc: true }, { name: 'title', type: 'string', maxLength: 50 }],
  indexes: [{ name: 'pk', type: 'primary', fields: ['id'] }],
  getProperties: () => model.properties,
  getIndexes: () => model.indexes,
  countRecord: async () => ({ data: 1, orgCount: 1, warnings: [], hardCapped: false })
}
const created = await adapter.createRecord(model, { id: 1, title: 'hello' }, {})
const got = await adapter.getRecord(model, 1, {})
console.log('E2E_OK:' + (created.data.id === 1 && got.data.title === 'hello'))
`
    const res = await runNodeInline(code, '/mnt/d/Projects/Dobo/dobo-knex')
    expect(res.code).to.equal(0)
    expect(res.stdout).to.include('E2E_OK:true')
  })
})
