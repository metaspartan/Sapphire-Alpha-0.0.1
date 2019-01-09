var Dat = require('dat-node')
var rmdir = require('rmdir');


var synchDatabase = function(callback,peer){
  // 1. My files are in /joe/cat-pic-analysis

  console.log("and now we are setting data synch called with "+callback+" and "+peer)

  Dat('./SFRX2', function (err, dat) {

    if (err) throw err

      dat.importFiles()

      // 3. Share the files on the network!
      dat.joinNetwork()

      // (And share the link)
      console.log('My Dat link is: dat://'+dat.key.toString('hex'));

      callback("dat://"+dat.key.toString('hex'),peer);

      setTimeout(function(){
        dat.leave();
        dat.close();
        var path = './SFRX2';
        rmdir(path, function (err, dirs, files) {
          console.log(dirs);
          console.log(files);
          console.log('all files are removed');
        });
      },2000);

  })


}

/////////////////////////////////////THIS IS THE INCOMING FILE FOR SYNCHING PEER
var grabDataFile = function(mykey,cb){

  Dat('./SFRX', {
    // 2. Tell Dat what link I want
    key: mykey.split("://")[1] // (a 64 character hash from above)
  }, function (err, dat) {
    if(err){
      //throw err
      throw err
      console.log("this error thrown opening the dat "+err.toString());
    }

    dat.resume();
    // 3. Join the network & download (files are automatically downloaded)
    dat.joinNetwork();

    console.log("database should be written now please restart your node");

    setTimeout(function(){cb();},3000)
  })

}

module.exports = {
  synchDatabase:synchDatabase,
  grabDataFile:grabDataFile
}
