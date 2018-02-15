/* global atob, btoa */

const EventEmitter = require('eventemitter2')
const { capitalizeWord, verifyRequired } = require('@bowtie/utils')

/**
  @typedef ApiHeaders
  @type {object}
  @property {string} [Content-Type=application/json] - Content-Type header. Defaults to 'application/json'
  @property {string} [Authorization] - Optional authorization header(s). Can be set using {@link Api#authorize}
*/

/**
  @typedef FetchOptions
  @type {object}
  @property {string} [method=GET] - HTTP method for fetch request(s). Defaults to 'GET'
  @property {ApiHeaders} [headers] - HTTP headers for fetch requests(s).
  @property {object} [body] - HTTP request payload
*/

/**
  @typedef ApiSettings
  @type {object}
  @property {string} root - Root url/domain for this API
  @property {string} [stage] - API stage (useful for API's built on serverless)
  @property {string} [prefix] - API prefix (i.e. "api")
  @property {string} [version] - API version (i.e. "v1")
  @property {boolean} [verbose=false] - Enable debug logs
  @property {boolean} [secureOnly=true] - Enforce HTTPS API
  @property {string} [authorization='None'] - Authorization type ('Basic' or 'Bearer')
  @property {FetchOptions} [defaultOptions] - Default options to be used for every fetch call
*/

