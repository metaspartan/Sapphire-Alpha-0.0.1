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

//////////////////////////////////////////////////////////////////////rpc sercer
var rpcserver = require('./rpc_server.js');

/////////////////////////////////////////////////////////////////requests to rpc
var request = require('request');

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
//////pulls genesis.js file and sha256 hashes it into globalGenesisHash variable
var output = fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    tbh=data.replace(/(\r\n|\n|\r)/gm,"");//removes ALL line breaks
    if (Genesis.genesisGlobalHash == "This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM"){
      globalGenesisHash = sha256(tbh).toString();
      console.log("Global Genesis Hash: "+globalGenesisHash);
    }else{
      console.log("it did not validate")
    }
});
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
  sw.join('egem-sfrx') // can be any id/name/hash

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
////////////////////////////////////////////////////////////incomeing peer block
        if(JSON.parse(data)["previousHash"]){///////////////need more refinement
          //storing some variables of current chain
          var currentChainHash = frankieCoin.getLatestBlock()["hash"];
          var blocknumber = 0;
          //first we add the block to the blockchain
          var successfulBlockAdd = frankieCoin.addBlockFromPeers(JSON.parse(data));

          //verfiy the previous hash in the database matches our expectations - code is incomplete atm
          if(frankieCoin.getLatestBlock()["previousHash"] == currentChainHash && successfulBlockAdd == true){

            //increment the internal peer nonce of sending party to track longest chain
            frankieCoin.incrementPeerNonce(peerId,frankieCoin.getLength());
            //logging the block added to chain for console
            console.log("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock()));

            console.log("hash matches and we are good");
            blocknumber = frankieCoin.getLength();
            console.log("the database block number is "+blocknumber);
            console.log("88888888888888888888888888888888888888888888888888888888888888888888");
            console.log("THERE NEEDS TO BE ANOTHER SOMETHING SET HERE FOR THE DATASE SYNCHING");
            console.log("         BUT WE DID JUST GET A SUCESSFUL BLOCK FROM PEER            ");
            console.log("88888888888888888888888888888888888888888888888888888888888888888888");

            //////update the client database OR reject block and rollback the chain - code is incomplete atm
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
              hashOfThisBlock:JSON.parse(data)["hashOfThisBlock"],
              difficulty:JSON.parse(data)["difficulty"]
            }};
            //add it to the database
            BlockchainDB.addBlock(peerblock);

          }else{
            console.log("otherwise need to synch because block hash is "+frankieCoin.getLatestBlock()["previousHash"]+" compared to "+currentChainHash);
            //for now I am going to remove the next block down....until I scrape to a match
            //DEFINITELY need some logic here to verify peer synch height and chain
            console.log("which means we are REMOVING BLOCK");
            //remove the block from the chain and db

            var lastSynchBlock;
            for (let i in frankieCoin.chain.nodes){
              if(frankieCoin.chain.nodes[i]["id"] == peerId){
                lastSynchBlock = frankieCoin.chain.nodes[i]["info"]["chainlength"];
              }
            }

            if(parseInt(frankieCoin.getLength() - 1) != lastSynchBlock){
              console.log("TTTTTTTTTTTHHHHHHHHHHHIIIIIIIIIISSSSSSSSSSS IS A GOOD BLOCK REMOVAL");
            }else{
              console.log("TTTTTTTTTTTHHHHHHHHHHHIIIIIIIIIISSSSSSSSSSS IS WHERE THE SYNCH IS STUCK");
            }

            frankieCoin.incrementPeerNonce(peerId,parseInt(frankieCoin.getLength() - 1));
            frankieCoin.chain.pop();
            BlockchainDB.clearBlock(frankieCoin.getLength());

            //okay do we need a return?
          }

        }else if(JSON.parse(data)["fromAddress"]){

          console.log("well, this is an order and we need to give it a transaction id when mined");

        }else if(JSON.parse(data)["ChainSyncPing"]){

          console.log(JSON.parse(data)["ChainSyncPing"]);
          if(JSON.parse(data)["ChainSyncPing"]["GlobalHash"] == globalGenesisHash){
            console.log("global hashes matched");
            frankieCoin.incrementPeerMaxHeight(peerId,JSON.parse(data)["ChainSyncPing"]["MaxHeight"])
            var peerBlockHeight = JSON.parse(data)["ChainSyncPing"]["Height"];

              //increment it by one to return the next block
              peerBlockHeight++;
              //returning the block
              if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
                peers[peerId].conn.write(JSON.stringify(frankieCoin.getBlock(parseInt(peerBlockHeight))));
              }else if(frankieCoin.getLength() == parseInt(peerBlockHeight)){
                peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
              }else if(peerBlockHeight > frankieCoin.getLength()){
                //setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},3000);
                peerBlockHeight--;
              }
              /****
              }else if(peerBlockHeight > frankieCoin.getLength() && frankieCoin.inSynch == false){
                setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},3000);
                console.log("8888777766665555       THIS PEER IS NOT SYNCHED     5555666677778888");
              }
              ****/
            //setting a delay and pong back
            //setTimeout(function(){peers[peerId].conn.write("ChainSyncPong("+peerBlockHeight+")");},5000);
            setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPong":{Height:peerBlockHeight,MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},300);
            //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }else{
            console.log("Did not match this hash and this peer is an imposter");
            peers[peerId].write("Don't hack me bro");
            //peers[peerId].connection.close()//?;
          }

        }else if(JSON.parse(data)["ChainSyncPong"]){
          //returned block from sunched peer and parses it for db
          console.log(JSON.parse(data)["ChainSyncPong"]);
          if(JSON.parse(data)["ChainSyncPong"]["GlobalHash"] == globalGenesisHash){
            console.log("Hash Matched good pong")
            var peerBlockHeight = JSON.parse(data)["ChainSyncPong"]["Height"];
            ChainSynchHashCheck(peerBlockHeight,JSON.parse(data)["ChainSyncPong"]["MaxHeight"]);
            //if chain is not synched ping back to synched peer
            if(frankieCoin.inSynch==true && frankieCoin.inSynchBlockHeight == frankieCoin.longestPeerBlockHeight){
              peers[peerId].conn.write("YYYYYYYYYYEEEEEEEEEEEEEEAAAAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHH THIS PEER IS SYNCHED YYYYYYYYYYYYYEEEEEEEEEEEEEEEEAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHH");
            }else{
              setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},300);
            }

          }else{
            console.log("You are communicating with a bad actor and we must stop this connection");
            peers[peerId].write("Stop hacking me bro");
            //peers[peerId].connection.close()//?;
          }
        }

      }else{

        //will repoen the GENESIS HASH NEXT

        if(data.toString() == "My Genesis Hash is: "+globalGenesisHash){
          console.log("the hash matched you would record that now");
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

/////sampling some homemade ipc
var tryingAgain = function(){
  console.log("tried again and it worked")
}
/////end th homemade ipc


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
      if(frankieCoin.inSynch == true || (frankieCoin.getLength() < 100 && peers[0] == undefined)){
        console.log("need to pull orders matching pairbuy orders from database and add to pending orders");
        console.log('at least within a certain range...');
        console.log(JSON.stringify(frankieCoin.pendingOrders));

        for(odr in frankieCoin.pendingOrders){
          if(frankieCoin.pendingOrders[odr]["buyOrSell"] == "BUY"){
            console.log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            console.log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            console.log(frankieCoin.pendingOrders[odr]["price"]);
            console.log(frankieCoin.pendingOrders[odr]["amount"]);
            console.log("Any Sell Orders with pricing less tha or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity requested");
            BlockchainDB.getOrdersPairBuy(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackBuyMiner);
          }else if (frankieCoin.pendingOrders[odr]["buyOrSell"] == "SELL"){
            console.log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            console.log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            console.log(frankieCoin.pendingOrders[odr]["price"]);
            console.log(frankieCoin.pendingOrders[odr]["amount"]);
            console.log("Any BUY Orders with pricing greater than or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity offered");
            BlockchainDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackSellMiner);
          }
        }

        //console.log("pending transactions are"+frankieCoin.pendingTransactions);
        franks.mpt2();

        console.log("[placeholder] this would be mining stats");
        console.log("Mined BLock Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
        //franks.calculateDigest("first try",10);

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
          hashOfThisBlock:frankieCoin.getLatestBlock()["hashOfThisBlock"],
          difficulty:frankieCoin.getLatestBlock()["difficulty"]
        }};
        console.log(minedblock);
        BlockchainDB.addBlock(minedblock);
        //sending the block to the peers
        broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));

        //post to rpcserver
        //this is where we SUBMIT WORK leaving it to eeror right now
        var options = {
          uri: 'http://localhost:9090/rpc',
          method: 'POST',
          json: {createBlock:{block:frankieCoin.getLatestBlock()}}
        };

        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body.id) // Print the shortened url.
          }
        });
      }else{
        console.log("CHAIN IS NOT SYNCHED FOR MINING PLEASE WAIT"+frankieCoin.getLength()+peers[0]);
      }


      queryr1();
    }else if(answer == "MM"){
      //var silly = rpcserver.db.miners.fetchKey(key,value);
      //console.log("got it and its "+silly);
      impceventcaller("passing data","this my peer");
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
    }else if(answer == "OO"){//O is for order
      //other commands can go Here
      console.log("Order is processing from the database not chain");
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      BlockchainDB.getAllOrders();
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
      //sneaking this chain synch in here...that is a "talk"
      for (let id in peers) {
        console.log("sending the ping");
        //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
        peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
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
    }else if(answer == "SS"){
      BlockchainDB.getBlockchain();
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
    }else if(answer.includes("Hash(")){//SEND function Send ( json tx )
      console.log(answer.slice(answer.indexOf("Hash(")+5, answer.indexOf(")")));
      var hashText = answer.slice(answer.indexOf("Hash(")+5, answer.indexOf(")"));

      console.log(hashText);
      sapphirechain.Hash(hashText);
      queryr1();
      //queryr2("getBlock");
    }else if(answer.includes("getBlock(")){//GETBLOCK function
      console.log(answer.slice(answer.indexOf("getBlock(")+9, answer.indexOf(")")));
      var blocknum = answer.slice(answer.indexOf("getBlock(")+9, answer.indexOf(")"));
      console.log(JSON.stringify(frankieCoin.getBlock(parseInt(blocknum))));
      BlockchainDB.getBlock(blocknum,callback2);//change name from callback 2 to something meaningful
      queryr1();
    }else if(answer.includes("Order(")){//ORDER function merging with below \/ \/
      ////frankieCoin.createOrder(new sapphirechain.Order('0x0666bf13ab1902de7dee4f8193c819118d7e21a6','BUY','SPHREGEM',3500,0.25));
      ////Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pair":"SPHREGEM","price":1.38,"ticker":"EGEM"});
      console.log(answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")")));
      //extract the JSON
      var jsonSend = answer.slice(answer.indexOf("Order(")+6, answer.indexOf(")"));
      //set upi order for database add
      var myorder = {
        "order":
        {
          id:null,
          "fromAddress":JSON.parse(jsonSend)["maker"],
          "buyOrSell":JSON.parse(jsonSend)["action"],
          "pairBuy":JSON.parse(jsonSend)["pairBuy"],
          "pairSell":JSON.parse(jsonSend)["pairSell"],
          "amount":JSON.parse(jsonSend)["amount"],
          "price":JSON.parse(jsonSend)["price"],
          //"state":JSON.parse(jsonSend)["state"],
          //"transactionID":JSON.parse(jsonSend)["transactionID"],
          //"originationID":JSON.parse(jsonSend)["originationID"],
          //"timestamp":JSON.parse(jsonSend)["timestamp"]
        }};
      //create the order
      var maker = JSON.parse(jsonSend)["maker"];
      var action = JSON.parse(jsonSend)["buyOrSell"];
      var amount = JSON.parse(jsonSend)["amount"];
      var price = JSON.parse(jsonSend)["price"];
      var pairBuy = JSON.parse(jsonSend)["pairBuy"];
      var pairSell = JSON.parse(jsonSend)["pairSell"];
      console.log("1st Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);
      myblockorder = new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price);
      frankieCoin.createOrder(myblockorder);
      BlockchainDB.addOrder({order:myblockorder});
      queryr1();
    }else if(isJSON(answer)){//ORDER JSON style strait to order DB ^^ merging with above
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(answer)["fromAddress"])){//adding function capabilioties
        //Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pairBuy":"EGEM","price":1.38,"pairSell":"SPHR"});
        console.log("Valid EGEM Sapphire Address")
        //create the order
        var myorder = {
          "order":
          {"id":null,
          "fromAddress":JSON.parse(answer)["fromAddress"],
          "buyOrSell":JSON.parse(answer)["buyOrSell"],
          "pairBuy":JSON.parse(answer)["pairBuy"],
          "pairSell":JSON.parse(answer)["pairSell"],
          "amount":JSON.parse(answer)["amount"],
          "price":JSON.parse(answer)["price"],
          //"state":JSON.parse(answer)["state"],
          //"transactionID":JSON.parse(answer)["transactionID"],
          //"originationID":JSON.parse(answer)["originationID"],
          //"timestamp":JSON.parse(answer)["timestamp"]
        }};
        //var myorder = {order:JSON.parse(answer)};
        console.log("order is "+myorder)

        //putting it on the chain first
        var maker = JSON.parse(answer)["fromAddress"];
        var action = JSON.parse(answer)["buyOrSell"];
        var amount = JSON.parse(answer)["amount"];
        var price = JSON.parse(answer)["price"];
        var pairBuy = JSON.parse(answer)["pairBuy"];
        var pairSell = JSON.parse(answer)["pairSell"];
        console.log("2nd Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);

        myblockorder = new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price);
        frankieCoin.createOrder(myblockorder);
        BlockchainDB.addOrder({order:myblockorder});
        //{"order":{"id":null,"fromAddress":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","buyOrSell":"SELL","pairBuy":"EGEM","pairSell":"SPHR","amount":"300","price":"26.00"}}

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
  hashOfThisBlock:frankieCoin.getLatestBlock()["hashOfThisBlock"],
  difficulty:4
}};
BlockchainDB.addBlock(genBlock);
//console.log("peer chain is"+ frankieCoin.getEntireChain());
var franks = miner(frankieCoin);

