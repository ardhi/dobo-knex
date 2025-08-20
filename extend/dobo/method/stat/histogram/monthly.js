import common from './_common.js'
import lib from './_lib.js'

async function handler ({ item, field, schema, aggregate, group }) {
  const aggs = lib.call(this, { schema, aggregate, group })
  item.sql = item.sql.replace('*', `date_format(${field}, '%Y-%m') as period, ${aggs.join(', ')}`)
  item.sql = item.sql.replace('limit ', `group by year(${field}), month(${field}) limit `)
}

async function monthly ({ type, schema, filter, options = {} }) {
  return await common.call(this, { handler, schema, filter, options })
}

export default monthly
