import knex from 'knex'

const propertyKeys = ['specificType', 'precision', 'textType', 'scale', 'unsigned', 'comment', 'autoInc']

async function knexFactory () {
  const { DoboDriver } = this.app.baseClass
  const { getPluginFile, importPkg } = this.app.bajo
  const { fs } = this.app.lib
  const { omit, has, forOwn, cloneDeep, isEmpty, isArray } = this.app.lib._
  const { defaultsDeep } = this.app.lib.aneka

  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')

  class DoboKnexDriver extends DoboDriver {
    static propertyKeys = propertyKeys

    constructor (plugin, name, options = {}) {
      super(plugin, name)
      this.idField = {
        name: 'id',
        type: 'integer',
        required: true,
        autoInc: true,
        index: 'primary'
      }
      this.options = options
      this.support.truncate = false
      this.support.returning = false
      this.adapter = null
    }

    async createClient (connection) {
      const dialectFile = getPluginFile(this.dialectFile ?? `${this.app.doboKnex.ns}:node_modules/knex/lib/dialects/${this.dialect}/index.js`)
      if (!fs.existsSync(dialectFile)) this.plugin.fatal('notFound%s%s', this.plugin.t('dialectFile'), dialectFile)
      const dbDriver = (await import(dialectFile)).default
      const adapter = this.adapter ?? this.dialect
      let dbAdapter = await importPkg(`main:${adapter}`)
      if (!dbAdapter) dbAdapter = await importPkg(`${this.plugin.ns}:${adapter}`)
      if (!dbAdapter) throw this.plugin.fatal('dbAdapterNotInstalled%s', dbAdapter)
      dbDriver.prototype._driver = () => dbAdapter
      connection.client = knex(defaultsDeep({ connection: connection.options }, { client: dbDriver }, this.options))
    }

    async modelExists (model, options = {}) {
      const client = model.connection.client
      const exists = await client.schema.hasTable(model.collName)
      return { data: !!exists }
    }

    async buildModel (model, options = {}) {
      const client = model.connection.client
      await client.schema.createTable(model.collName, table => {
        for (const p of model.properties) {
          const prop = cloneDeep(p)
          if (prop.specificType) {
            table.specificType(prop.name, prop.specificType)
            continue
          }
          if (['object', 'array'].includes(prop.type) && !this.support.propType[prop.type]) prop.type = 'text'
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
          let opts = omit(index, ['name', 'type', 'fields'])
          switch (index.type) {
            case 'primary': {
              if (isEmpty(opts)) opts = undefined
              // opts.constraintName = index.name
              table.primary(index.fields, opts)
              break
            }
            case 'unique': {
              opts.indexName = index.name
              table.unique(index.fields, opts)
              break
            }
            case 'index': {
              if (isEmpty(opts)) opts = undefined
              table.index(index.fields, index.name, opts)
              break
            }
          }
        }
        const engine = model.engine ?? this.defaultEngine
        if (engine) table.engine(engine)
        if (options.onTable) options.onTable.call(this, model, table)
      })
      return { data: true }
    }

    async clearRecord (model, options = {}) {
      const client = model.connection.client
      const op = this.support.truncate ? 'truncate' : 'del'
      await client(model.collName)[op]()
      return { data: true }
    }

    async dropModel (model, options = {}) {
      const client = model.connection.client
      await client.schema.dropTable(model.collName)
      return { data: true }
    }

    async createRecord (model, body = {}, options = {}) {
      const client = model.connection.client
      const result = await client(model.collName).insert(body, this._getReturningFields(model, options))
      if (options.noResult) return
      if (this.support.returning) return { data: result[0] }
      return await this.getCreatedRecord(model, body, result, options)
    }

    /**
     * Get newly created record. This is the case for ```mysql```, other DB that doesn't support returning
     * should extend this method
     *
     * @async
     * @param {Object} model
     * @param {Object} body
     * @param {Object} result
     * @param {Object} [options]
     * @returns {Object}
     */
    async getCreatedRecord (model, body, result, options = {}) {
      const id = body[this.idField.name] ?? result[0]
      const resp = await this.getRecord(model, id)
      return { data: resp.data }
    }

    /**
     * Get record
     *
     * @param {Object} model
     * @param {number|string} id
     * @param {Object} [options]
     * @returns {Object}
     */
    async getRecord (model, id, options = {}) {
      const client = model.connection.client
      const result = await client(model.collName).where('id', id)
      return { data: result[0] }
    }

    async updateRecord (model, id, body = {}, options = {}) {
      const oldData = options._data
      const client = model.connection.client
      const result = await client(model.collName).where('id', id).update(body, this._getReturningFields(model, options))
      if (options.noResult) return
      if (this.support.returning) return { data: result[0], oldData }
      const resp = await this.getRecord(model, id)
      return { data: resp.data, oldData }
    }

    async removeRecord (model, id, options = {}) {
      const client = model.connection.client
      await client(model.collName).where('id', id).del()
      if (options.noResult) return
      return { oldData: options._data }
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

    async createAggregate (model, filter = {}, params = {}, options = {}) {
      const client = model.connection.client
      const { generateId } = this.app.lib.aneka
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, aggregates = [], field } = params
      const instance = mongoKnex(client(model.collName), query)
      if (!options.noLimit) instance.limit(limit, { skipBinding: true }).offset(skip)
      instance.select(group).groupBy(group)
      if (sort) {
        const f = Object.keys(sort)[0]
        let d = sort[f]
        d = d <= 0 ? 'desc' : 'asc'
        instance.orderBy(group, d)
      }
      instance.orderBy(group)
      for (const a of aggregates) {
        instance[a](field, { as: a })
      }
      const data = ((await instance) ?? []).map(d => {
        d[this.idField.name] = generateId()
        return d
      })
      /*
      for (const d of data) {
        d.id = d[group]
        delete d[group]
      }
      */
      return { data, page, limit, group, field }
    }

    async createHistogram (model, filter = {}, params, options = {}) {
      const client = model.connection.client
      const { generateId } = this.app.lib.aneka
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, type, field, aggregates = [] } = params
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
      const item = instance.toSQL().toNative()
      this._reformHistogram({ item, type, group, aggregates, field })
      const result = await this.getRawResult(instance, item)
      const data = (result ?? []).map(d => {
        d[this.idField.name] = generateId()
        return d
      })
      return { data, page, limit, group, field, type, aggregates }
    }

    _reformHistogram ({ type, item, group, aggregates, field }) {
      const aggs = []
      for (const agg of aggregates) {
        aggs.push(`${agg}(${agg === 'count' ? '*' : field}) as ${agg}`)
      }
      switch (type) {
        case 'daily': {
          item.sql = item.sql.replace('*', `date_format(${group}, '%Y-%m-%e') as date, ${aggs.join(', ')}`)
          // item.sql = item.sql.replace('limit ', `group by year(${group}), month(${group}), dayofmonth(${group}) limit `)
          item.sql = item.sql.replace('limit ', 'group by date limit ')
          break
        }
        case 'monthly': {
          item.sql = item.sql.replace('*', `date_format(${group}, '%Y-%m') as month, ${aggs.join(', ')}`)
          // item.sql = item.sql.replace('limit ', `group by year(${group}), month(${group}) limit `)
          item.sql = item.sql.replace('limit ', 'group by month limit ')
          break
        }
        case 'yearly': {
          item.sql = item.sql.replace('*', `year(${group}) as year, ${aggs.join(', ')}`)
          // item.sql = item.sql.replace('limit ', `group by year(${group}) limit `)
          item.sql = item.sql.replace('limit ', 'group by year limit ')
          break
        }
      }
    }

    async getRawResult (instance, item) {
      item = item ?? instance.toSQL().toNative()
      let result = (await instance.client.raw(item.sql, item.bindings)) ?? []
      if (isArray(result[0])) result = result[0]
      return result
    }
  }

  this.app.baseClass.DoboKnexDriver = DoboKnexDriver
  return DoboKnexDriver
}

export default knexFactory
