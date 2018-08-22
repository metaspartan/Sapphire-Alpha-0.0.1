var Mongo = require('./mongo.js');
var swarm = require('discovery-swarm')
const crypto = require('crypto')
const defaults = require('dat-swarm-defaults')
const readline = require('readline')
const getPort = require('get-port')

Mongo.collection("Blockchain");

//okay trying the mining stuff
var sapphirechain = require("./block.js")
var BLAKE2s = require("./blake2s.js")
var Miner = require("./miner.js")

let ctr = 0;

var msg = "genesis message"
var length = 32;
var key = "ax8906hg4c";
var myDigestVar = "";
//end the mining stuff

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const myId = crypto.randomBytes(32);

const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0

//network related connections
const config = defaults({
  // peer-id
  id: myId,
})

const sw = swarm(config);

;(async () => {
  const port = await getPort()


  sw.listen(port)
  sw.join('egem-spn') // can be any id/name/hash

  sw.on('connection', (conn, info) => {

    console.log(JSON.stringify(info));
    const seq = connSeq
    const peerId = info.id.toString('hex');

    if(info.id != myId){
      frankieCoin.registerNode(peerId,info.host,info.port,frankieCoin.length);
      console.log("here is what we have in info "+JSON.stringify(info));
      console.log('found + connected to peer with id '+peerId);
    }

    conn.on('close', () => {
      // Here we handle peer disconnection
      console.log(`Connection ${seq} closed, peer id: ${peerId}`)
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerId].seq === seq) {
        delete peers[peerId]
      }
      //connSeq--
    })

    conn.on('data', data => {
      // Here we handle incomming messages
      console.log(
        'Received Message from peer ' + peerId,
        '----> ' + data.toString()
      )

      console.log("object data: "+JSON.parse(data)["previousHash"]);
      if(JSON.parse(data)["previousHash"]){
        frankieCoin.addBlockFromPeers(JSON.parse(data));
        frankieCoin.incrementPeerNonce(peerId,frankieCoin.getLength());
        console.log("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock()));
        Mongo.findOne("Blockchain","previousHash",frankieCoin.getLatestBlock()["previousHash"]);
        Mongo.insertCollection("Blockchain",frankieCoin.getLatestBlock());
      }

      /***
      if(data.toString() == "My Genesis Hash is: "+globalGenesisHash){
        console.log("the hash matched you would record that now");
      }
      ****/

    })

    // Save the connection
    if (!peers[peerId]) {
      peers[peerId] = {}
    }
    peers[peerId].conn = conn
    peers[peerId].seq = seq
    connSeq++
  })

})()

var broadcastPeers = function(message){
  for (let id in peers) {
    peers[id].conn.write(message)
  }
}

function queryr2(query){
  rl.question(query, (answer) => {
    console.log(`input: ${query} ${answer}`);
    if(query == "getBlock"){
      console.log(JSON.stringify(frankieCoin.getBlock(parseInt(answer))));
      queryr1();
    }else if(query == "getBalance"){
      franks.getBalanceOfAddress(answer);
      //note I did not need to use the miner function for balances
      var getBalance2 = frankieCoin.getBalanceOfAddress(answer);
      console.log('\nMiners Function Balance of '+answer+' is', getBalance2);
      queryr1();
    }else{
      console.log("not a valid query at this time");
      queryr1();
    }
  })
}