/////////////////////////////////////////////////////////////////synch the chain
console.log("|-------------CHAIN SYNC---------------|")
//internal data blockheiht
var blockHeightPtr = 0;
function callback2(data){
  JSON.stringify(data);
}

var ChainSynchHashCheck = function(peerLength,peerMaxHeight){

  console.log("777777777777777777777777777777777777777777777     NEED TO FLAG CHAIN SYNC      7777777777777777777777777777777777777777")
  var nodesInChain = frankieCoin.retrieveNodes();
  var longestPeer = 0;
  for(node in nodesInChain){
    if(parseInt(nodesInChain[node]["info"]["chainlength"]) > longestPeer){
      longestPeer = parseInt(nodesInChain[node]["info"]["chainlength"]);
      frankieCoin.longestPeerBlockHeight = longestPeer;
    }
  }
  console.log("66666666666666666666666666666666666666666666       HERE IS DATA       666666666666666666666666666666666");
  console.log(longestPeer+" <<lp   mh>>"+peerMaxHeight+"<<mh    pl>> "+peerLength)
  frankieCoin.incrementPeerNonce(nodesInChain[node]["id"],peerLength);
  console.log(JSON.stringify(nodesInChain));
  //the pong us set to be one higher from the ping and is above the chain length
  if(longestPeer <= peerMaxHeight){
    console.log("are you synched UP? "+frankieCoin.isChainSynch(longestPeer).toString())
  }else{
    console.log("are you synched UP? "+frankieCoin.isChainSynch(peerMaxHeight).toString())
  }
  console.log("3333333333    "+longestPeer+""+peerMaxHeight+""+frankieCoin.getLength()+"    333333333");
  if(longestPeer == peerMaxHeight && peerMaxHeight == frankieCoin.getLength()){
    console.log("33333333333333333333333333333333333333333       MOST COMPLETE SYNCH      33333333333333333333333333333333333");
    frankieCoin.inSynch = frankieCoin.isChainSynch(peerMaxHeight);
    frankieCoin.inSynchBlockHeight = peerMaxHeight;
  }

  //this.chain.inSynch = frankieCoin.isChainSynch()
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
    //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
    peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
  }

  //finally we se the RPC block which is updated by peer synch processes
  //this is where we SUBMIT WORK leaving it to eeror right now
  console.log("00000000000000 CALLING THE SUBMIT BLOCK 00000000000000");
  var options = {
    uri: 'http://localhost:9090/rpc',
    method: 'POST',
    json: {createBlock:{block:frankieCoin.getLatestBlock()}}
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body.id) // Print the shortened url.
    }
  });

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
  console.log('SELL TRADE ORDERS: '+JSON.stringify(orig));//test for input
  for (obj in data){
    console.log("this would be the transaction: ");
    console.log("BUYER "+orig["fromAddress"]+" OF "+orig["pairBuy"]+" QTY "+orig["amount"]+" FOR "+orig["price"]+" OF "+orig["pairBuy"]+" PER "+orig["pairSell"]+" txID "+orig["transactionID"]+" ORIGTX "+orig["originationID"]);
    console.log("SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]+" txID "+data[obj]["transactionID"]+" ORIGTX "+data[obj]["originationID"]);

    if(parseInt(orig["amount"]) <= parseInt(data[obj]["amount"])){
      ///////////////////////////////////if the buy amount is less than the sell
      console.log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(orig["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(data[obj]["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      console.log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseFloat(data[obj]["amount"]) - parseFloat(orig["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
      //console.log("UNFILLED REPLACEMENT ORDER: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "++ " OF "+orig["pairBuy"]);
      var newOrderAmpount = parseFloat(parseFloat(data[obj]["amount"]) - parseFloat(orig["amount"]));
      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
      //and a new one gets open
      var replacementOrder = new sapphirechain.Order(
        data[obj]["fromAddress"],
        'SELL',
        data[obj]["pairBuy"],
        data[obj]["pairSell"],
        newOrderAmpount,
        data[obj]["price"],
        '',
        ''
      );
      frankieCoin.createOrder(replacementOrder,data[obj]["originationID"]);
      BlockchainDB.addOrder({order:replacementOrder});
    }else if (orig["amount"] > parseInt(data[obj]["amount"])){
      console.log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(data[obj]["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(data[obj]["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      console.log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseFloat(orig["amount"]) - parseFloat(data[obj]["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
      var newOrderAmpount = parseFloat(parseFloat(orig["amount"])-parseFloat(data[obj]["amount"]));
      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
      var replacementOrder = new sapphirechain.Order(
        orig["fromAddress"],
        'BUY',
        orig["pairBuy"],
        orig["pairSell"],
        newOrderAmpount,
        orig[ordersofbuy]["price"],
        '',
        ''
      );
      this.createOrder(replacementOrder,orig["originationID"]);
      BlockchainDB.addOrder({order:replacementOrder});
    }

  }
};

//processingTrades
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuyOrders = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSellOrders = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};

//////////////////////////////////////////////////////////////////////////////2nd call
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuyMiner = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    //frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', data[obj]["fromAddress"], 20, "SPHR"));
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlockchainDB.clearOrderById(data[obj]["id"]);
    //since the order needs to be on the blockchain here we really need to just delete it but the order processing below is not necessary
    //however I am keeping it here in comments in case I want to move this function to the block
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
//////////////////////////////////////////////////////////////////////////////2nd call
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSellMiner = function(data) {
  console.log('SELL[BUY] ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("SELLER[BUYER] "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlockchainDB.clearOrderById(data[obj]["id"]);
    //since the order needs to be on the blockchain here we really need to just delete it but the order processing below is not necessary
    //however I am keeping it here in comments in case I want to move this function to the block
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};

//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuy = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]+" timestamp "+data[obj]["timestamp"]+" transactionID "+data[obj]["transactionID"]);
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSell = function(data) {
  console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    console.log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]+" timestamp "+data[obj]["timestamp"]+" transactionID "+data[obj]["transactionID"]);
    BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
////////////////////////////////////////////////////////end functions for orders

//////////////////////////////////////////inter module parent child communicator
//parent communicator callback function sent to child below
var impcchild = function(childData){
  console.log("incoming data from child"+childData);
  if(isJSON(childData) && JSON.parse(childData)["createBlock"]){
    console.log("current prev hash is "+frankieCoin.getLatestBlock().hash+" incoming block previous hash is: "+JSON.parse(childData)["createBlock"]["block"]["previousHash"]);

    if(frankieCoin.getLatestBlock().hash == JSON.parse(childData)["createBlock"]["block"]["previousHash"]){
      franks.mpt3(JSON.parse(childData)["address"],JSON.parse(childData)["createBlock"]["block"]);
      ////////here is the database update and peers broadcast
      console.log("[placeholder] mining stats from outside miner");
      console.log("Outside Miner Mined BLock Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
      //franks.calculateDigest("first try",10);

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
        hashOfThisBlock:frankieCoin.getLatestBlock()["hashOfThisBlock"],
        difficulty:frankieCoin.getLatestBlock()["difficulty"]
      }};
      console.log(minedblock);
      BlockchainDB.addBlock(minedblock);
      //sending the block to the peers
      broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));
      ////////end database update and peers broadcast
      //post to rpcserver
      //this is where we SUBMIT WORK leaving it to eeror right now
      var options = {
        uri: 'http://localhost:9090/rpc',
        method: 'POST',
        json: {createBlock:{block:frankieCoin.getLatestBlock()}}
      };

      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body.id) // Print the shortened url.
        }
      });
    }

  }else if(isJSON(childData) && JSON.parse(childData)["getWorkForMiner"]){
    console.log(JSON.parse(childData)["getWorkForMiner"])
  }else if(isJSON(childData) && JSON.parse(childData)["getOrderBook"]){
    console.log("now we are gonna have some fun")
    impceventcaller("returning from function","maybe the calling peer is not necessary");
  }else if(isJSON(childData) && JSON.parse(childData)["getBalance"]){
    console.log("retrieving a balance for address provided...");
    console.log(JSON.parse(childData)["getBalance"]);
    console.log(JSON.parse(childData)["getBalance"]["address"]);
    var getBalance3 = frankieCoin.getBalanceOfAddress(JSON.parse(childData)["getBalance"]["address"]);
    console.log('\nMiners Function Balance of '+JSON.parse(childData)["getBalance"]["address"]+' is', getBalance3);
    console.log(getBalance3["SPHR"]);

    var getBalance4 = [];
    //var Keys = Object.keys(getBalance3);
    for(account in getBalance3){
      //var tempkey = Keys[account];
      var tempbalance = {[account]:getBalance3[account]}
      getBalance4.push(tempbalance);
    }
    //this is where I would return that data
    var options = {
      uri: 'http://localhost:9090/rpc',
      method: 'POST',
      json: {balance:{address:JSON.parse(childData)["getBalance"]["address"],balance:{getBalance4}}}
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body.id) // Print the shortened url.
      }
    });
  }else{
    console.log("RCP commands were not properly formatted");
  }
}

