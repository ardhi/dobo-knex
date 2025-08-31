async function applyFulltext (schema, data, match) {
  const { isEmpty } = this.app.lib._
  const matchers = []
  if (!isEmpty(match['*'])) {
    matchers.push(match['*'])
  } else {
    for (const k in match) {
      if (match[k].length === 0) continue
      const v = match[k].join(' ')
      matchers.push(`${k}:${v}`)
    }
  }

  if (matchers.length > 0) {
    const stmt = `
      SELECT rowid FROM ${schema.name}_fts
      WHERE ${schema.name}_fts
      MATCH '${matchers.join(' ')}'
      ORDER BY rank
    `
    data.andWhereRaw(`id IN (${stmt})`)
  }
}

export default applyFulltext
