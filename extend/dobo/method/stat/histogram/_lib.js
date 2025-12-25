function lib ({ schema, aggregate, group }) {
  const { isSet } = this.app.lib.aneka
  const { camelCase } = this.app.lib._
  const { aggregateTypes } = this.app.baseClass.Dobo
  if (aggregate === 'count') return ['count(*) as count']
  if (!isSet(group)) throw this.error('groupFieldToAggregateMissing')
  const prop = schema.properties.find(p => p.name === group)
  if (!prop) throw this.error('unknownGroupField%s%s', group, schema.name)
  if (!['integer', 'smallint', 'float'].includes(prop.type)) throw this.error('grupFieldMustBeNumber')
  const types = aggregate.split(',').map(a => a.trim())
  const aggs = []
  for (const type of types) {
    if (!aggregateTypes.includes(type)) throw this.error('unsupportedAggregateType%s', type)
    const name = camelCase(`${group} ${type}`)
    aggs.push(`${type}(${type === 'count' ? '*' : group}) as ${name}`)
  }
  return aggs
}

export default lib