function queryr1(){
  //command line stuff
  rl.question('console action: ', (answer) => {
    // TODO: Log the answer in a database
    console.log(`selected: ${answer}`);
    if(answer == "M"){//M is for mine
      console.log("[placeholder] this would be mining stats");
      console.log("get latest block: "+frankieCoin.getLatestBlock().nonce.toString());
      franks.calculateDigest("first try",10);
      broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));
      queryr1();
    }else if(answer == "O"){//O is for order
      console.log("maybe can do logic for an order at the console line but for now...");
      frankieCoin.createOrder(new sapphirechain.Order('0x5c4ae12c853012d355b5ee36a6cb8285708760e6','SELL','SPHREGEM',200,0.24));
      queryr1();
    }else if(answer == "B"){//B is for balance
      console.log("maybe can do logic for BALANCE of ADDRESS at the console line but for now...");
      queryr2("getBalance");
      //console.log("chain is now: "+JSON.stringify(frankieCoin));
      //console.log("balance is: "+frankieCoin.getBalanceOfAddress("0x0666bf13ab1902de7dee4f8193c819118d7e21a6")+" <---why no money");
      //console.log("balance is: "+franks.getBalanceOfAddress("0x0666bf13ab1902de7dee4f8193c819118d7e21a6")+" <---why no money");
      //queryr1();
    }else if(answer == "T"){//T is for talk
      console.log("had to not just broadcast everything I write to all peers so only sender sees this");
      broadcastPeers("...but all peers see that this was sent from "+myId);
      queryr1();
    }else if(answer == "N"){//N is for Node info
      console.log("NODEZZZZZZ LULZ: ");
      console.log(JSON.stringify(frankieCoin.retrieveNodes()));
      queryr1();
    }else if(answer == "G"){//N is for Node info
      console.log("BLOCK NUMBER: 1");
      queryr2("getBlock");
    }else if(answer == "S"){//N is for Node info
      console.log("Western Union is no longer the fastest way to send money.....");
      frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 20, "SPHR"));
      frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 10, "EGEM"));
      frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 5, "XSH"));
      frankieCoin.createOrder(new sapphirechain.Order('0x0666bf13ab1902de7dee4f8193c819118d7e21a6','BUY','SPHREGEM',3500,0.25));
      frankieCoin.createOrder(new sapphirechain.Order('0x5c4ae12c853012d355b5ee36a6cb8285708760e6','SELL','SPHREGEM',200,0.24));
      queryr1();
    }else if(answer.includes("Send(")){//adding function capabilioties
      console.log(answer.slice(answer.indexOf("Send(")+5, answer.indexOf(")")));
      var jsonSend = answer.slice(answer.indexOf("Send(")+5, answer.indexOf(")"));
      var from = JSON.parse(jsonSend)["from"];
      var to = JSON.parse(jsonSend)["to"];
      var amount = JSON.parse(jsonSend)["amount"];
      var ticker = JSON.parse(jsonSend)["ticker"];
      console.log("Sending "+amount+" "+ticker+" from "+from+" to "+to);
      frankieCoin.createTransaction(new sapphirechain.Transaction(from, to, amount, ticker));
      queryr1();
      //queryr2("getBlock");
    }else if(answer.includes("Order(")){//adding function capabilioties
      console.log(answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")")));
      var jsonSend = answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")"));
      var maker = JSON.parse(jsonSend)["maker"];
      var action = JSON.parse(jsonSend)["action"];
      var amount = JSON.parse(jsonSend)["amount"];
      var price = JSON.parse(jsonSend)["price"];
      var pair = JSON.parse(jsonSend)["pair"];
      var ticker = JSON.parse(jsonSend)["ticker"];
      console.log("Placing order to "+action+" "+amount+" of "+ticker+" for "+price+" by "+maker);
      frankieCoin.createOrder(new sapphirechain.Order(maker,action,pair,amount,price));
      queryr1();
      //queryr2("getBlock");
    }else{
      console.log("[placeholder] that selection is not valid atm");
      queryr1();
    }
    //rl.close();
  });
}

var miner = function(frankieCoin){
  var franks = new Miner.Miner("first try", 32, "tryanewkey", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "0x5c4ae12c853012d355b5ee36a6cb8285708760e6",frankieCoin)
  return franks;
}

var blockchain = function(){
  var frankieCoin = new sapphirechain.Blockchain();
  return frankieCoin;
}

var frankieCoin = blockchain();
console.log("peer chain is"+ frankieCoin.getEntireChain());
var franks = miner(frankieCoin);
queryr1();

module.exports = {
  broadcastPeers:broadcastPeers,
  miner:miner,
  blockchain:blockchain
}
