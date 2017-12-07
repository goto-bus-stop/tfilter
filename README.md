# tfilter

selectively run browserify transforms using globs or a filter function

it is different from most other transform filter packages in that this can be used simply from the CLI.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/tfilter.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/tfilter
[travis-image]: https://img.shields.io/travis/goto-bus-stop/tfilter.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/tfilter
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install tfilter
```

## Usage

```
browserify -t [ tfilter --include '*.js' brfs ]
browserify -t [ tfilter --exclude '**/*.json' envify --NODE_ENV production ]
```

```js
browserify()
  .transform(tfilter(brfs, { include: '*.js' }), { /* options for brfs */ })
  .transform(tfilter(envify, { exclude: /\.json$/ }), { NODE_ENV: 'production' })
  .transform(tfilter(uppercaseify, { filter: function () { return Math.random() < 0.5 } }))
```

### `--include`

Files matching this glob will be transformed. Other files will not be.

### `--exclude`

Files matching this glob will not be transformed. Other files will be.

Using both `--include` and `--exclude` means both conditions apply: A file path must match the `--include` glob **and** must **not** match the `--exclude` glob in order to be transformed.

## Node API

Call `tfilter` with a transform function in the first parameter, and options in the second parameter.
`tfilter(transform, opts)` will return a new transform function that can be passed to browserify.

```js
var babelify = require('babelify')
var tfilter = require('tfilter')

b.transform(
  tfilter(babelify, { include: /\.mjs$/ }),
  { plugins: 'transform-es2015-modules-commonjs' }
)
```

### `include: '' or /./`

Files matching this glob or Regex will be transformed.

### `exclude: '' or /./`

Files matching this glob or Regex will not be transformed.

### `filter: function (filename) {}`

Check if `filename` should be transformed, with some custom logic. If given, `include` and `exclude` are not considered.

## License

[Apache-2.0](LICENSE.md)
