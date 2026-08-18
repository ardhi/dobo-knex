import knex from 'knex'

/**
 * @external DoboModel
 * @see {@link https://ardhi.github.io/dobo/DoboModel|DoboModel}
 */

/**
 * @external TOptions
 * @see {@link https://ardhi.github.io/dobo/DoboModel.html#.TOptions|DoboModel.TOptions}
 */

/**
 * @external TAdapterIdField
 * @see {@link https://ardhi.github.io/dobo/DoboAdapter.html#.TAdapterIdField|DoboAdapter.TAdapterIdField}
 */

/**
 * @external TAdapterResult
 * @see {@link https://ardhi.github.io/dobo/DoboAdapter.html#.TAdapterResult|DoboAdapter.TAdapterResult}
 */

/**
 * @external TConnectionOptions
 * @see {@link https://ardhi.github.io/dobo/DoboConnection.html#.TConnectionOptions|DoboConnection.TConnectionOptions}
 */

/**
 * @typedef {Object & external:TConnectionOptions} TConnectionOptions
 * @memberof DoboKnexAdapter
 * @property {string} [host] - The database host
 * @property {number} [port] - The database port
 * @property {string} [user] - The database user
 * @property {string} [password] - The database password
 * @property {string} [database] - The database name
 */

/**
 * @typedef TPropertyKeys
 * @type {Array<string>}
 * @property {string} 0 specificType
 * @property {string} 1 precision
 * @property {string} 2 textType
 * @property {string} 3 scale
 * @property {string} 4 unsigned
 * @property {string} 5 comment
 * @property {string} 6 autoInc
 * @memberof DoboKnexAdapter
 */
const propertyKeys = ['specificType', 'precision', 'textType', 'scale', 'unsigned', 'comment', 'autoInc']