/** @type {ApiSettings} */
const defaults = {
  root: null,
  stage: null,
  prefix: null,
  version: null,
  verbose: false,
  secureOnly: true,
  authorization: 'None',
  defaultOptions: {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

/**
 * Auth types
 *  - Basic
 *  - Token
 */

/**
 * Api class to handle all interactions with backend
 */
class Api extends EventEmitter {
  /**
   * Constructor for an Api object
   * @constructor
   * @param {ApiSettings} settings - Settings to create api instance
   */
  constructor (settings) {
    super()

    this.settings = Object.assign({}, defaults, settings)

    // Validate this API instance
    this.validate()

    // Initialize this API instance
    this.init()

    // Sanitize all API variables for this API instance
    this.sanitize()
  }

  /**
   * Initialize API instance
   * @throws {Error} Unable to load fetch library via NodeJS or window.fetch
   */
  init () {
    // Use detect-node package to determine if usage is NodeJS or browser
    this.isNode = require('detect-node')

    // If NodeJS, use node-fetch package as fetch library
    if (this.isNode) {
      this.fetch = require('node-fetch')

    // If browser, verify window.fetch exists as function and use as fetch library
    } else if (window && window.fetch && typeof window.fetch === 'function') {
      this.fetch = window.fetch.bind(window)

    // Unable to determine fetch library to use
    } else {
      throw new Error('Unable to load fetch')
    }

    // Root domain for the API
    this.root = this.settings.root

    // API stage
    this.stage = this.settings.stage

    // API path prefix
    this.prefix = this.settings.prefix

    // API version (in case future versions are released, this is easy to change)
    this.version = this.settings.version

    this.middlewares = []
  }

  /**
   * Register middleware
   * @param {function} fn - Middleware function (must resolve with response)
   */
  use (fn) {
    this.middlewares.push(fn)
  }

  /**
   * Process middleware chain
   * @param {object} response - Fetch response to be passed through middleware chain
   */
  handleMiddlewares (response) {
    return this.middlewares.reduce((promiseChain, currentTask) => {
      return promiseChain.then(currentTask)
    }, Promise.resolve(response))
  }

  /**
   * Process event emitters for response
   * @param {object} response - Fetch response to trigger events
   */
  handleEvents (response) {
    if (this.eventNames().includes(response.status.toString())) {
      this.emit(response.status.toString(), response)
    }

    if (/2\d\d/.test(response.status)) {
      if (this.eventNames().includes('success')) {
        this.emit('success', response)
      }
    } else {
      if (this.eventNames().includes('error')) {
        this.emit('error', response)
      }
    }

    return Promise.resolve(response)
  }

  /**
   * Sanitize all API variables for this API instance
   * @throws {Error} API root must be HTTPS if secureOnly is true in the {@link ApiSettings}
   */
  sanitize () {
    // Split the root member variable on '://' (to ensure protocol exists or we can add it)
    const rootParts = this.root.split('://')

    // If more than 1 part, then protocol is specified
    if (rootParts.length > 1) {
      // Ensure specified protocol is HTTPS
      if (rootParts[0] !== 'https') {
        if (this.settings.secureOnly) {
          throw new Error('API Base URL must use HTTPS')
        } else {
          console.warn('API Base URL should use HTTPS for security')
        }
      }
    } else {
      // No protocol specified in "this.root", so prepend "https://"
      this.root = `https://${this.root}`
    }

    // Trim trailing slash from root member variable (if present)
    if (this.root.substr(-1) === '/') {
      this.root = this.root.substr(0, this.root.length - 1)
    }

    // Remove all slashes from other member variables (stage, prefix, version, etc)
    if (this.stage) this.stage = this.stage.replace(/\//g, '')
    if (this.prefix) this.prefix = this.prefix.replace(/\//g, '')
    if (this.version) this.version = this.version.replace(/\//g, '')

    // Ensure authorization string is capitalized
    this.settings.authorization = capitalizeWord(this.settings.authorization)
  }

  /**
   * Check if this API instance has a valid token
   * @returns {boolean} - Whether or not this API instance has a valid token
   */
  hasValidToken () {
    const token = this.varOrFn(this.token) || null

    return token && token.trim() !== ''
  }

  /**
   * Check if this API instance is authorized
   * @returns {boolean} - If this API instance has `settings.authorization` set and a valid token
   */
  isAuthorized () {
    return (this.settings.authorization !== 'None' && this.hasValidToken())
  }

  /**
   * Encode given string as base64
   * @example <caption>Example usage of base64encode.</caption>
   * api.base64encode('aGVsbG8gd29ybGQ='); // returns 'hello world'
   * @param {string} str - Input string to be encoded
   * @returns {string} - Returns base64 encoded string
   */
  base64encode (str) {
    if (this.isNode) {
      return Buffer.from(str).toString('base64')
    } else if (typeof btoa === 'function') {
      return btoa(str)
    }
  }

  /**
   * Decode given base64 string
   * @example <caption>Example usage of base64decode.</caption>
   * api.base64encode('hello world'); // returns 'aGVsbG8gd29ybGQ='
   * @param {string} b64 - Base64 string to be decoded
   * @param {string} [format='utf8'] - Target format for decoded string
   * @returns {string} - Returns base64 decoded string
   */
  base64decode (b64, format = 'utf8') {
    if (this.isNode) {
      return Buffer.from(b64, 'base64').toString(format)
    } else if (typeof atob === 'function') {
      return atob(b64)
    }
  }

  /**
   * If ref is a function, execute with optional params.
   * Otherwise, return value of ref
   * @param {*} ref
   * @param {...*} args
   * @returns {*} - Return value of ref(...args) or ref
   */
  varOrFn (ref, ...args) {
    if (typeof ref === 'function') {
      return ref(...args)
    } else {
      return ref
    }
  }

  /**
   * Authorize this API. If token is provided, it will be used for authorization.
   * If username/password are provided, `settings.authorization` must be set to 'Basic',
   * and a token will be generated using {@link Api#base64encode} with input: `${username}:${password}`
   * @param {object} args
   * @param {string|function} [args.token] - A token string, or a function to obtain a token value
   * @param {string|function} [args.username] - A username string, or a function to obtain a username value
   * @param {string|function} [args.password] - A password string, or a function to obtain a password value
   * @throws {Error} - Arguments MUST provide token OR username & password
   */
  authorize (args) {
    if (args.token) {
      this.token = args.token
    } else if (this.settings.authorization === 'Basic' && args.username && args.password) {
      this.token = () => {
        return this.base64encode(`${this.varOrFn(args.username)}:${this.varOrFn(args.password)}`)
      }
    } else {
      throw new Error('Invalid args to authorize()')
    }
  }

  /**
   * Validate this API instance
   * @throws {Error} - If required schema is invalid
   */
  validate () {
    const schema = {
      root: 'string',
      verbose: 'boolean',
      secureOnly: 'boolean',
      authorization: 'string',
      defaultOptions: {
        method: 'string',
        headers: 'object'
      }
    }

    verifyRequired(this.settings, schema)
  }

  /**
   * Construct the base URL for this API (using other member variables)
   * @returns {string} - Returns the constructed BaseUrl (root + stage + prefix + version)
   */
  baseUrl () {
    let baseUrl = this.root

    if (this.stage) baseUrl += '/' + this.stage
    if (this.prefix) baseUrl += '/' + this.prefix
    if (this.version) baseUrl += '/' + this.version

    return `${baseUrl}/`
  }

  /**
   * Build a request URL for a specific path
   * @param {string} path - Build full request url for path
   * @returns {string} - Fully constructed request url
   */
  buildUrl (path) {
    // If the path begins with a slash, remove the slash (since the baseUrl function ends with slash already)
    if (path.substr(0, 1) === '/') {
      path = path.substr(1)
    }

    // Return the full URL for the specified path
    return this.baseUrl() + path
  }

  /**
   * Generic request execution method. For a GET request, only the "path" parameter is required
   * @async
   * @param {object} args - Arguments to call api route
   * @param {string} args.path - Relative api path to fetch
   * @param {FetchOptions} [args.options] - Additional fetch options (will be assigned on top of {@link defaults})
   * @param {object} [args.params] - Query string parameters
   * @returns {Promise<object>} - Returns promise with response data
   */
  callRoute ({ path, options = {}, params = {} }) {
    // Return a promise so we can handle async requests in the components
    return new Promise(
      // Promise format using resolve and reject functions
      (resolve, reject) => {
        // Debug
        this._debug('Calling route:', path)

        // Merge options provided to this method with the default options for this API instance
        const callOptions = Object.assign({}, this.settings.defaultOptions, options)

        if (this.isAuthorized()) {
          callOptions.headers.Authorization = `${this.settings.authorization} ${this.varOrFn(this.token)}`
        }

        this._debug('callOptions: ', callOptions)

        // Call fetch for the full request URL (using buildUrl function and merged callOptions object)
        this.fetch(this.buildUrl(path), callOptions)
          .then(this.handleMiddlewares.bind(this))
          .then(this.handleEvents.bind(this))
          .then(response => {
            this._debug(response)

            if (response.ok) {
              resolve(response)
            } else {
              reject(response)
            }
          })

          // Catch fetch error and reject the Promise
          .catch(reject)
      }
    )
  }

  /**
   * Helper for simple GET requests (only need to call "api.get('something')")
   * @async
   * @example <caption>Example usage of get.</caption>
   * var api = new Api({ root: 'api.example.com' })
   *
   * api.get('todos')
   *   .then(resp => {
   *     // resp = response from GET https://api.example.com/todos
   *   })
   *   .catch(err => {
   *     // Something went wrong
   *   })
   * @returns {Promise<object>} - Returns promise with response data
   */
  get (path) {
    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path })
  }

  /**
   * Query API route for `path` using the POST method with a body
   * @async
   * @example <caption>Example usage of post.</caption>
   * var api = new Api({ root: 'api.example.com' })
   *
   * var payload = {
   *   todo: {
   *     name: 'foobar'
   *   }
   * }
   *
   * api.post('todos', payload)
   *   .then(resp => {
   *     // resp = response from POST https://api.example.com/todos
   *   })
   *   .catch(err => {
   *     // Something went wrong
   *   })
   * @param {string} path - Request path
   * @param {object} [body] - Request payload
   * @returns {Promise<object>} - Returns promise with response data
   */
  post (path, body = {}) {
    const options = {
      method: 'POST',
      body: JSON.stringify(body)
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options })
  }

  /**
   * Query API route for `path` using the PUT method with a body
   * @async
   * @example <caption>Example usage of put.</caption>
   * var api = new Api({ root: 'api.example.com' })
   *
   * var payload = {
   *   todo: {
   *     name: 'new name'
   *   }
   * }
   *
   * api.put('todos/1', payload)
   *   .then(resp => {
   *     // resp = response from PUT https://api.example.com/todos/1
   *   })
   *   .catch(err => {
   *     // Something went wrong
   *   })
   * @param {string} path - Request path
   * @param {object} [body] - Request payload
   * @returns {Promise<object>} - Returns promise with response data
   */
  put (path, body = {}) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(body)
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options })
  }

  /**
   * Query API route for `path` using the DELETE method with a body
   * @async
   * @example <caption>Example usage of delete.</caption>
   * var api = new Api({ root: 'api.example.com' })
   *
   * api.delete('todos/1')
   *   .then(resp => {
   *     // resp = response from DELETE https://api.example.com/todos/1
   *   })
   *   .catch(err => {
   *     // Something went wrong
   *   })
   * @param {string} path - Request path
   * @param {object} [body] - Request payload
   * @returns {Promise<object>} - Returns promise with response data
   */
  delete (path, body = {}) {
    const options = {
      method: 'DELETE'
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options })
  }

  /**
   * Console log all arguments if verbose setting is true
   * @param {...*} args - All args passed to console.log
   */
  _debug () {
    if (this.settings.verbose) {
      console.log(...arguments)
    }
  }
}

module.exports = Api
