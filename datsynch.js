var dat = require("dat");
var Dat = require('dat-node')

var synchDatabase = function(callback,peer){
  // 1. My files are in /joe/cat-pic-analysis
  Dat('/SFRX', function (err, dat) {
    if (err) throw err

    // 2. Import the files
    dat.importFiles()

    // 3. Share the files on the network!
    dat.joinNetwork()

    // (And share the link)
    console.log('My Dat link is: dat://', dat.key.toString('hex'))

    callback("dat://"+dat.key.toString('hex'),peer);
  })

}

module.exports = {
  synchDatabase:synchDatabase
}
