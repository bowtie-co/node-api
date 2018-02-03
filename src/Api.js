const { capitalizeWord, verifyRequired } = require('@bowtie/utils');

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
    headers: {},
    body: {}
  }
};

/**
 * Auth types
 *  - Basic
 *  - Token
 */

/**
 * Api class to handle all interactions with backend
 */
class Api {
  /**
   * Constructor for an Api object
   */
  constructor(settings) {
    this.settings = Object.assign({}, defaults, settings);

    // Validate this API instance
    this.validate();

    this.init();

    // Sanitize all API variables for this API instance
    this.sanitize();
  }

  init() {
    // Root domain for the API (MUST be over HTTPS)
    this.root = this.settings.root;

    // API stage (dev only for now)
    this.stage = this.settings.stage;

    // API path prefix (shouldn't change)
    this.prefix = this.settings.prefix;

    // API version (in case future versions are released, this is easy to change)
    this.version = this.settings.version;
  }

  /**
   * Sanitize all API variables for this API instance
   */
  sanitize() {
    // Split the root member variable on '://' (to ensure protocol exists or we can add it)
    const rootParts = this.root.split('://');

    // If more than 1 part, then protocol is specified
    if (rootParts.length > 1) {
      // Ensure specified protocol is HTTPS
      if (rootParts[0] !== 'https') {
        if (this.settings.secureOnly) {
          throw new Error('API Base URL must use HTTPS');
        } else {
          console.warn('API Base URL should use HTTPS for security');
        }
      }
    } else {
      // No protocol specified in "this.root", so prepend "https://"
      this.root = `https://${this.root}`;
    }

    // Trim trailing slash from root member variable (if present)
    if (this.root.substr(-1) === '/') {
      this.root = this.root.substr(0, this.root.length-1);
    }

    // Remove all slashes from other member variables (stage, prefix, version, etc)
    if (this.stage) this.stage = this.stage.replace(/\//g, '');
    if (this.prefix) this.prefix = this.prefix.replace(/\//g, '');
    if (this.version) this.version = this.version.replace(/\//g, '');

    this.settings.authorization = capitalizeWord(this.settings.authorization);
  }

  isAuthorized() {
    return (this.settings.authorization !== 'None' && this.token);
  }

  authorize(args) {
    if (this.settings.authorization === 'Basic') {
      const { username, password } = args;
      this.token = btoa(`${username}:${password}`);
    } else if (this.settings.authorization === 'Bearer') {
      const { token } = args;

      this.token = token;
    }
  }

  /**
   * Validate this API instance
   */
  validate() {
    const schema = {
      root: 'string',
      verbose: 'boolean',
      secureOnly: 'boolean',
      authorization: 'string',
      defaultOptions: {
        method: 'string',
        headers: 'object',
        body: 'object'
      }
    };

    verifyRequired(this.settings, schema);
  }

  /**
   * Construct the base URL for this API (using other member variables)
   */
  baseUrl() {
    let baseUrl = this.root;

    if (this.stage) baseUrl += '/' + this.stage;
    if (this.prefix) baseUrl += '/' + this.prefix;
    if (this.version) baseUrl += '/' + this.version;

    return `${baseUrl}/`;
  }

  /**
   * Build a request URL for a specific path
   */
  buildUrl(path) {
    // If the path begins with a slash, remove the slash (since the baseUrl function ends with slash already)
    if (path.substr(0, 1) === '/') {
      path = path.substr(1);
    }

    // Return the full URL for the specified path
    return this.baseUrl() + path;
  }

  /**
   * Generic request execution method
   *    For a GET request, only the "path" parameter is required
   */
  callRoute({ path, options={}, params={} }) {
    // Return a promise so we can handle async requests in the components
    return new Promise(
      // Promise format using resolve and reject functions
      (resolve, reject) => {
        if (this.isAuthorized()) {
          const authToken = typeof this.token === 'function' ? this.token() : this.token;

          this.settings.defaultOptions.headers = Object.assign(this.settings.defaultOptions.headers, {
            Authorization: `${this.settings.authorization} ${authToken}`
          });
        }

        // Debug
        this._debug('Calling route:', path);
        
        // Merge options provided to this method with the default options for this API instance
        const callOptions = Object.assign({}, this.settings.defaultOptions, options);
        this._debug("callOptions: ", callOptions);
        
        // Call fetch for the full request URL (using buildUrl function and merged callOptions object)
        fetch(this.buildUrl(path), callOptions)
          // Convert response body to JSON (should trigger catch if fails)
          .then(response => response.json())

          // After converting to JSON, resolve the callRoute() Promise with the returned data
          .then(data => {
            // Debug
            this._debug('Response data', data);

            // Resolve promise
            resolve(data);
          })

          // Catch fetch error and reject the Promise
          .catch(reject)
      }
    );
  }

  /**
   * Helper for simple GET requests (only need to call "api.get('something')")
   */
  get(path) {
    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path });
  }

  post(path, body = {}) {
    const options = {
      method: 'POST',
      body: JSON.stringify(body)
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options });
  }

  put(path, body = {}) {
    const options = {
      method: 'PUT',
      body: JSON.stringify(body)
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options });
  }

  delete(path, body = {}) {
    const options = {
      method: 'DELETE'
    }

    // Return the result (Promise) of callRoute() with the provided path
    return this.callRoute({ path, options });
  }

  _debug() {
    if (this.settings.verbose) {
      console.log(...arguments);
    }
  }
}

module.exports = Api;
