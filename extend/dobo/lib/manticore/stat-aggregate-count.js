async function count ({ schema, filter, options = {} }) {
  throw this.error('unsupportedAggregate%s', 'count')
}

export default count
