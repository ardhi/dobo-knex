async function applyFulltext (schema, data, match) {
  const { forOwn, isEmpty } = this.app.bajo.lib._
  if (!isEmpty(match['*'])) {
    forOwn(match, (v, k) => {
      if (k !== '*') data.orWhereRaw(`MATCH(${k}) AGAINST ('${match['*']}' IN NATURAL LANGUAGE MODE)`)
    })
  } else {
    forOwn(match, (v, k) => {
      if (!isEmpty(v)) data.andWhereRaw(`MATCH(${k}) AGAINST ('${v.join(' ')}' IN NATURAL LANGUAGE MODE)`)
    })
  }
}

export default applyFulltext
