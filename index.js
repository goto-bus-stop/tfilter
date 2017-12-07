/* eslint-disable no-redeclare */
var assert = require('assert')
var path = require('path')
var d = require('defined')
var resolve = require('resolve')
var minimatch = require('minimatch')
var through = require('stream').PassThrough
var copy = require('shallow-copy')

module.exports = function transformFilter (file, opts) {
  // Used as a transform, eg from CLI
  if (opts && opts._flags) {
    var transformName = opts._[0]
    assert.equal(typeof transformName, 'string', 'transform-filter: must provide a transform, eg `-t [ transform-filter brfs --include \'*.js\' ]`')
    var trOpts = copy(opts)
    trOpts._ = trOpts._.slice(1)
    delete trOpts.include
    delete trOpts.exclude

    try {
      var transformPath = resolve.sync(transformName, { basedir: path.dirname(file) })
      var transform = require(transformPath)
    } catch (err) {
      return through().emit('error', err)
    }

    var shouldInclude = d(match(file, opts.include), true)
    var shouldExclude = d(match(file, opts.exclude), false)

    if (!shouldExclude && shouldInclude) {
      return transform(file, trOpts)
    }

    return through()
  }

  // Called as a function, returning a transform
  var transform = file
  assert.equal(typeof opts, 'object', 'transform-filter: options must be an object')
  assert.equal(typeof transform, 'function', 'transform-filter: transform must be a function')

  return function (file, trOpts) {
    if (opts.filter) {
      assert.equal(typeof opts.filter, 'function', 'transform-filter: options.filter must be a function')
      return opts.filter(file) ? transform(file, trOpts) : through()
    }

    assert.ok(checkGlobType(opts.include), 'transform-filter: opts.include must be a regex or a glob')
    assert.ok(checkGlobType(opts.exclude), 'transform-filter: opts.exclude must be a regex or a glob')

    var shouldInclude = d(match(file, opts.include), true)
    var shouldExclude = d(match(file, opts.exclude), false)

    if (!shouldExclude && shouldInclude) {
      return transform(file, trOpts)
    }

    return through()
  }
}

function match (file, test) {
  if (test == null) return undefined
  if (test instanceof RegExp) return test.test(file)
  return minimatch(file, test, { matchBase: true })
}

function checkGlobType (val) {
  return typeof val === 'string' || val == null || val instanceof RegExp
}
