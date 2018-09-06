/******************************************************************************/
//
//  EGEM Sapphire Peer.js
//  Currently licensed under MIT
//  A copy of this license must be included in all copies
//  Copyright (c) 2018 Frank Triantos aka OSOESE
//
/******************************************************************************/
var swarm = require('discovery-swarm')
const crypto = require('crypto')
const defaults = require('dat-swarm-defaults')
const readline = require('readline')
const getPort = require('get-port')
//genesis hash variables
var Genesis = require('./genesis')
const fs = require('fs');
const sha256 = require('crypto-js/sha256');

////////////////////////////////////calls the nano-sql data interface to leveldb
var BlockchainDB = require('./nano.js');

///////////////////////Mining stuff : blockchain algo and mining initializations
var sapphirechain = require("./block.js")
var BLAKE2s = require("./blake2s.js")
var Miner = require("./miner.js")

let ctr = 0;

var msg = "genesis message"
var length = 32;
var key = "ax8906hg4c";
var myDigestVar = "";
////////////////////////////////////////////////////////////end the mining stuff

////////////////////////////////////////////////////////////////////genesis hash
var globalGenesisHash = "";
var filename = "genesis.js";
var tbh = "";

var output = fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    tbh=data.replace(/(\r\n|\n|\r)/gm,"");//removes ALL line breaks
    if (Genesis.genesisGlobalHash == "This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM"){
      console.log("it validated and just to check tbh is"+tbh)
      globalGenesisHash = sha256(tbh).toString();
      console.log("now its global gen hash "+globalGenesisHash);
      //console.log("the peer hash is "+Genesis.fileHash);//doesn't read this line
    }else{
      console.log("it did not validate")
    }
});

console.log("PEER.JS REPORTING THAT THE HASH IS:"+globalGenesisHash);
////////////////////////////////////////////////////////////////end genesis hash

/////////////////////////////////////////////////initialize the CLI query system
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
//////////////////////////////////////////////////////////////end CLI query init

/////////////////////////////////////////////asynchronous peer connection engine
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

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

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

