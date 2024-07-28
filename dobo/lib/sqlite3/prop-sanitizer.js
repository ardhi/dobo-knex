async function propSanitizer ({ prop, schema, driver }) {
  const { importModule } = this.app.bajo
  const genericPropSanitizer = await importModule('dobo:/lib/generic-prop-sanitizer.js')
  await genericPropSanitizer.call(this, { prop, schema, driver })
  const idProp = schema.properties.find(p => p.name === 'id')
  if (!idProp) return
  if (schema.fullText.fields.length > 0 && idProp.type !== 'integer') {
    this.fatal('Full text index need integer type primary id in \'%s@%s\'', idProp.name, schema.name)
  }
}

export default propSanitizer
