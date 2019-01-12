var Dat = require('dat-node')
var rmdir = require('rmdir');

//t///////////////////////////////////////////////////////////////OUTBOUND SENDS
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

var synchDatabaseJSON = function(callback,peer){
  // 1. My files are in /joe/cat-pic-analysis
  console.log("and now we are setting data synch called with "+callback+" and "+peer)

  Dat('./SYNC', function (err, dat) {

    if(err){
      //going to attempt to handle this exception and continue
      console.log("error in synchDatabaseJSON: "+err);
      dat.leave();
      dat.close();
      var path = './SYNC/';
      rmdir(path, function (err, dirs, files) {
        console.log(dirs);
        console.log(files);
        console.log('all files are removed');
      });
      setTimeout(function(){
        synchDatabaseJSON(callback,peer)
      },1000)

    }else{
      dat.importFiles()

      // 3. Share the files on the network!
      dat.joinNetwork()

      // (And share the link)
      console.log('My Dat link is: dat://'+dat.key.toString('hex'));

      callback("dat://"+dat.key.toString('hex'),peer);

      setTimeout(function(){
        dat.leave();
        dat.close();
        var path = './SYNC/';
        rmdir(path, function (err, dirs, files) {
          console.log(dirs);
          console.log(files);
          console.log('all files are removed');
        });
      },3000);
    }

  })


}

/////////////////////////////////////THIS IS THE INCOMING FILE FOR SYNCHING PEER
var grabDataFile = function(mykey,cb){

  /****
    var path = './SFRX';
    rmdir(path, function (err, dirs, files) {
      console.log(dirs);
      console.log(files);
      console.log('all files are removed');
    });
  ****/

  setTimeout(function(){
    Dat('./SYNC', {
      // 2. Tell Dat what link I want
      key: mykey.split("://")[1] // (a 64 character hash from above)
    }, function (err, dat) {

      if(err){
        //going to attempt to handle this exception and continue
        console.log("error in grabDataFile: "+err);
        dat.leave();
        dat.close();
        var path = './SYNC/';
        rmdir(path, function (err, dirs, files) {
          console.log(dirs);
          console.log(files);
          console.log('all files are removed');
        });
        setTimeout(function(){
          grabDataFile(mykey,cb)
        },1000)

      }else{
        //dat.resume();
        // 3. Join the network & download (files are automatically downloaded)
        dat.joinNetwork();

        console.log("database should be written now ...STAND BY for memory reload (automatic process)");

        setTimeout(function(){cb();},3000)
      }

    })
  },1000);

  setTimeout(function(){

    var path = './SYNC/';
    rmdir(path, function (err, dirs, files) {
      console.log(dirs);
      console.log(files);
      console.log('all files are removed');
    });

  },20000);


}

module.exports = {
  synchDatabase:synchDatabase,
  synchDatabaseJSON:synchDatabaseJSON,
  grabDataFile:grabDataFile
}
