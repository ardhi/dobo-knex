import common from './_common.js'
import lib from './_lib.js'

async function handler ({ item, field, schema, aggregate, group }) {
  const aggs = lib.call(this, { schema, aggregate, group })
  item.sql = item.sql.replace('*', `strftime('%Y-%m', substr(${field}, 1, 10), 'auto') as period, ${aggs.join(', ')}`)
  item.sql = item.sql.replace('limit ', `group by strftime('%Y', substr(${field}, 1, 10), 'auto'), strftime('%m', substr(${field}, 1, 10), 'auto') limit `)
}

async function monthly ({ type, schema, filter, options = {} }) {
  return await common.call(this, { handler, schema, filter, options })
}

export default monthly
