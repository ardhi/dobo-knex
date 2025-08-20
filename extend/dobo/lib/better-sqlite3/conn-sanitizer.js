import sqlite3 from '../sqlite3/conn.js'

async function connSanitizer (item) {
  return await sqlite3.call(item)
}

export default connSanitizer
