/* global describe, it, beforeEach */

import { expect } from 'chai'
import factory from '../../index.js'
import { createAppStub } from './_stub.js'

describe('dobo-knex class (unit)', () => {
  let app
  let DoboKnex
  let plugin

  beforeEach(async () => {
    app = createAppStub('/tmp/dobo-knex-unit')
    DoboKnex = await factory.call({ app }, 'dobo-knex')
    plugin = new DoboKnex()
  })

  it('builds plugin class with empty config and inherited identity', () => {
    expect(plugin.config).to.deep.equal({})
    expect(plugin.ns).to.equal('doboKnex')
    expect(plugin.pkgName).to.equal('dobo-knex')
  })
})
