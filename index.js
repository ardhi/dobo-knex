import knexDriverFactory from './lib/knex-driver-factory.js'

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  const KnexDriver = await knexDriverFactory.call(this)

  /**
   * DoboKnex class
   *
   * @class
   */
  class DoboKnex extends this.app.baseClass.Base {
    static alias = 'dbknex'
    static dependencies = ['dobo']

    constructor () {
      super(pkgName, me.app)
      this.config = {}
      this.baseClass = { KnexDriver }
      /*
      this.drivers = [
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
          name: 'manticoresearch',
          dialect: 'mysql',
          adapter: 'mysql',
          lowerCaseModel: true,
          returning: false
        }
      ]
      */
    }
  }
  return DoboKnex
}

export default factory
