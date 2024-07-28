export default [
  {
    name: 'better-sqlite3',
    adapter: 'better-sqlite3',
    returning: true
  },
  {
    name: 'cockroachdb',
    adapter: 'pg',
    returning: true
  },
  {
    name: 'mssql',
    adapter: 'tedious',
    returning: true
  },
  {
    name: 'mysql',
    adapter: 'mysql',
    returning: false
  },
  {
    name: 'mysql2',
    adapter: 'mysql2',
    returning: false
  },
  {
    name: 'oracle',
    adapter: 'oracle',
    returning: true
  },
  {
    name: 'oracledb',
    adapter: 'oracledb',
    returning: true
  },
  {
    name: 'pgnative',
    adapter: 'pg-native',
    returning: true
  },
  {
    name: 'postgres',
    adapter: 'pg',
    returning: true
  },
  {
    name: 'redshift',
    adapter: 'pg',
    returning: false
  },
  {
    name: 'sqlite3',
    adapter: 'sqlite3',
    returning: true
  },
  {
    name: 'manticore',
    dialect: 'mysql',
    adapter: 'mysql',
    lowerCaseColl: true,
    returning: false
  }
]
