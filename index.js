/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * DoboKnex class
   *
   * @class
   */
  class DoboKnex extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }
  }
  return DoboKnex
}

export default factory