////////////////////////////////////////////begin the if block for incoming data
      if(isJSON(data.toString())){
        //console.log("object data: "+JSON.parse(data)["previousHash"]);
////////////////////////////////////////////////////////////incomeing peer block
        if(JSON.parse(data)["previousHash"]){
          //storing some variables of current chain
          var currentChainHash = frankieCoin.getLatestBlock()["hash"];
          var blocknumber = 0;
          //first we add the block to the blockchain
          frankieCoin.addBlockFromPeers(JSON.parse(data));
          //increment the internal peer nonce of sending party to track longest chain
          frankieCoin.incrementPeerNonce(peerId,frankieCoin.getLength());
          //logging the block added to chain for console
          console.log("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock()));
          //verfiy the previous hash in the database matches our expectations - code is incomplete atm
          if(frankieCoin.getLatestBlock()["previousHash"] == currentChainHash){
            console.log("hash matches and we are good");
            blocknumber = frankieCoin.getLength();
            console.log("the database block number is "+blocknumber);
          }else{
            console.log("otherwise need to synch because block hash is "+frankieCoin.getLatestBlock()["previousHash"]+" compared to "+currentChainHash);
          }
///////////////update the client database OR reject block and rollback the chain - code is incomplete atm
          var peerblock = {"blockchain":{
            id:null,
            blocknum:parseInt(frankieCoin.getLength()),
            previousHash:JSON.parse(data)["previousHash"],
            timestamp:JSON.parse(data)["timestamp"],
            transactions:JSON.parse(data)["transactions"],
            orders:JSON.parse(data)["orders"],
            hash:JSON.parse(data)["hash"],
            nonce:JSON.parse(data)["nonce"],
            eGEMBackReferenceBlock:JSON.parse(data)["eGEMBackReferenceBlock"],
            egemBackReferenceBlockHash:JSON.parse(data)["egemBackReferenceBlockHash"],
            data:JSON.parse(data)["data"],
            sponsor:JSON.parse(data)["sponsor"],
            miner:JSON.parse(data)["miner"],
            hardwareTx:JSON.parse(data)["hardwareTx"],
            softwareTx:JSON.parse(data)["softwareTx"],
            targetBlock:JSON.parse(data)["targetBlock"],
            targetBlockDataHash:JSON.parse(data)["targetBlockDataHash"],
            allConfig:JSON.parse(data)["allConfig"],
            allConfigHash:JSON.parse(data)["allConfigHash"],
            hashOfThisBlock:JSON.parse(data)["hashOfThisBlock"]
          }};
          console.log("what is being sent"+JSON.stringify(peerblock));
          /***this is the format of the JSON thta works with nano-sql for input
          var peerblock2 = {blockchain:{
            id:null,blocknum:1,
            previousHash:"97f2c5c6f5a30cc9d89d24f68e75ac7e12c34e64c65914f74ab89ad9e665e3ab",
            timestamp:1535292384948,transactions:{},orders:{},hash:"0005c015f465e8ed6a116d3d24136058dc7a6e72fc651acb3ad8120b7c82ae93",
            nonce:3696,eGEMBackReferenceBlock:472,egemBackReferenceBlockHash:"0x0ed923fa347268f2d7b8e4a1a8d0ce61f810512ddaaec6729e66b004eb61e5e7",
            data:"",sponsor:"0x2025ed239a8dec4de0034a252d5c5e385b73fcd0",miner:"0x0666bf13ab1902de7dee4f8193c819118d7e21a6",hardwareTx:"",softwareTx:"",
            targetBlock:"",targetBlockDataHash:"",allConfig:"",allConfigHash:"",hashOfThisBlock:""
          }};
          ***/
          BlockchainDB.addBlock(peerblock);
          //Mongo.insertCollection("Blockchain",frankieCoin.getLatestBlock());
        }else if(JSON.parse(data)["ChainSyncPing"]){

          console.log(JSON.parse(data)["ChainSyncPing"]);
          if(JSON.parse(data)["ChainSyncPing"]["globalGenesisHash"] == globalGenesisHash){

            console.log("global hashes matched");

            var peerBlockHeight = JSON.parse(data)["ChainSyncPing"]["Height"];
            //increment it by one to return the next block
            peerBlockHeight++;
            //returning the block
            if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
              peers[peerId].conn.write(JSON.stringify(frankieCoin.getBlock(parseInt(peerBlockHeight))));
            }else if(frankieCoin.getLength() == parseInt(peerBlockHeight)){
              peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
            }
            //setting a delay and pong back
            setTimeout(function(){peers[peerId].conn.write("ChainSyncPong("+peerBlockHeight+")");},5000);
            //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }

        }

      }else{

        //will repoen the GENESIS HASH NEXT

        if(data.toString() == "My Genesis Hash is: "+globalGenesisHash){
          console.log("the hash matched you would record that now");
        }


        //peer(s) gets blockheight from synching peer and returns next block
        if(data.toString().includes("ChainSyncPing(")){
          var peerBlockHeight = data.toString().slice(data.toString().indexOf("ChainSyncPing(")+14, data.toString().indexOf(")"));
          //increment it by one to return the next block
          peerBlockHeight++;
          //peers[peerId].conn.write("BlockHeight: "+frankieCoin.getLength());//messaging? perhaps change to JSON
          //returning the block
          if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
            peers[peerId].conn.write(JSON.stringify(frankieCoin.getBlock(parseInt(peerBlockHeight))));
          }else if(frankieCoin.getLength() == parseInt(peerBlockHeight)){
            peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }
          //setting a delay and pong back
          setTimeout(function(){peers[peerId].conn.write("ChainSyncPong("+peerBlockHeight+")");},5000);
          //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
        }

        if(data.toString().includes("ChainSyncPong(")){
          //returned block from sunched peer and parses it for db
          var peerBlockHeight = data.toString().slice(data.toString().indexOf("ChainSyncPong(")+14, data.toString().indexOf(")"));
          //ping back to synched peer - possibly should open this up as broadcast MUST TEST
          setTimeout(function(){peers[peerId].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");},3000)
        }

        if(data.toString().includes("BlockHeight: ")){
          console.log("Blockheight is "+data.toString());
        }

      }/////////////////////////////////////////end the if block for data inputs

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
/////////////////////////////////////ending asynchronous peers connection engine

//////////////////////////////////////////////////////////////messaging to peers
var broadcastPeers = function(message){
  for (let id in peers) {
    peers[id].conn.write(message)
  }
}
//////////////////////////////////////////////////////////end messaging to peers

///////////////////////////////////////////////////////query 2 will go away soon
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
/////////////////////////////////////////////////////////////////////end query 2

//////////////////////////////////////////////////main console interface query 1
function queryr1(){
  //command line stuff
  rl.question('console action: ', (answer) => {
    // TODO: Log the answer in a database
    console.log(`selected: ${answer}`);
    if(answer == "M"){//M is for mine and triggers the miner
      console.log("[placeholder] this would be mining stats");
      console.log("Mined BLock Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
      franks.calculateDigest("first try",10);
      //this is the most sensible place to add the block
      //this would seem to be a function that should be called from miner after meinePendingTx is called but it is better called here
      var minedblock = {"blockchain":{
        id:null,
        blocknum:parseInt(frankieCoin.getLength()),
        previousHash:frankieCoin.getLatestBlock()["previousHash"],
        timestamp:frankieCoin.getLatestBlock()["timestamp"],
        transactions:frankieCoin.getLatestBlock()["transactions"],
        orders:frankieCoin.getLatestBlock()["orders"],
        hash:frankieCoin.getLatestBlock()["hash"],
        nonce:frankieCoin.getLatestBlock()["nonce"],
        eGEMBackReferenceBlock:frankieCoin.getLatestBlock()["eGEMBackReferenceBlock"],
        egemBackReferenceBlockHash:frankieCoin.getLatestBlock()["egemBackReferenceBlockHash"],
        data:frankieCoin.getLatestBlock()["data"],
        sponsor:frankieCoin.getLatestBlock()["sponsor"],
        miner:frankieCoin.getLatestBlock()["miner"],
        hardwareTx:frankieCoin.getLatestBlock()["hardwareTx"],
        softwareTx:frankieCoin.getLatestBlock()["softwareTx"],
        targetBlock:frankieCoin.getLatestBlock()["targetBlock"],
        targetBlockDataHash:frankieCoin.getLatestBlock()["targetBlockDataHash"],
        allConfig:frankieCoin.getLatestBlock()["allConfig"],
        allConfigHash:frankieCoin.getLatestBlock()["allConfigHash"],
        hashOfThisBlock:frankieCoin.getLatestBlock()["hashOfThisBlock"]
      }};
      console.log(minedblock);
      BlockchainDB.addBlock(minedblock);
      //sending the block to the peers
      broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));
      queryr1();
    }else if(answer == "O"){//O is for order
      //other commands can go Here
      console.log("Order is processing from the database not chain");
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      BlockchainDB.getOrdersPairBuy("EGEM",myCallbackBuy);
      //just a reminder I have other order functions coded
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      queryr1();
    }else if(answer == "B"){//B is for balance
      console.log("maybe can do logic for BALANCE of ADDRESS at the console line but for now...");
      queryr2("getBalance");
      //console.log("chain is now: "+JSON.stringify(frankieCoin));
      //console.log("balance is: "+frankieCoin.getBalanceOfAddress("0x0666bf13ab1902de7dee4f8193c819118d7e21a6")+" <---why no money");
      //console.log("balance is: "+franks.getBalanceOfAddress("0x0666bf13ab1902de7dee4f8193c819118d7e21a6")+" <---why no money");
      //queryr1();
    }else if(answer == "T"){//T is for talk but using it to initiate chain sync
      //console.log("had to not just broadcast everything I write to all peers so only sender sees this");
      //broadcastPeers("...but all peers see that this was sent from "+myId);

      //sneaking this chain synch in here...that is a "talk"
      for (let id in peers) {
        //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
        peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
      }
      queryr1();
    }else if(answer == "N"){//N is for Node info
      Genesis.fileHash();
      console.log("NODEZZZZZZ LULZ: ");//had to BCASH LOL
      console.log(JSON.stringify(frankieCoin.retrieveNodes()));
      queryr1();
    }else if(answer == "G"){//G currently is for getBlock which is also a function
      console.log("BLOCK NUMBER: 1");
      queryr2("getBlock");
    }else if(answer == "S"){//S is currently cleaning the databases was "Send" so leaving commented out transactions and orders for testing
      console.log("Western Union is no longer the fastest way to send money.....");
      //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 20, "SPHR"));
      //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 10, "EGEM"));
      //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 5, "XSH"));
      //frankieCoin.createOrder(new sapphirechain.Order('0x0666bf13ab1902de7dee4f8193c819118d7e21a6','BUY','SPHREGEM',3500,0.25));
      //frankieCoin.createOrder(new sapphirechain.Order('0x5c4ae12c853012d355b5ee36a6cb8285708760e6','SELL','SPHREGEM',200,0.24));
      //BlockchainDB.getBlockchain();
      BlockchainDB.clearDatabase();
      BlockchainDB.clearOrderDatabase();
      queryr1();
    }else if(answer.includes("Send(")){//SEND function Send ( json tx )
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
    }else if(answer.includes("getBlock(")){//GETBLOCK function
      console.log(answer.slice(answer.indexOf("getBlock(")+9, answer.indexOf(")")));
      var blocknum = answer.slice(answer.indexOf("getBlock(")+9, answer.indexOf(")"));
      console.log(JSON.stringify(frankieCoin.getBlock(parseInt(blocknum))));
      BlockchainDB.getBlock(blocknum,callback2);//change name from callback 2 to something meaningful
      queryr1();
    }else if(answer.includes("Order(")){//ORDER function merging with below \/ \/
      console.log(answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")")));
      var jsonSend = answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")"));
      var maker = JSON.parse(jsonSend)["maker"];
      var action = JSON.parse(jsonSend)["action"];
      var amount = JSON.parse(jsonSend)["amount"];
      var price = JSON.parse(jsonSend)["price"];
      var pairBuy = JSON.parse(jsonSend)["pairBuy"];
      var pairSell = JSON.parse(jsonSend)["pairSell"];
      console.log("Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);
      frankieCoin.createOrder(new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price));
      queryr1();
    }else if(isJSON(answer)){//ORDER JSON style strait to order DB ^^ merging with above
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(answer)["fromAddress"])){//adding function capabilioties
        console.log("Valid EGEM Sapphire Address")
        //create the order
        var myorder = {'order':{id:null,"fromAddress":JSON.parse(answer)["fromAddress"],buyOrSell:JSON.parse(answer)["buyOrSell"],pairBuy:JSON.parse(answer)["pairBuy"],pairSell:JSON.parse(answer)["pairSell"],amount:JSON.parse(answer)["amount"],price:JSON.parse(answer)["price"]}};
        //var myorder = {order:JSON.parse(answer)};
        console.log("order is "+myorder)

        //putting it on the chain first
        var maker = JSON.parse(answer)["maker"];
        var action = JSON.parse(answer)["action"];
        var amount = JSON.parse(answer)["amount"];
        var price = JSON.parse(answer)["price"];
        var pairBuy = JSON.parse(answer)["pairBuy"];
        var pairSell = JSON.parse(answer)["pairSell"];
        console.log("Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);
        frankieCoin.createOrder(new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price));
        //end putting it on the chain

        BlockchainDB.addOrder(myorder);

        queryr1();
      }
    }else{
      console.log("[placeholder] that selection is not valid atm");
      queryr1();
    }
    //rl.close();
  });
}
///////////////////////////////////////////ending main console interface query 1

