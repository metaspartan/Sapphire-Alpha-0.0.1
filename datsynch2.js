var Dat = require('dat-node')
var mirror = require('mirror-folder')
var ram = require('random-access-memory')
var fs = require('fs')

var synchDatabase = function(callback,peer){
  // 1. My files are in /joe/cat-pic-analysis


    Dat('./SFRX', function (err, dat) {
      if (err) throw err

      // 2. Import the files
      dat.importFiles()

      // 3. Share the files on the network!
      dat.joinNetwork()

      // (And share the link)
      console.log('My Dat link is: dat://'+dat.key.toString('hex'))

      callback("dat://"+dat.key.toString('hex'),peer);
    })
  

}

var grabDataFile = function(mykey){

  var callSynch = function(){

    /***
    Dat('./SFRX', {
      // 2. Tell Dat what link I want
      key: mykey.split("://")[1] // (a 64 character hash from above)
    }, function (err, dat) {
      if(err){
        //throw err
        throw err
        console.log(err.toString());
      }

      // 3. Join the network & download (files are automatically downloaded)
      var network = dat.joinNetwork()
      console.log("database should be written now");
    })
    ***/

    var dest = './SFRX';
    fs.mkdirSync(dest)

    Dat(ram, {
      key: mykey.split("://")[1],
      sparse: true }, function (err, dat) {
      if (err) throw err

      var network = dat.joinNetwork()
      network.once('connection', function () {
        console.log('Connected')
      })
      dat.archive.metadata.update(download)

      function download () {
        var progress = mirror({ fs: dat.archive, name: '/' }, dest, function (err) {
          if (err) throw err
          console.log('Done')
        })
        progress.on('put', function (src) {
          console.log('Downloading', src.name)
        })
      }

      console.log(`Downloading: ${dat.key.toString('hex')}\n`)
    })


  }

  setTimeout(function(){callSynch},1000);

}

module.exports = {
  synchDatabase:synchDatabase,
  grabDataFile:grabDataFile
}
