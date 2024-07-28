async function common ({ type, schema, filter, options = {} }) {
  throw this.error('Unsupported aggregate \'%s\'', type)
}

export default common