////////////////////////////////////////////////////////////miner initialization
///////////////need to add back in the conmmand line args and make like claymore
var miner = function(frankieCoin){
  var franks = new Miner.Miner("first try", 32, "tryanewkey", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "0x5c4ae12c853012d355b5ee36a6cb8285708760e6",frankieCoin)
  return franks;
}
///////////////////////////////////////////////////////////////////////end miner

///////////////////////////////////////////////////////////////////my blockchain
var blockchain = function(){
  var frankieCoin = new sapphirechain.Blockchain();
  return frankieCoin;
}

var frankieCoin = blockchain();
///////////////////////////////////////////////////////////////////my blockchain

//have to load the first block into local database
var genBlock = {"blockchain":{
  id:null,
  blocknum:parseInt(frankieCoin.getLength()),
  previousHash:frankieCoin.getLatestBlock()["previousHash"],
  timestamp:frankieCoin.getLatestBlock()["timestamp"],
  transactions:frankieCoin.getLatestBlock()["transactions"],
  orders:frankieCoin.getLatestBlock()["orders"],
  hash:frankieCoin.getLatestBlock()["hash"],
  nonce:frankieCoin.getLatestBlock()["nonce"],
  eGEMBackReferenceBlock:frankieCoin.getLatestBlock()["eGEMBackReferenceBlock"],
  egemBackReferenceBlockHash:frankieCoin.getLatestBlock()["egemBackReferenceBlockHash"],
  data:frankieCoin.getLatestBlock()["data"],
  sponsor:frankieCoin.getLatestBlock()["sponsor"],
  miner:frankieCoin.getLatestBlock()["miner"],
  hardwareTx:frankieCoin.getLatestBlock()["hardwareTx"],
  softwareTx:frankieCoin.getLatestBlock()["softwareTx"],
  targetBlock:frankieCoin.getLatestBlock()["targetBlock"],
  targetBlockDataHash:frankieCoin.getLatestBlock()["targetBlockDataHash"],
  allConfig:frankieCoin.getLatestBlock()["allConfig"],
  allConfigHash:frankieCoin.getLatestBlock()["allConfigHash"],
  hashOfThisBlock:frankieCoin.getLatestBlock()["hashOfThisBlock"]
}};
BlockchainDB.addBlock(genBlock);
console.log("peer chain is"+ frankieCoin.getEntireChain());
var franks = miner(frankieCoin);

