async function errorHandler (err) {
  let e = this.error('generalDbError', { code: err.code, errno: err.errno })
  switch (err.code) {
    case 'SQLITE_CONSTRAINT': e = this.error('dbConstrainError'); break
  }
  e.rawError = err
  return e
}

export default errorHandler
