import fs from 'fs'

export const isPlainObject = (v) => Object.prototype.toString.call(v) === '[object Object]'
export const isArray = Array.isArray
export const isEmpty = (v) => {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (isPlainObject(v)) return Object.keys(v).length === 0
  return false
}
export const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj ?? {}, k)
export const omit = (obj = {}, drop = []) => {
  const items = Array.isArray(drop) ? drop : [drop]
  const out = {}
  for (const k in obj) if (!items.includes(k)) out[k] = obj[k]
  return out
}
export const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj))
export const forOwn = (obj = {}, fn) => { for (const k of Object.keys(obj)) fn(obj[k], k) }
export const get = (obj, p, fallback) => {
  const parts = String(p).split('.')
  let cur = obj
  for (const part of parts) {
    if (cur == null) return fallback
    cur = cur[part]
  }
  return cur === undefined ? fallback : cur
}
export const defaultsDeep = (...items) => {
  const out = {}
  const apply = (target, src) => {
    if (!isPlainObject(src)) return target
    for (const k of Object.keys(src)) {
      const sv = src[k]
      if (isPlainObject(sv)) target[k] = apply(isPlainObject(target[k]) ? target[k] : {}, sv)
      else if (target[k] === undefined) target[k] = sv
    }
    return target
  }
  for (const item of items) apply(out, item)
  return out
}
let gid = 0
export const generateId = () => `id-${++gid}`

export class Base {
  constructor (pkgName, app) {
    this.pkgName = pkgName
    this.app = app
    this.ns = pkgName.replace(/-([a-z])/g, (_m, c) => c.toUpperCase())
    this.alias = this.ns
    this.config = {}
    this.log = { trace: () => {}, debug: () => {}, warn: () => {}, error: () => {} }
  }
  t = (text) => text
  error = (msg, ...args) => new Error(`${msg}:${args.join(',')}`)
  fatal = (msg, ...args) => { throw new Error(`${msg}:${args.join(',')}`) }
}

export class DoboAdapter {
  constructor (plugin, name, options = {}) {
    this.plugin = plugin
    this.app = plugin.app
    this.name = name
    this.options = options
    this.support = { propType: { object: false, array: false }, truncate: false, returning: false, uniqueIndex: false, transaction: false }
    this.idField = { name: '_id', type: 'string', maxLength: 50, required: true, index: 'primary' }
  }
  _getReturningFields (model, options = {}) {
    const { fields = [] } = options
    if (!this.support.returning) return []
    const items = fields.length > 0 ? [...fields] : model.properties.map(p => p.name)
    if (!items.includes(this.idField.name)) items.unshift(this.idField.name)
    return items.filter(i => !(this.idField.name !== 'id' && i === 'id'))
  }
}

export const createFakeClient = () => {
  const state = {
    tables: new Map(),
    inserted: [],
    updated: [],
    deleted: [],
    schemaTables: [],
    rawCalls: [],
    txCalls: []
  }

  class Builder {
    constructor (table) {
      this.table = table
      this._where = null
      this._limit = null
      this._offset = null
      this._sorts = []
      this._select = []
      this._group = null
      this.client = client
    }
    where (field, value) { this._where = { field, value }; return this }
    insert (body, returning) {
      state.inserted.push({ table: this.table, body, returning })
      const rows = state.tables.get(this.table) ?? []
      if (Array.isArray(body)) rows.push(...cloneDeep(body))
      else rows.push(cloneDeep(body))
      state.tables.set(this.table, rows)
      if (Array.isArray(body)) return Promise.resolve(body.map((b, idx) => b.id ?? (idx + 1)))
      return Promise.resolve([body.id ?? 1])
    }
    update (body, returning) {
      state.updated.push({ table: this.table, where: this._where, body, returning })
      const rows = state.tables.get(this.table) ?? []
      const idx = rows.findIndex(r => r.id === this._where.value)
      if (idx >= 0) rows[idx] = { ...rows[idx], ...body }
      state.tables.set(this.table, rows)
      return Promise.resolve([rows[idx] ?? { id: this._where.value, ...body }])
    }
    del () {
      state.deleted.push({ table: this.table, where: this._where })
      const rows = state.tables.get(this.table) ?? []
      if (!this._where) state.tables.set(this.table, [])
      else state.tables.set(this.table, rows.filter(r => r.id !== this._where.value))
      return Promise.resolve(true)
    }
    truncate () { return this.del() }
    limit (n) { this._limit = n; return this }
    offset (n) { this._offset = n; return this }
    orderBy (arg1, arg2) { this._sorts.push({ arg1, arg2 }); return this }
    select (field) { this._select.push(field); return this }
    groupBy (field) { this._group = field; return this }
    count () { return Promise.resolve([{ cnt: (state.tables.get(this.table) ?? []).length }]) }
    then (resolve, reject) {
      let rows = [...(state.tables.get(this.table) ?? [])]
      if (this._where) rows = rows.filter(r => r[this._where.field] === this._where.value)
      if (this._offset) rows = rows.slice(this._offset)
      if (this._limit !== null && this._limit !== undefined) rows = rows.slice(0, this._limit)
      return Promise.resolve(rows).then(resolve, reject)
    }
    toSQL () {
      return { toNative: () => ({ sql: `select * from ${this.table} limit ?`, bindings: [this._limit ?? 0] }) }
    }
  }

  const client = function (table) { return new Builder(table) }
  client.schema = {
    hasTable: async (name) => state.schemaTables.includes(name),
    createTable: async (name, cb) => {
      state.schemaTables.push(name)
      const columns = []
      const table = {
        increments: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        specificType: (n, t) => columns.push({ kind: 'specificType', n, t }),
        integer: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        smallint: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        string: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        text: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        datetime: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        double: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        float: (n) => ({ notNullable: () => {}, comment: () => {}, unsigned: () => {}, name: n }),
        primary: () => {}, unique: () => {}, index: () => {}, engine: () => {}
      }
      cb(table)
    },
    dropTable: async (name) => { state.schemaTables = state.schemaTables.filter(n => n !== name) }
  }
  client.raw = async (sql, bindings) => {
    state.rawCalls.push({ sql, bindings })
    return [[{ count: 1, date: '2026-01-01', month: '2026-01', year: 2026 }]]
  }
  client.transaction = async (fn) => {
    const trx = { context: { client: { config: { connName: 'default' } } } }
    state.txCalls.push(trx)
    await fn(trx)
  }
  client.context = { client: { config: { connName: 'default' } } }
  client.client = { on: () => {} }
  client.on = () => {}
  client._state = state
  return client
}

export const createAppStub = (root = '/tmp/dobo-knex-test') => {
  const app = {
    dir: root,
    lib: {
      fs,
      _: { omit, has, forOwn, cloneDeep, isEmpty, isArray, get },
      aneka: { defaultsDeep, generateId }
    },
    baseClass: { Base, DoboAdapter },
    bajo: {
      importPkg: async (name) => {
        if (name === 'dobo:@tryghost/mongo-knex') return (builder, query) => builder
        if (name.startsWith('main:') || name.startsWith('doboKnex:')) return { dummy: true }
      }
    },
    getPluginFile: (p) => p.replace(/^\w+:/, `${root}/`),
    doboKnex: { ns: 'doboKnex' },
    dobo: {
      getDefaultValues: () => ({ hardCap: 100 }),
      handleLastPage: () => undefined
    }
  }
  return app
}