/////////////////////////////////////////////////////////////////synch the chain
console.log("|-------------CHAIN SYNC---------------|")
//internal data blockheiht
var blockHeightPtr = 0;
function callback2(data){
  JSON.stringify(data);
}
//the idea is to sync the chain data before progression so we start with a callback of data store limited by number of blocks
var myCallback = function(data) {
  //console.log('got data: '+JSON.stringify(data));//test for input
  for (obj in data){
    //console.log("HERE IS THE BLOCK FROM DB IN CHAIN SYNCH "+JSON.stringify(data[obj]["blocknum"]));
    //console.log("AND FROM MEMORY "+JSON.stringify(frankieCoin.getBlock(data[obj]["blocknum"])))
    //console.log("fc data for num "+frankieCoin.getBlock(data[obj]["blocknum"]));
    if(typeof frankieCoin.getBlock(data[obj]["blocknum"]) === "undefined" || frankieCoin.getBlock(data[obj]["blocknum"]) === null){
      //console.log("Block " + data[obj]["blocknum"] + " is not in memory ...will add it");
      //console.log("***************************this is the block***************************");
      //console.log(JSON.stringify(data[obj]));
      frankieCoin.addBlockFromDatabase(data[obj]);
    }else{
      //console.log("block exists in chain data: "+data[obj]["blocknum"]);
    }
    blockHeightPtr++;
  }

  console.log("BlocHeightPtr: "+blockHeightPtr);
  //this is where we call a function with the blockHeight pointer that finds out the peerBlockHeight and then download missing data
  for (let id in peers) {
    peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
  }

};
//a function call for datastore
function ChainGrab(blocknum){
  BlockchainDB.getBlockchain(99,myCallback);
  //maybe some other stuff like .then
};
//and finally the actual call to function for synch
ChainGrab();
//eand by now we will know if synched or not and enable or disable mining
console.log("|^------------CHAIN SYNC--------------^|")
/////////////////////////////////////////////////////////////END synch the chain

