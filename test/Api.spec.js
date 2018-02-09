/* eslint-env mocha */

const expect = require('chai').expect
const Api = require('../')

describe('Api', function () {
  it('should exist', function () {
    expect(Api).to.be.a('function')
  })

  it('should throw if missing required settings', function () {
    const attempt = () => {
      const api = new Api()

      api.isAuthorized()
    }

    expect(attempt).to.throw()
  })

  it('should now throw with required settings', function () {
    const attempt = () => {
      const api = new Api({
        root: 'api.example.com'
      })

      expect(api).to.be.an.instanceof(Api)
    }

    expect(attempt).to.not.throw()
  })

  it('should constructs baseUrl with only root', function () {
    const api = new Api({
      root: 'api.example.com'
    })

    expect(api.baseUrl()).to.eq('https://api.example.com/')
  })

  it('should construct baseUrl with root and stage', function () {
    const api = new Api({
      root: 'api.example.com',
      stage: 'dev'
    })

    expect(api.baseUrl()).to.eq('https://api.example.com/dev/')
  })

  it('should construct baseUrl with root, stage and prefix', function () {
    const api = new Api({
      root: 'api.example.com',
      stage: 'dev',
      prefix: 'api'
    })

    expect(api.baseUrl()).to.eq('https://api.example.com/dev/api/')
  })

  it('should construct baseUrl with root, stage, prefix and version', function () {
    const api = new Api({
      root: 'api.example.com',
      stage: 'dev',
      prefix: 'api',
      version: 'v1'
    })

    expect(api.baseUrl()).to.eq('https://api.example.com/dev/api/v1/')
  })
})
