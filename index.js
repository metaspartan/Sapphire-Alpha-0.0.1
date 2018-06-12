process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var Peers = require('./peers.js');
var Blockchain = require('./blockchain.js');
var port = 10004;

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

var archive = Blockchain.bBlocks('["saphire":{"block":1}]');
Blockchain.bBlockServer(archive.key,port);
archive = Blockchain.bBlocks('["saphire":{"block":2}]');
