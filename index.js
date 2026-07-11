/**
 * Plugin factory.
 *
 * **Never** call this function directly!!! It's only-meant to be called by the {@link https://ardhi.github.io/bajo|Bajo framework} during plugin initialization.
 *
 * @param {string} pkgName - NPM package name
 * @returns {DoboKnex}
 */
async function factory (pkgName) {
  const me = this

  /**
   * DoboKnex class definition.
   *
   * @class
   */
  class DoboKnex extends this.app.baseClass.Base {
    /**
     * Constructor.
     */
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }
  }
  return DoboKnex
}

export default factory
