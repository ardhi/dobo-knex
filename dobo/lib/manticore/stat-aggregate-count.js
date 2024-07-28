async function count ({ schema, filter, options = {} }) {
  throw this.error('Unsupported aggregate \'%s\'', 'count')
}

export default count
