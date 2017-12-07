module.exports = uppercaseify

uppercaseify.files = []
uppercaseify.reset = function () { uppercaseify.files = [] }

function uppercaseify (file) {
  uppercaseify.files.push(file)
  return require('stream').Transform({
    transform (chunk, enc, cb) {
      this.push(String(chunk).toUpperCase())
      cb()
    }
  })
}
