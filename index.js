//adding the miners
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// print process.argv
const optionDefinitions = [
  { name: 'port1', alias: 'c', type: Number },
  { name: 'port2', alias: 'm', type: Number }
];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
//end add the miners
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var Peers = require('./peers.js');
var Blockchain = require('./blockchain.js');
var port = options["port1"];
var port2 = options["port2"];

process.stdin.on('data', function (text) {
  console.log('received data:', util.inspect(text));
  Blockchain.bBlockServer(archive.key,port);
  Peers.bPeers(text);
  if (text.substring(0, 4) === 'quit') {
    done();
  }else if (text.substring(0, 2) === 'sm'){
    rl();
  }else if (text.substring(0, 2) === 'rm'){
    rl();
  }else if (text.substring(0, 2) === 'bm'){
    Blockchain.bBlocks('["saphire":{"block":3}]');
    //Blockchain.bBlockReplication();
  }else if (text.substring(0, 2) === 'gc'){
    Blockchain.bBlockServer(archive.key,port);
    Blockchain.bReadBlocks();
  }
});

function done() {
  console.log('Now that process.stdin is paused, there is nothing more to do.');
  process.exit();
}

function rl() {
  console.log('type message and hit enter to broadcast:');
}

//when starting new chain look at the line below
//var archive = Blockchain.bBlocks('["saphire":{"block":1}]');
var archive = Blockchain.bBlocks('');
var archive = Blockchain.bReadBlocks();

Blockchain.bBlockServer(archive.key,port);

//archive = Blockchain.bBlocks('["saphire":{"block":2}]');

//------------------------------------------------------------------------------------------------
///this is the original server stuff for the soclet chat
//note on consenses maybe can hash a genesis file as I return it also
app.get('/public/js/blake2s.js', function(req, res){
  res.sendFile(__dirname + '/public/js/blake2s.js');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

io.on('connection', function(socket){
  console.log("miner connection initialized");
  //should I give him an id?

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('message: ' + msg);

    //testing messaging to Peers
    Peers.bPeers(msg);
    //this part probably will change
    Blockchain.bBlocks(Blockchain.bReadBlocks()+msg);

  });
  socket.on('broadcast message', function(msg){
    io.emit('broadcast message', msg);
    console.log('broadcasting message: ' + msg);
    console.log('saving blockchain data in broadcast: '+Blockchain.bReadBlocks()+msg)

    //testing messaging to Peers
    Peers.bPeers(msg);
    //this part probably will change
    Blockchain.bBlocks(Blockchain.bReadBlocks()+msg);

  });
});

http.listen(port2, function(){
  //this will fail on two peers same machine so make dynamic
  console.log('listening on *:'+port2);
});
///end socket chat
//-----------------------------------------------------------------------------------------------
