var test = require('tape')
var vm = require('vm')
var path = require('path')
var spawn = require('child_process').spawnSync
var browserify = require('browserify')
var tfilter = require('../')
var uppercaseify = require('./uppercaseify')

var files = {
  a: path.join(__dirname, 'files', 'a.js'),
  b: path.join(__dirname, 'files', 'b.js'),
  c: path.join(__dirname, 'files', 'c.css'),
  d: path.join(__dirname, 'files', 'd.txt')
}

test('include glob', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { include: '*.js' }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.a, files.b ])
    })
})

test('exclude glob', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { exclude: '*.js' }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.c, files.d ])
    })
})

test('include regex', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { include: /a\.js|c\.css/ }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.a, files.c ])
    })
})

test('exclude regex', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { exclude: /txt$/ }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.a, files.b, files.c ])
    })
})

test('filter function', function (t) {
  t.plan(2)
  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { filter: filter }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.a, files.d ])
    })

  function filter (file) { return file === files.a || file === files.d }
})

test('both include and exclude', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { include: '*.js', exclude: 'a.*' }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.b ], 'should only include files that match include and do not match exclude')
    })
})

test('both include and exclude again', function (t) {
  t.plan(2)

  uppercaseify.reset()
  bundle()
    .transform(tfilter(uppercaseify, { include: '{a,b,d}.*', exclude: '*.js' }))
    .bundle(function (err) {
      t.ifError(err)
      t.deepEqual(uppercaseify.files.sort(), [ files.d ], 'should only include files that match include and do not match exclude')
    })
})

test('cli', function (t) {
  var tfilt = require.resolve('../')
  var trf = require.resolve('./uppercaseify')
  t.test('pass transform via cli', function (t) {
    t.plan(1)
    var result = exec('browserify', [ '-t', '[', tfilt, trf, ']', files.a ])
    t.ok(/MODULE.EXPORTS = 'A'/.test(result))
  })

  t.test('--include', function (t) {
    t.plan(2)
    var result = exec('browserify', [ '-t', '[', tfilt, trf, '--include', 'a.js', ']', '-e', files.a, '-e', files.b ])
    t.ok(/MODULE\.EXPORTS = 'A'/.test(result), 'should have transformed a.js')
    t.ok(/module\.exports = 'b'/.test(result), 'should not have transformed b.js')
  })

  t.test('--exclude', function (t) {
    t.plan(2)
    var result = exec('browserify', [ '-t', '[', tfilt, trf, '--exclude', 'a.js', ']', '-e', files.a, '-e', files.b ])
    t.ok(/module\.exports = 'a'/.test(result), 'should not have transformed a.js')
    t.ok(/MODULE\.EXPORTS = 'B'/.test(result), 'should have transformed b.js')
  })

  t.test('passes through transform options', function (t) {
    t.plan(2)
    var result = exec('browserify', [ '-s', 'OPTIONS', '-t', '[', tfilt, require.resolve('./optionsify'), 'positional', '--NODE_ENV', 'production', ']', files.b ])
    var m = { exports: {} }
    vm.runInNewContext(result, {
      module: m,
      exports: m.exports
    })
    t.ok(m.exports)
    delete m.exports._flags
    t.deepEqual(m.exports, {
      _: [ 'positional' ],
      NODE_ENV: 'production'
    })
  })
})

function bundle () {
  var b = browserify({
    entries: [ files.a, files.b, files.c, files.d ]
  })
  b.pipeline.get('syntax').splice(0, 1) // disable syntax check
  return b
}

function exec (cmd, args) {
  var result = spawn(cmd, args, { cwd: path.join(__dirname, '../') })
  return result.stdout.toString()
}
