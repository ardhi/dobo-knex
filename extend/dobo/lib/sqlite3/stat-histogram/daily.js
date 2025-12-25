import common from './_common.js'
import lib from './_lib.js'

async function handler ({ item, field, schema, aggregate, group }) {
  const aggs = lib.call(this, { schema, aggregate, group })
  item.sql = item.sql.replace('*', `strftime('%Y-%m-%d', substr(${field}, 1, 10), 'auto') as date, ${aggs.join(', ')}`)
  const start = item.sql.indexOf(' order by ')
  const end = item.sql.indexOf(' limit ')
  const order = item.sql.slice(start, end)
  item.sql = item.sql.splice(start, end - start, '')
  item.sql = item.sql.replace('limit ', `group by strftime('%Y', substr(${field}, 1, 10), 'auto'), strftime('%m', substr(${field}, 1, 10), 'auto'), strftime('%d', substr(${field}, 1, 10), 'auto') ${order} limit `)
}

async function daily ({ type, schema, filter, options = {} }) {
  return await common.call(this, { handler, schema, filter, options })
}

export default daily
