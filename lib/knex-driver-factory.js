import knex from 'knex'

const propertyKeys = ['specificType', 'precision', 'textType', 'scale', 'unsigned', 'comment']

async function knexDriverFactory () {
  const { Driver } = this.app.dobo.baseClass
  const { getPluginFile, importPkg } = this.app.bajo
  const { fs } = this.app.lib
  const { omit, has, uniq, forOwn } = this.app.lib._
  const { defaultsDeep } = this.app.lib.aneka

  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')

  class KnexDriver extends Driver {
    static propertyKeys = propertyKeys

    constructor (plugin, options) {
      super(plugin)
      this.idField = {
        name: 'id',
        type: 'integer',
        required: true,
        autoInc: true,
        index: { type: 'primary' }
      }
      this.adapter = null
      this.nativeObject = false
      this.nativeArray = false
      this.nativeReturning = true
    }

    async createClient (connection, noRebuild) {
      const dialectFile = getPluginFile(this.dialectFile ?? `${this.app.doboKnex.ns}:node_modules/knex/lib/dialects/${this.dialect}/index.js`)
      if (!fs.existsSync(dialectFile)) this.plugin.fatal('notFound%s%s', this.plugin.t('dialectFile'), dialectFile)
      const dbDriver = (await import(dialectFile)).default
      const adapter = this.adapter ?? this.dialect
      let dbAdapter = await importPkg(`main:${adapter}`)
      if (!dbAdapter) dbAdapter = await importPkg(`${this.plugin.ns}:${adapter}`)
      if (!dbAdapter) throw this.plugin.fatal('dbAdapterNotInstalled%s', dbAdapter)
      dbDriver.prototype._driver = () => dbAdapter
      connection.client = knex(defaultsDeep({ connection: connection.options }, { client: dbDriver }, this.options))
      if (!noRebuild) {
        const models = this.app.dobo.getModelsByConnection(connection.name)
        for (const model of models) {
          const exists = await model.isExists()
          if (!exists) {
            try {
              await model.build()
              this.plugin.log.trace('modelBuiltOnthefly%s%s%s', model.name, connection.name)
            } catch (err) {
              this.plugin.fatal('unableBuildModel%s%s%s', model.name, connection.name, err.message)
            }
          }
        }
      }
    }

    getReturningFields (model, { fields = [] } = {}) {
      const items = fields.length > 0 ? [...fields] : model.properties.map(prop => prop.name)
      if (!items.includes(this.idField.name)) items.unshift(this.idField.name)
      return uniq(items)
    }

    async modelExists (model, options = {}) {
      const client = model.connection.client
      const exists = await client.schema.hasTable(model.collName)
      return !!exists
    }

    async buildModel (model, options = {}) {
      const client = model.connection.client
      await client.schema.createTable(model.collName, table => {
        for (const prop of model.properties) {
          if (prop.specificType) {
            table.specificType(prop.name, prop.specificType)
            continue
          }
          if (['object', 'array'].includes(prop.type)) prop.type = 'text'
          const args = []
          for (const item of ['maxLength', 'precision', 'textType']) {
            if (has(prop, item)) args.push(prop[item])
            if (item === 'precision' && has(prop, 'scale')) args.push(prop.scale)
          }
          let col
          if (prop.autoInc && ['smallint', 'integer'].includes(prop.type)) col = table.increments(prop.name)
          else if (prop.specificType) table.specificType(prop.name, prop.specificType)
          else col = table[prop.type](prop.name, ...args)
          if (prop.required) col.notNullable()
          if (prop.unsigned && ['integer', 'smallint', 'float', 'double'].indexOf(prop.type)) col.unsigned()
          if (prop.comment) col.comment(prop.comment)
          if (options.onColumn) options.onColumn.call(this, model, table, col)
        }
        for (const index of model.indexes ?? []) {
          const opts = omit(index, ['name', 'type', 'fields'])
          if (index.name) opts.indexName = index.name
          if (index.type === 'unique') table.unique(index.fields, opts)
          else table.index(index.fields, index.name, opts)
        }
        if (model.engine) table.engine(model.engine)
        if (options.onTable) options.onTable.call(this, model, table)
      })
    }

    async clearModel (model, options = {}) {
      const client = model.connection.client
      await client(model.collName).truncate() // TODO: not all SQL database support truncate
    }

    async dropModel (model, options = {}) {
      const client = model.connection.client
      await client.schema.dropTable(model.collName)
    }

    async createRecord (model, body = {}, options = {}) {
      const returning = this.getReturningFields(model, options)
      for (const prop of model.properties) {
        if (prop.type === 'object' && !this.nativeObject) body[prop.name] = JSON.stringify(body[prop.name])
        if (prop.type === 'array' && !this.nativeArray) body[prop.name] = JSON.stringify(body[prop.name])
      }
      const client = model.connection.client

      const result = await client(model.collName).insert(body, returning)
      if (options.noResult) return
      if (this.nativeReturning) return { data: result[0] }
      const id = body.id // TODO: what if id is unavailable?
      const resp = await this.getRecord(model, id)
      return { data: resp.data }
    }

    async getRecord (model, id, options = {}) {
      const client = model.connection.client
      const result = await client(model.collName).where('id', id)
      if (result.length === 0 && !options.silent) throw this.plugin.error('recordNotFound%s%s', id, model.name)
      return { data: result[0] }
    }

    async updateRecord (model, id, body = {}, options = {}) {
      const returning = this.getReturningFields(model, options)
      for (const prop of model.properties) {
        if (prop.type === 'object' && !this.nativeObject) body[prop.name] = JSON.stringify(body[prop.name])
        if (prop.type === 'array' && !this.nativeArray) body[prop.name] = JSON.stringify(body[prop.name])
      }
      let resp = await this.getRecord(model, id)
      const oldData = resp.data
      const client = model.connection.client
      const result = await client(model.collName).where('id', id).update(body, ...returning)
      if (options.noResult) return
      if (this.nativeUpdateReturning) return { data: result[0], oldData }
      resp = await this.getRecord(model, id)
      return { data: resp.data, oldData }
    }

    async removeRecord (model, id, options = {}) {
      const client = model.connection.client
      const resp = await this.getRecord(model, id)
      await client(model.collName).where('id', id).del()
      if (options.noResult) return
      return { oldData: resp.data }
    }

    async findRecord (model, filter = {}, options = {}, noLimit) {
      const client = model.connection.client
      const { limit, skip, sort, page } = filter
      let count = 0
      if (options.count) count = (await this.countRecord(model, filter, options)).data
      const { query, match } = filter
      const instance = mongoKnex(client(model.collName), query)
      if (!noLimit) instance.limit(limit, { skipBinding: true }).offset(skip)
      if (sort) {
        const sorts = []
        forOwn(sort, (v, k) => {
          sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
        })
        instance.orderBy(sorts)
      }
      const data = await instance
      let result = { data, page, limit, count, pages: Math.ceil(count / limit), filter: { query, match, sort } }
      if (!options.count) result = omit(result, ['count', 'pages'])
      return result
    }

    async findAllRecord (model, filter = {}, options = {}) {
      return await this.findRecord(model, filter, options, true)
    }

    async countRecord (model, filter = {}, options = {}) {
      const client = model.connection.client
      const instance = mongoKnex(client(model.collName), filter.query)
      const result = await instance.count('*', { as: 'cnt' })
      return { data: result[0].cnt }
    }

    async createAggregate (model, filter = {}, options = {}) {
      const client = model.connection.client
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, aggregates = [], field } = options
      const instance = mongoKnex(client(model.collName), query)
      if (!options.noLimit) instance.limit(limit, { skipBinding: true }).offset(skip)
      instance.select(group).groupBy(group)
      if (sort) {
        const f = Object.keys(sort)[0]
        let d = sort[f]
        d = d <= 0 ? 'desc' : 'asc'
        instance.orderBy(f, d)
      }
      for (const a of aggregates) {
        instance[a](field, { as: a })
      }
      const data = await instance
      for (const d of data) {
        d.id = d[group]
        delete d[group]
      }
      return { data, page, limit, group, field }
    }

    async createHistogram (model, filter = {}, options = {}) {
      const client = model.connection.client
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, type, field, aggregates = [] } = options
      const instance = mongoKnex(client(model.collName), query)
      if (!options.noLimit) instance.limit(limit, { skipBinding: true }).offset(skip)
      if (sort) {
        /*
        const f = Object.keys(sort)[0]
        let d = sort[f]
        d = d <= 0 ? 'desc' : 'asc'
        instance.orderBy(f, d)
        */
      }
      const aggs = []
      for (const agg of aggregates) {
        aggs.push(`${agg}(${agg === 'count' ? '*' : field}) as ${agg}`)
      }
      const item = instance.toSQL().toNative()
      this._reformHistogram({ item, type, group, aggs })
      const result = await instance.client.raw(item.sql, item.bindings)
      return { data: result, page, limit, group, field, type, aggregates }
    }

    _reformHistogram ({ type, item, group, aggs }) {
      switch (type) {
        case 'daily': {
          item.sql = item.sql.replace('*', `date_format(${group}, '%Y-%m-%e') as id, ${aggs.join(', ')}`)
          item.sql = item.sql.replace('limit ', `group by year(${group}), month(${group}), dayofmonth(${group}) limit `)
          break
        }
        case 'monthly': {
          item.sql = item.sql.replace('*', `date_format(${group}, '%Y-%m') as id, ${aggs.join(', ')}`)
          item.sql = item.sql.replace('limit ', `group by year(${group}), month(${group}) limit `)
          break
        }
        case 'annually': {
          item.sql = item.sql.replace('*', `year(${group}) as id, ${aggs.join(', ')}`)
          item.sql = item.sql.replace('limit ', `group by year(${group}) limit `)
          break
        }
      }
    }
  }

  return KnexDriver
}

export default knexDriverFactory