var impcMethods = function(datacall){
  return new Promise((resolve)=> {
    console.log("calling in peer");
    console.log(JSON.stringify(datacall));
    var dataBuySell = [];
    var myCallbackOrderBuy = function(data) {
      console.log('BUY ORDERS: '+JSON.stringify(data));//test for input
      //resolve(data);
      dataBuySell.push({"buy":data});
      BlockchainDB.getOrdersPairSell(datacall["tickerBuy"],myCallbackOrderSell);
    };
    var myCallbackOrderSell = function(data) {
      console.log('SELL ORDERS: '+JSON.stringify(data));//test for input
      dataBuySell.push({"sell":data});
      resolve(dataBuySell);
    };
    BlockchainDB.getOrdersPairBuy(datacall["tickerBuy"],myCallbackOrderBuy);
  })
}

var impceventcaller;
var impcevent = function(callback){
    //sets the impcparent with the function from parent
    impceventcaller = callback;
}
//initialize the child with the parent communcator call back function
rpcserver.globalParentCom(impcchild);
rpcserver.globalParentEvent(impcevent);
rpcserver.globalParentComMethods(impcMethods);
//////////////////////////////////////end inter module parent child communicator

////////////////////////////////////////////////initialize the console interface
queryr1();
//////////////////////////////////////////////////////////command line interface

////////////////////////////////////////////////////////////////export functions
module.exports = {
  broadcastPeers:broadcastPeers,
  miner:miner,
  blockchain:blockchain,
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
