var hyperdrive = require('hyperdrive')
var net = require('net')
var archive = hyperdrive('./pub-sapphire-block-data')
var socket;
var server;

var writeArchive = function(blockinfo){
  archive.readFile('/saphire.json', 'utf-8', function (err, data) {
    if (err){
      console.log(err);
    }else{
      console.log("this is the contents of the file: "+data+" archive key: "+archive.key) // prints 'world'
    }
  })
  archive.writeFile('/saphire.json', '["saphire":{"block":0}]'+blockinfo, function (err) {
    if (err) throw err
    archive.readdir('/', function (err, list) {
      if (err) throw err
      console.log(list) // prints ['hello.txt']
      archive.readFile('/saphire.json', 'utf-8', function (err, data) {
        if (err) throw err
        console.log("this is the contents of the file: "+data) // prints 'world'
      })
    })
  })
  return archive;
}

var readArchive = function(){
  archive.readdir('/', function (err, list) {
    if (err) throw err
    console.log(list) // prints ['hello.txt']
    archive.readFile('/saphire.json', 'utf-8', function (err, data) {
      if (err) throw err
      archive.download();
      console.log("this is the contents of the file: "+data) // prints 'world'
    })
  })
}

var replicateArchive = function(){
  archive.replicate({
    live: true, // keep replicating
    download: true, // download data from peers?
    upload: true // upload data to peers?
  })
}

var publicSapphire = function pubSapphire(origKey,port){
  if(server){
    server.close();
    console.log("we are indeed closing the server")
  }
  var clonedArchive = hyperdrive('./pub-sapphire-block-data', origKey)
  socket = net.connect(port)
  socket.setKeepAlive(true);
  socket.pipe(clonedArchive.replicate({
      live: true, // keep replicating
      download: true, // download data from peers?
      upload: true // upload data to peers
  })).pipe(socket)
  server = net.createServer(function (socket) {
    socket.pipe(archive.replicate({
        live: true, // keep replicating
        download: true, // download data from peers?
        upload: true // upload data to peers
    })).pipe(socket)
  })

  server.listen(port);
}

module.exports = {
  bBlocks:writeArchive,
  bBlockReplication:replicateArchive,
  bReadBlocks:readArchive,
  bBlockServer:publicSapphire
}