async function knexFactory () {
  const { DoboAdapter } = this.app.baseClass
  const { importPkg } = this.app.bajo
  const { fs } = this.app.lib
  const { omit, has, forOwn, cloneDeep, isEmpty, isArray } = this.app.lib._
  const { defaultsDeep } = this.app.lib.aneka

  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')

  /**
   * DoboKnexAdapter class definition.
   *
   * @class
   */
  class DoboKnexAdapter extends DoboAdapter {
    /**
     * Allowed property keys for model properties.
     * @type {TPropertyKeys}
     */
    static propertyKeys = propertyKeys

    /**
     * Constructor
     */
    constructor (plugin, name, options = {}) {
      super(plugin, name, options)
      /**
       * Default ID field configuration for models.
       * @type {external:TAdapterIdField}
       * @property {string} [name='id'] - The name of the ID field
       * @property {string} [type='integer'] - The data type of the ID field
       * @property {boolean} [required=true] - Whether the ID field is required
       * @property {boolean} [autoInc=true] - Whether the ID field is auto-incremented
       * @property {string} [index='primary'] - The index type for the ID field
       */
      this.idField = {
        name: 'id',
        type: 'integer',
        required: true,
        autoInc: true,
        index: 'primary'
      }

      /**
       * Override the default behavior of truncating tables on clear operations.
       * @type {boolean}
       * @default false
       */
      this.support.truncate = false

      /**
       * Override the default behavior of returning inserted rows on insert queries.
       * @type {boolean}
       * @default false
       */
      this.support.returning = false

      /**
       * Override the default behavior of creating unique indexes.
       * @type {boolean}
       * @default true
       */
      this.support.uniqueIndex = true

      /**
       * Override the default behavior of supporting transactions.
       * @type {boolean}
       * @default true
       */
      this.support.transaction = true

      /**
       * The default database engine to use.
       * @type {string|null}
       * @default null
       */
      this.adapter = null
    }

    /**
     * Connect to the database using the provided connection.
     * @param {Object} [connection={}] - The database connection object
     * @param {boolean} [noRebuild=false] - Whether to skip rebuilding the connection
     */
    async connect (connection = {}, noRebuild = false) {
      const dialectFile = this.app.getPluginFile(this.dialectFile ?? `${this.app.doboKnex.ns}:node_modules/knex/lib/dialects/${this.dialect}/index.js`)
      if (!fs.existsSync(dialectFile)) this.plugin.fatal('notFound%s%s', this.plugin.t('dialectFile'), dialectFile)
      const client = (await import(dialectFile)).default
      const adapter = this.adapter ?? this.dialect
      let dbAdapter = await importPkg(`main:${adapter}`)
      if (!dbAdapter) dbAdapter = await importPkg(`${this.plugin.ns}:${adapter}`)
      if (!dbAdapter) throw this.plugin.fatal('dbAdapterNotInstalled%s', dbAdapter)
      client.prototype._driver = () => dbAdapter
      connection.client = knex(defaultsDeep({ connection: connection.options }, { client }, this.options))
    }

    /**
     * Get the database client for the given model and options.
     * @param {external:DoboModel} model - The model instance
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Object} The database client
     */
    getClient (model, options = {}) {
      const { get } = this.app.lib._
      const client = model.connection.client
      const key = 'context.client.config.connName'
      if (options.trx && get(options, `trx.${key}`) === get(client, key)) return options.trx
      return client
    }

    /**
     * Check if the model's table exists in the database.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the existence status of the table
     */
    async modelExists (model, options = {}) {
      const client = this.getClient(model, options)
      const exists = await client.schema.hasTable(model.collName)
      return { data: !!exists }
    }

    /**
     * Build the model's table in the database based on its properties and indexes.
     * @param {external:DoboModel} model - The model instance
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the result of the build operation
     */
    async buildModel (model, options = {}) {
      const client = this.getClient(model, options)
      await client.schema.createTable(model.collName, table => {
        for (const p of model.getProperties({ noVirtual: true })) {
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
        for (const index of model.getIndexes()) {
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
              if (this.support.uniqueIndex) table.unique(index.fields, opts)
              else table.index(index.fields, index.name)
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

    /**
     * Clear all records from the model's table in the database.
     * @param {external:DoboModel} model - The model instance
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the result of the clear operation
     */
    async clearRecord (model, options = {}) {
      const client = this.getClient(model, options)
      const op = this.support.truncate ? 'truncate' : 'del'
      await client(model.collName)[op]()
      return { data: true }
    }

    async dropModel (model, options = {}) {
      const client = this.getClient(model, options)
      await client.schema.dropTable(model.collName)
      return { data: true }
    }

    async bulkCreateRecord (model, bodies = [], options = {}) {
      const client = this.getClient(model, options)
      await client(model.collName).insert(bodies)
      return { data: true }
    }

    async createRecord (model, body = {}, options = {}) {
      const client = this.getClient(model, options)
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
     * @param {external:DoboModel} model - The model instance
     * @param {Object} body - The data used to create the record
     * @param {Object} result - The result returned from the database
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the newly created record
     */
    async getCreatedRecord (model, body, result, options = {}) {
      const id = body[this.idField.name] ?? result[0]
      const resp = await this.getRecord(model, id, options)
      return { data: resp.data }
    }

    /**
     * Get a record from the model's table in the database by its ID.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {number|string} id - The ID of the record to retrieve
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the retrieved record
     */
    async getRecord (model, id, options = {}) {
      const client = this.getClient(model, options)
      const result = await client(model.collName).where('id', id)
      return { data: result[0] }
    }

    /**
     * Update a record in the model's table in the database by its ID.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {number|string} id - The ID of the record to update
     * @param {Object} body - The data to update the record with
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the updated record and the old data
     */
    async updateRecord (model, id, body = {}, options = {}) {
      const oldData = options._data
      const client = this.getClient(model, options)
      const result = await client(model.collName).where('id', id).update(body, this._getReturningFields(model, options))
      if (options.noResult) return
      if (this.support.returning) return { data: result[0], oldData }
      const resp = await this.getRecord(model, id, options)
      return { data: resp.data, oldData }
    }

    /**
     * Remove a record from the model's table in the database by its ID.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {number|string} id - The ID of the record to remove
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the old data
     */
    async removeRecord (model, id, options = {}) {
      const client = this.getClient(model, options)
      await client(model.collName).where('id', id).del()
      if (options.noResult) return
      return { oldData: options._data }
    }

    /**
     * Find record(s) in the model's table in the database matching the filter.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Object} filter - The filter criteria
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the found record(s)
     */
    async findRecord (model, filter = {}, options = {}) {
      const { handleLastPage } = this.app.dobo
      const client = this.getClient(model, options)
      const { hardCap } = this.app.dobo.getDefaultValues(options)
      const { limit, skip, sort, page } = filter
      // console.log(model.name, filter)
      const resp = await model.countRecord(filter, { ...options, noCache: true, dataOnly: false })
      let count = options.count ? resp.data : 0
      const { query } = filter
      const result = handleLastPage({ count: resp.orgCount, limit, page }, options)
      if (result) return result
      const instance = mongoKnex(client(model.collName), query)
      instance.limit(limit, { skipBinding: true }).offset(skip, { skipBinding: true })
      if (sort) {
        const sorts = []
        forOwn(sort, (v, k) => {
          sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
        })
        instance.orderBy(sorts)
      }
      const data = await instance
      if (options.count && count > hardCap) count = hardCap
      return { data, count, warnings: resp.warnings, hardCapped: resp.hardCapped }
    }

    /**
     * Find all records in the model's table in the database matching the filter.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Object} filter - The filter criteria
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the found record(s)
     */
    async findAllRecord (model, filter = {}, options = {}) {
      delete filter.skip
      delete filter.page
      const { hardCap } = this.app.dobo.getDefaultValues(options)
      filter.limit = hardCap
      const client = this.getClient(model, options)
      const { sort, query } = filter
      const instance = mongoKnex(client(model.collName), query)
      instance.limit(filter.limit, { skipBinding: true })
      if (sort) {
        const sorts = []
        forOwn(sort, (v, k) => {
          sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
        })
        instance.orderBy(sorts)
      }
      const data = await instance
      return { data, hardCapped: true }
    }

    /**
     * Count records in the model's table in the database matching the filter.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Object} filter - The filter criteria
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the count of matching records
     */
    async countRecord (model, filter = {}, options = {}) {
      const client = this.getClient(model, options)
      const instance = mongoKnex(client(model.collName), filter.query)
      const resp = await instance.count('*', { as: 'cnt' })
      return { data: resp[0].cnt }
    }

    /**
     * Create an aggregate query on the model's table in the database.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Object} filter - The filter criteria
     * @param {Object} params - The aggregate parameters
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the aggregate result
     */
    async aggregate (model, filter = {}, params = {}, options = {}) {
      const client = this.getClient(model, options)
      const { generateId } = this.app.lib.aneka
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, aggregates = [], field } = params
      const instance = mongoKnex(client(model.collName), query)
      instance.limit(limit, { skipBinding: true }).offset(skip)
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

    /**
     * Create a histogram query on the model's table in the database.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Object} filter - The filter criteria
     * @param {Object} params - The histogram parameters
     * @param {external:TOptions} [options={}] - Additional options
     * @returns {Promise<external:TAdapterResult>} An object containing the histogram result
     */
    async histogram (model, filter = {}, params, options = {}) {
      const client = this.getClient(model, options)
      const { generateId } = this.app.lib.aneka
      const { limit, skip, sort, page } = filter
      const { query } = filter
      const { group, type, field, aggregates = [] } = params
      const instance = mongoKnex(client(model.collName), query)
      instance.limit(limit, { skipBinding: true }).offset(skip)
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

    /**
     * Reform the histogram query based on the type and aggregates.
     * @param {Object} options - The options for reforming the histogram
     * @param {string} options.type - The type of histogram (daily, monthly, yearly)
     * @param {Object} options.item - The SQL query item
     * @param {string} options.group - The group field
     * @param {Array} options.aggregates - The aggregate functions
     * @param {string} options.field - The field to aggregate
     * @private
     */
    _reformHistogram (options = {}) {
      const { type, item, group, aggregates, field } = options
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

    /**
     * Get the raw result from the database for the given query instance and item.
     * @async
     * @param {Object} instance - The query instance
     * @param {Object} item - The SQL query item
     * @returns {Promise<Array>} The raw result from the database
     */
    async getRawResult (instance, item) {
      item = item ?? instance.toSQL().toNative()
      let result = (await instance.client.raw(item.sql, item.bindings)) ?? []
      if (isArray(result[0])) result = result[0]
      return result
    }

    /**
     * Execute a transaction on the model's database connection.
     * @async
     * @param {external:DoboModel} model - The model instance
     * @param {Function} handler - The transaction handler function
     * @param  {...any} args - Additional arguments to pass to the handler
     * @returns {Promise<*>} The result of the transaction
     */
    async transaction (model, handler, ...args) {
      const client = model.connection.client
      let result
      await client.transaction(async trx => {
        result = await handler.call(model, trx, ...args)
      })
      return result
    }
  }

  this.app.baseClass.DoboKnexAdapter = DoboKnexAdapter
  return DoboKnexAdapter
}

export default knexFactory
