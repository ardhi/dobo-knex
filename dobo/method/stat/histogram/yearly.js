import common from './_common.js'
import lib from './_lib.js'

async function handler ({ item, field, schema, aggregate, group }) {
  const aggs = lib.call(this, { schema, aggregate, group })
  item.sql = item.sql.replace('*', `year(${field}) as year, ${aggs.join(', ')}`)
  item.sql = item.sql.replace('limit ', `group by year(${field}) limit `)
}

async function yearly ({ type, schema, filter, options = {} }) {
  return await common.call(this, { handler, schema, filter, options })
}

export default yearly
