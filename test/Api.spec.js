/* eslint-env mocha */

const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai
const Api = require('../')

chai.use(require('sinon-chai'))

describe('Api', function () {
  const root = 'https://api.example.com'

  it('should exist', function () {
    expect(Api).to.be.a('function')
  })

  describe('#get', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    it('should call fetch GET', function () {
      return api.get('path').then((data) => {
        const options = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  describe('#post', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    it('should call fetch POST', function () {
      const body = {
        data: 'body'
      }

      return api.post('path', body).then((data) => {
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  describe('#put', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    it('should call fetch PUT', function () {
      const body = {
        data: 'body'
      }

      return api.put('path', body).then((data) => {
        const options = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  describe('#patch', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    it('should call fetch PATCH', function () {
      const body = {
        data: 'body'
      }

      return api.patch('path', body).then((data) => {
        const options = {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  describe('#delete', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    it('should call fetch DELETE', function () {
      return api.delete('path').then((data) => {
        const options = {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  describe('#head', function () {
    const api = new Api({
      root
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200
    })

    it('should call fetch HEAD', function () {
      return api.head('path').then((data) => {
        const options = {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
      })
    })
  })

  it('should support dynamic default headers', function () {
    const headers = {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'A fancy custom value'
    }

    const api = new Api({
      root,
      authorization: 'Bearer',
      defaultOptions: {
        headers: () => headers
      }
    })

    api.authorize({
      token: () => 'supersecret'
    })

    sinon.stub(api, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => {
        return Promise.resolve({ data: 'stuff' })
      }
    })

    return api.get('path').then((data) => {
      const options = {
        method: 'GET',
        headers: Object.assign({}, headers, { 'Authorization': 'Bearer supersecret' })
      }
      expect(api.fetch).to.have.been.calledWithExactly(`${root}/path`, options)
    })
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
