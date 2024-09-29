async function errorHandler (err) {
  let e = this.error('General Database Error', { code: err.code, errno: err.errno })
  switch (err.code) {
    case 'SQLITE_CONSTRAINT': e = this.error('Datatabase Constraint Error'); break
  }
  return e
}

export default errorHandler
