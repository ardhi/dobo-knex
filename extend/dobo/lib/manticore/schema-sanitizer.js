async function schemaSanitizer ({ schema, driver, connection }) {
  if (!schema.engine) schema.engine = 'columnar'
}

export default schemaSanitizer
