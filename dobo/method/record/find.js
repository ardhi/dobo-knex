import getCount from './_count.js'

async function recordFind ({ schema, filter = {}, options = {} }) {
  const { importPkg, importModule, currentLoc } = this.app.bajo
  const { prepPagination, getInfo } = this.app.dobo
  const { forOwn, omit } = this.app.bajo.lib._
  const mongoKnex = await importPkg('dobo:@tryghost/mongo-knex')
  const { instance, driver } = getInfo(schema)
  const { limit, skip, sort, page } = await prepPagination(filter, schema)

  let count = 0
  if (options.count && !options.dataOnly) count = (await getCount.call(this, { schema, filter, options }) || {}).data
  let result
  const mod = await importModule(`${currentLoc(import.meta).dir}/../../lib/${driver.type}/record-find.js`)
  if (mod) result = await mod.call(this, { schema, filter, options })
  else {
    let data = instance.client(schema.modelName)
    if (filter.query) data = mongoKnex(data, filter.query)
    if (!options.noLimit) data.limit(limit, { skipBinding: true }).offset(skip)
    if (sort) {
      const sorts = []
      forOwn(sort, (v, k) => {
        sorts.push({ column: k, order: v < 0 ? 'desc' : 'asc' })
      })
      data.orderBy(sorts)
    }
    result = await data
  }
  result = { data: result, page, limit, count, pages: Math.ceil(count / limit) }
  if (!options.count) result = omit(result, ['count', 'pages'])
  return result
}

export default recordFind