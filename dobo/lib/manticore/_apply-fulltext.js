async function applyFulltext (data, match) {
  const { forOwn, isEmpty } = this.app.bajo.lib._
  const matches = []
  forOwn(match, (v, k) => {
    if (!isEmpty(v)) matches.push(`@${k} ${v.join(' ')}`)
  })
  if (!isEmpty(matches)) data.andWhereRaw(`match('${matches.join(' ')}')`)
}

export default applyFulltext
