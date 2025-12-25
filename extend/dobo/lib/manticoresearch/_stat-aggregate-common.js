async function common ({ type, schema, filter, options = {} }) {
  throw this.error('unsupportedAggregate%s', type)
}

export default common
