var Dat = require('dat-node')

var synchDatabase = function(callback,peer){
  // 1. My files are in /joe/cat-pic-analysis
  Dat('./SFRX', function (err, dat) {
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

var grabDataFile = function(mykey){
  Dat('./SFRX', {
    // 2. Tell Dat what link I want
    key: mykey.split("://")[1] // (a 64 character hash from above)
  }, function (err, dat) {
    if (err) throw err

    // 3. Join the network & download (files are automatically downloaded)
    dat.joinNetwork()
    console.log("database should be written now");
  })
}

module.exports = {
  synchDatabase:synchDatabase,
  grabDataFile:grabDataFile
}
