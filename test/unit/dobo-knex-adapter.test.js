/* global describe, it, beforeEach */

import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import knexFactory from '../../extend/dobo/adapter/knex.js'
import { createAppStub, Base, createFakeClient } from './_stub.js'

describe('dobo-knex adapter (unit)', () => {
  let app
  let plugin
  let KnexAdapter
  let adapter
  let client
  let model
  let root

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join('/tmp', 'dobo-knex-unit-'))
    app = createAppStub(root)
    plugin = new Base('dobo-knex', app)
    plugin.ns = 'doboKnex'
    plugin.fatal = (msg, ...args) => { throw new Error(`${msg}:${args.join(',')}`) }
    KnexAdapter = await knexFactory.call(plugin)
    app.baseClass.DoboKnexAdapter = KnexAdapter
    adapter = new KnexAdapter(plugin, 'mysql')
    client = createFakeClient()
    model = {
      name: 'Order',
      collName: 'orders',
      engine: 'InnoDB',
      connection: { client },
      properties: [
        { name: 'id', type: 'integer', autoInc: true, required: true, index: 'primary' },
        { name: 'title', type: 'string', maxLength: 50, required: true },
        { name: 'meta', type: 'object' },
        { name: 'items', type: 'array' },
        { name: 'score', type: 'double', unsigned: true },
        { name: 'createdAt', type: 'datetime' }
      ],
      indexes: [
        { name: 'pk_orders', type: 'primary', fields: ['id'] },
        { name: 'uq_orders_title', type: 'unique', fields: ['title'] },
        { name: 'idx_orders_score', type: 'index', fields: ['score'] }
      ],
      getProperties: ({ noVirtual } = {}) => model.properties,
      getIndexes: () => model.indexes,
      countRecord: async () => ({ data: 2, orgCount: 2, warnings: [], hardCapped: false })
    }
  })

  it('exposes static property keys and constructor defaults', () => {
    expect(KnexAdapter.propertyKeys).to.include('specificType')
    expect(adapter.idField.name).to.equal('id')
    expect(adapter.support.uniqueIndex).to.equal(true)
    expect(adapter.support.transaction).to.equal(true)
    expect(adapter.adapter).to.equal(null)
  })

  it('connect configures knex client using dialect file and imported db adapter', async () => {
    adapter.dialectFile = '/mnt/d/Projects/Dobo/dobo-knex/node_modules/knex/lib/dialects/mysql/index.js'
    adapter.dialect = 'mysql'
    const connection = { options: { host: '127.0.0.1', database: 'demo' } }
    await adapter.connect(connection)
    expect(connection.client).to.be.a('function')
  })

  it('selects client, checks existence, builds and drops models', async () => {
    expect(adapter.getClient(model, {})).to.equal(client)
    client._state.schemaTables.push('orders')
    expect((await adapter.modelExists(model)).data).to.equal(true)
    await adapter.buildModel(model)
    expect(client._state.schemaTables).to.include('orders')
    await adapter.dropModel(model)
    expect(client._state.schemaTables).to.not.include('orders')
  })

  it('clears, creates, reads, updates and removes records', async () => {
    client._state.tables.set('orders', [{ id: 1, title: 'A' }])
    expect((await adapter.clearRecord(model)).data).to.equal(true)

    const created = await adapter.createRecord(model, { id: 2, title: 'B' }, { noResult: false })
    expect(created.data.id).to.equal(2)

    client._state.tables.set('orders', [{ id: 2, title: 'B' }])
    const got = await adapter.getRecord(model, 2)
    expect(got.data.title).to.equal('B')

    const updated = await adapter.updateRecord(model, 2, { title: 'C' }, { _data: { id: 2, title: 'B' } })
    expect(updated.data.title).to.equal('C')
    expect(updated.oldData.title).to.equal('B')

    const removed = await adapter.removeRecord(model, 2, { _data: { id: 2, title: 'C' } })
    expect(removed.oldData.id).to.equal(2)
  })

  it('bulk creates, counts and finds records', async () => {
    await adapter.bulkCreateRecord(model, [{ id: 1 }, { id: 2 }])
    expect(client._state.inserted).to.have.length(1)

    client._state.tables.set('orders', [{ id: 1, title: 'A' }, { id: 2, title: 'B' }])
    const count = await adapter.countRecord(model, { query: {} })
    expect(count.data).to.equal(2)

    const found = await adapter.findRecord(model, { query: {}, limit: 10, skip: 0, sort: { id: -1 }, page: 1 }, { count: true })
    expect(found.data).to.have.length(2)
    expect(found.count).to.equal(2)

    const all = await adapter.findAllRecord(model, { query: {}, sort: { id: 1 } }, {})
    expect(all.data).to.have.length(2)
    expect(all.hardCapped).to.equal(true)
  })

  it('creates aggregates and histograms and can reform/raw query results', async () => {
    client._state.tables.set('orders', [{ id: 1, title: 'A' }, { id: 2, title: 'B' }])
    const agg = await adapter.aggregate(model, { query: {}, limit: 10, skip: 0, page: 1 }, { group: 'title', field: 'score', aggregates: ['count'] }, {})
    expect(agg.group).to.equal('title')
    expect(agg.data[0].id).to.match(/^id-/)

    const item = { sql: 'select * from orders limit 10', bindings: [] }
    adapter._reformHistogram({ item, type: 'daily', group: 'createdAt', aggregates: ['count'], field: 'score' })
    expect(item.sql).to.include('group by date')

    const raw = await adapter.getRawResult({ client, toSQL: () => ({ toNative: () => ({ sql: 'select 1', bindings: [] }) }) })
    expect(raw[0].count).to.equal(1)

    const hist = await adapter.histogram(model, { query: {}, limit: 10, skip: 0, page: 1 }, { type: 'yearly', group: 'createdAt', field: 'score', aggregates: ['count'] }, {})
    expect(hist.type).to.equal('yearly')
    expect(hist.data[0].id).to.match(/^id-/)
  })

  it('executes transactions through the client', async () => {
    const result = await adapter.transaction(model, async function (trx, value) { return { trx, value } }, 7)
    expect(result.value).to.equal(7)
    expect(client._state.txCalls).to.have.length(1)
  })
})