////////////////////////////////////////////////this is the functions for orders
var myTradeCallback = function(orig,data) {
  console.log('SELL TRADE ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("this would be the transaction: ");
    console.log("BUYER "+orig["fromAddress"]+" OF "+orig["pairBuy"]+" QTY "+orig["amount"]+" FOR "+orig["price"]+" OF "+orig["pairBuy"]+" PER "+orig["pairSell"]);
    console.log("SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);

    if(parseInt(orig["amount"]) <= parseInt(data[obj]["amount"])){
      console.log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseInt(orig["amount"])+ " OF "+orig["pairBuy"]);
      console.log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseInt(data[obj]["amount"]) - parseInt(orig["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
      //console.log("UNFILLED REPLACEMENT ORDER: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "++ " OF "+orig["pairBuy"]);
    }else if (orig["amount"] > parseInt(data[obj]["amount"])){
      console.log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseInt(data[obj]["amount"])+ " OF "+orig["pairBuy"]);
      console.log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseInt(orig["amount"]) - parseInt(data[obj]["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
    }

  }
};

var myCallbackBuy = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};

var myCallbackSell = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
////////////////////////////////////////////////////////end functions for orders

////////////////////////////////////////////////initialize the console interface
queryr1();
//////////////////////////////////////////////////////////command line interface

////////////////////////////////////////////////////////////////export functions
module.exports = {
  broadcastPeers:broadcastPeers,
  miner:miner,
  blockchain:blockchain
}
////////////////////////////////////////////////////////////////export functions

/******************************************************************************/
//
//  EGEM Sapphire Peer.js
//  Currently licensed under MIT
//  A copy of this license must be included in all copies
//  Copyright (c) 2018 Frank Triantos aka OSOESE
//
/******************************************************************************/
