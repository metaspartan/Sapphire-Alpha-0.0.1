const crypto = require('crypto')
const sha256 = require('crypto-js/sha256')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')
const readline = require('readline')
var Genesis = require('./genesis')
const fs = require('fs');

const chalk = require('chalk');
const log = console.log;

/**
 * Here we will save our TCP peer connections
 * using the peer id as key: { peer_id: TCP_Connection }
 */
const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0

// Peer Identity, a random hash for identify your peer
const myId = crypto.randomBytes(32)
log('Your identity: ' + myId.toString('hex'))
var globalGenesisHash = "";
var filename = "genesis.js";
var tbh = "";
var output = fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    tbh=data;
    log("output is"+tbh);
    if (Genesis.genesisGlobalHash == "right now its nothing"){
      log("it validated and just to check tbh is"+tbh)
      globalGenesisHash = sha256(tbh).toString();
      log("now its global gen hash "+globalGenesisHash)
    }else{
      log("it did not validate")
    }
});

log("THE HASH IS:"+globalGenesisHash);

// reference to redline interface
let rl
/**
 * Function for safely call log with readline interface active
 */
function log () {
  if (rl) {
    rl.clearLine()
    rl.close()
    rl = undefined
  }
  var outmsg = "";
  for (let i = 0, len = arguments.length; i < len; i++) {
    outmsg+=arguments[i];
  }
  log(outmsg)
  //askUser()
}


var broadcastPeers = function(message){
  for (let id in peers) {
    peers[id].conn.write(message)
  }
}
/*
* Function to get text input from user and send it to other peers
* Like a chat :)
*/
const askUser = async () => {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('Send message: ', message => {
    // Broadcast to peers
    for (let id in peers) {
      peers[id].conn.write(message)
    }
    rl.close()
    rl = undefined
    askUser()
  });
}

/**
 * Default DNS and DHT servers
 * This servers are used for peer discovery and establishing connection
 */
const config = defaults({
  // peer-id
  id: myId,
})

/**
 * discovery-swarm library establishes a TCP p2p connection and uses
 * discovery-channel library for peer discovery
 */
const sw = Swarm(config)


;(async () => {

  // Choose a random unused port for listening TCP peer connections
  const port = await getPort()

  sw.listen(port)
  log('Listening to port: ' + port)

  /**
   * The channel we are connecting to.
   * Peers should discover other peers in this channel
   */
  sw.join('egem-crypto-sidechain-testing')

  sw.on('connection', (conn, info) => {
    // Connection id
    const seq = connSeq
    const peerId = info.id.toString('hex')

    log(`Connected #${seq} to peer: ${peerId} and genHash is `+globalGenesisHash)
    conn.write("My Genesis Hash is: "+globalGenesisHash)

    // Keep alive TCP connection with peer
    if (info.initiator) {
      try {
        conn.setKeepAlive(true, 600)
      } catch (exception) {
        log('exception', exception)
      }
    }

    conn.on('data', data => {
      // Here we handle incomming messages
      log(
        'Received Message from peer ' + peerId,
        '----> ' + data.toString()
      )

      if(data.toString() == "My Genesis Hash is: "+globalGenesisHash){
        log("the hash matched you would record that now");
      }

    })

    conn.on('close', () => {
      // Here we handle peer disconnection
      log(`Connection ${seq} closed, peer id: ${peerId}`)
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerId].seq === seq) {
        delete peers[peerId]
      }
    })

    // Save the connection
    if (!peers[peerId]) {
      peers[peerId] = {}
    }
    peers[peerId].conn = conn
    peers[peerId].seq = seq
    connSeq++

  })

  /***
  sw.on('peer', function(peer) {
    log('this is specifically the peer connection')
  })


  sw.on('connecting', function(peer) {
    log('just in the process of connecting to a peer')
  })
  ***/

  // Read user message from command line
  //askUser()

})()

module.exports = {
  bPeers:broadcastPeers
}
