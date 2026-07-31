/* global describe, it, beforeEach */

import { expect } from 'chai'
import knexFactory from '../../extend/dobo/adapter/knex.js'
import { createAppStub, Base, createFakeClient } from '../unit/_stub.js'

describe('integration aspect 01 - adapter flow', () => {
  let app
  let adapter
  let model
  let client

  beforeEach(async () => {
    app = createAppStub('/tmp/dobo-knex-int-01')
    const plugin = new Base('dobo-knex', app)
    plugin.ns = 'doboKnex'
    const KnexAdapter = await knexFactory.call(plugin)
    adapter = new KnexAdapter(plugin, 'mysql')
    client = createFakeClient()
    model = {
      name: 'Order',
      collName: 'orders',
      connection: { client },
      properties: [{ name: 'id', type: 'integer', autoInc: true }, { name: 'title', type: 'string', maxLength: 50 }],
      indexes: [{ name: 'pk', type: 'primary', fields: ['id'] }],
      getProperties: () => model.properties,
      getIndexes: () => model.indexes,
      countRecord: async () => ({ data: 1, orgCount: 1, warnings: [], hardCapped: false })
    }
  })

  it('runs create/get/update/remove against the fake client consistently', async () => {
    const created = await adapter.createRecord(model, { id: 1, title: 'hello' }, {})
    expect(created.data.id).to.equal(1)
    const got = await adapter.getRecord(model, 1, {})
    expect(got.data.title).to.equal('hello')
    const updated = await adapter.updateRecord(model, 1, { title: 'changed' }, { _data: { id: 1, title: 'hello' } })
    expect(updated.data.title).to.equal('changed')
    const removed = await adapter.removeRecord(model, 1, { _data: { id: 1, title: 'changed' } })
    expect(removed.oldData.id).to.equal(1)
  })
})
