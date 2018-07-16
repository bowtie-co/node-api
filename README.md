[![build status](https://img.shields.io/travis/bowtie-co/node-api.svg?style=flat-square)](https://travis-ci.org/bowtie-co/node-api)
[![npm version](https://img.shields.io/npm/v/@bowtie/api.svg?style=flat-square)](https://www.npmjs.com/package/@bowtie/api)
[![node version](https://img.shields.io/node/v/@bowtie/api.svg?style=flat-square)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dt/@bowtie/api.svg?style=flat-square)](https://www.npmjs.com/package/@bowtie/api)
[![GitHub contributors](https://img.shields.io/github/contributors/bowtie-co/node-api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/graphs/contributors)
[![license](https://img.shields.io/npm/l/@bowtie/api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/blob/master/LICENSE)

[![GitHub pull requests](https://img.shields.io/github/issues-pr/bowtie-co/node-api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/pulls)
[![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/bowtie-co/node-api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/pulls?utf8=%E2%9C%93&q=is%3Apr+is%3Aclosed+)
[![GitHub issues](https://img.shields.io/github/issues/bowtie-co/node-api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/issues)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/bowtie-co/node-api.svg?style=flat-square)](https://github.com/bowtie-co/node-api/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aclosed+)

# @bowtie/api
JavaScript utilities and helpers

- [Installation](#installation)
- [Documentation](#documentation)
- [Basic Usage](#basic-usage)
  - [GET Example](#get-example)
  - [POST Example](#post-example)
  - [PUT Example](#put-example)
  - [DELETE Example](#delete-example)
- [Base URL Config](#base-url-config)
- [Authorization](#authorization)
  - [Basic Auth](#basic-auth)
  - [Bearer Token](#bearer-token)
  - [Custom Auth](#custom-auth)
- [Ignore Security](#ignore-security)
- [Enable Debug Logs](#enable-debug-logs)

## Installation

```bash
npm install --save @bowtie/api
```

## Documentation

[Documentation](https://bowtie-co.github.io/node-api)

## Basic Usage

```javascript
// Require @bowtie/api class definition
const Api = require('@bowtie/api')

// Create api instance
const api = new Api({
  root: 'api.example.com' // Will default to https:// if no protocol is provided here
})
```

#### GET Example

```javascript
// REST GET /todos - Get all todos
api.get('todos')
  .then(resp => {
    // resp = response from GET https://api.example.com/todos
  })
  .catch(err => {
    // Something went wrong
  })
```

#### POST Example

```javascript
// REST POST /todos - Create new todo
api.post('todos', { name: 'new todo' })
  .then(resp => {
    // resp = response from POST https://api.example.com/todos
  })
  .catch(err => {
    // Something went wrong
  })
```

#### PUT Example

```javascript
// REST PUT /todos/1 - Update todo with id=1
api.put('todos/1', { name: 'changed name' })
  .then(resp => {
    // resp = response from PUT https://api.example.com/todos/1
  })
  .catch(err => {
    // Something went wrong
  })
```

#### DELETE Example

```javascript
// REST DELETE /todos/1 - Delete todo with id=1
api.delete('todos/1')
  .then(resp => {
    // resp = response from DELETE https://api.example.com/todos/1
  })
  .catch(err => {
    // Something went wrong
  })
```

## Base URL Config

```javascript
// Create api instance
const api = new Api({
  root: 'api.example.com', // Set beginning of the baseUrl to https://api.example.com
  stage: 'test',           // Append "/test" to baseUrl (i.e. https://api.example.com/test)
  prefix: 'api',           // Append "/api" to baseUrl  (i.e. https://api.example.com/test/api)
  version: 'v1'            // Append "/v1" to baseUrl   (i.e. https://api.example.com/test/api/v1)
})

// baseUrl is constructed as follows: (only api.root is required, any combination of stage/prefix/version is allowed)
baseUrl = `${api.root}/${api.stage}/${api.prefix}/${api.version}`;
```

## Authorization

#### Basic Auth

```javascript
// Create api instance
const api = new Api({
  root: 'api.example.com', // Will default to https:// if no protocol is provided here
  authorization: 'Basic'   // Specify Basic authorization type for this api
})

// Authorize api for basic auth with username & password
api.authorize({
  username: 'user',
  password: 'pass'
})
```

#### Bearer Token

```javascript
// Create api instance
const api = new Api({
  root: 'api.example.com', // Will default to https:// if no protocol is provided here
  authorization: 'Bearer'  // Specify Bearer authorization type for this api
})

// Authorize with static token value
api.authorize({
  token: 'abc123'
})

// Authorize with dynamic token function
api.authorize({
  token: () => localStorage.getItem('access_token')
})
```

#### Custom Auth

```javascript
// Create api instance
const api = new Api({
  root: 'api.example.com', // Will default to https:// if no protocol is provided here
  authorization: 'Custom'  // Specify Custom authorization type for this api
})

// Authorize with static headers
api.authorize({
  headers: {
    'token': 'abc123'
  },
  validate: () => {
    // Function to validate the custom auth, returns true/false
    return true
  }
})

// Authorize with dynamic headers
api.authorize({
  token: () => ({
    'token': localStorage.getItem('access_token'),
    'uid': localStorage.getItem('uid')
  }),
  validate: () => {
    // Function to validate the custom auth, returns true/false
    return true
  }
})
```

Example using the [j-toker](https://github.com/lynndylanhurley/j-toker) package with headers from [devise_token_auth](https://github.com/lynndylanhurley/devise_token_auth)

```javascript
const Auth = require('j-toker')

// Configure j-toker apiUrl to match api.baseUrl()
Auth.configure({
  apiUrl: api.baseUrl()
})

// Authorize with custom headers that retrieve authHeaders from j-toker "Auth" instance
api.authorize({
  headers: () => Auth.retrieveData('authHeaders'),
  validate: () => Auth.user.signedIn
})
```

## Ignore security

```javascript
// Create api instance
const api = new Api({
  root: 'http://localhost:3000', // Use a local development API over HTTP (not secure HTTPS)
  secureOnly: false              // Disable secure HTTPS requirement
})
```

## Enable Debug logs

```javascript
// Create api instance
const api = new Api({
  root: 'api.example.com', // Will default to https:// if no protocol is provided here
  verbose: true            // Set verbose=true to enable debug log output
})
```
