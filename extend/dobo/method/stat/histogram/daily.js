import common from './_common.js'
import lib from './_lib.js'

async function handler ({ item, field, schema, aggregate, group }) {
  const aggs = lib.call(this, { schema, aggregate, group })
  item.sql = item.sql.replace('*', `date_format(${field}, '%Y-%m-%e') as date, ${aggs.join(', ')}`)
  item.sql = item.sql.replace('limit ', `group by year(${field}), month(${field}), dayofmonth(${field}) limit `)
}

async function daily ({ type, schema, filter, options = {} }) {
  return await common.call(this, { handler, schema, filter, options })
}

export default daily
