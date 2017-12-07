module.exports = function (file, opts) {
  return require('stream').Transform({
    write (chunk, enc, cb) { cb() },
    flush (cb) {
      this.push('module.exports=')
      this.push(JSON.stringify(opts))
      cb()
    }
  })
}
