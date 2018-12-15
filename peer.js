/******************************************************************************/
//
//  EGEM Sapphire Peer.js
//  Currently licensed under MIT
//  A copy of this license must be included in all copies
//  Copyright (c) 2018 Frank Triantos aka OSOESE
//
/******************************************************************************/
var swarm = require('discovery-swarm');
const crypto = require('crypto');
const defaults = require('dat-swarm-defaults');
const readline = require('readline');
const getPort = require('get-port');
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));

//genesis hash variables
var Genesis = require('./genesis');
const fs = require('fs');
const sha256 = require('crypto-js/sha256');

//adding color to console
const chalk = require('chalk');
const log = console.log;

////////////////////////////////////calls the nano-sql data interface to leveldb
var BlockchainDB = require('./nano2.js');
var BlkDB = require('./level.js');

//////////////////////////////////////////////////////////////////////rpc sercer
var rpcserver = require('./rpc_server.js');

/////////////////////////////////////////////////////////////////requests to rpc
var request = require('request');

///////////////////////Mining stuff : blockchain algo and mining initializations
var sapphirechain = require("./block.js");
sapphirechain.setBlockchainDB(BlockchainDB,BlkDB);
var BLAKE2s = require("./blake2s.js");
var Miner = require("./miner.js");
Miner.setSapphireChain(sapphirechain);

var msg = "genesis message";
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
      log(chalk.blue("Global Genesis Hash: "+ chalk.green(globalGenesisHash)));
    }else{
      log(chalk.red("It did not validate"));
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

/////////////////////////////simple function to test JSON input and avoid errors
function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
/////////////////////////end simple function to test JSON input and avoid errors

/////////////////////////////////////////////////////////callback for address balances
var addyBal = function(val){
  console.log("this address balance is "+val);
}
/////////////////////////////////////////////////////end callback for address balances

//////////////////////////////////////////////////////core function asynchronous
;(async () => {
  const port = await getPort()

  sw.listen(port)
  sw.join('egem-sfrx') // can be any id/name/hash

  sw.on('connection', (conn, info) => {

    log(chalk.blue(JSON.stringify(info)));
    const seq = connSeq
    const peerId = info.id.toString('hex');

    if(info.id != myId){
      frankieCoin.registerNode(peerId,info.host,info.port,frankieCoin.length);
      log(chalk.green("Incoming Peer Info: "+ chalk.red(JSON.stringify(info))));
      log(chalk.green('Found & connected to peer with id: '+ chalk.blue(peerId)));
    }

    conn.on('close', () => {
      // Here we handle peer disconnection
      log(chalk.blue("Connection"+ chalk.green(seq) + "closed, peer id: " + chalk.green(peerId)))
      // If the closing connection is the last connection with the peer, removes the peer
      if (peers[peerId].seq === seq) {
        delete peers[peerId]
      }
      //connSeq--
    })

    conn.on('data', data => {
      // Here we handle incomming messages
      log(
        'Received Message from peer ' + peerId,
        '----> ' + data.toString()
      )

      var sendBack = function(msg,peerId){
        peers[peerId].conn.write(JSON.stringify(msg));
      }

////////////////////////////////////////////begin the if block for incoming data
      if(isJSON(data.toString())){
////////////////////////////////////////////////////////////incomeing peer block
        if(JSON.parse(data)["previousHash"]){///////////////need more refinement
          //storing some variables of current chain
          var currentChainHash = frankieCoin.getLatestBlock()["hash"];
          var blocknumber = 0;
          //first we add the block to the blockchain with call back and id of submitting peer for conflict resolution
          var successfulBlockAdd = frankieCoin.addBlockFromPeers(JSON.parse(data),sendBack,peerId);

          log(chalk.bgGreen("SUCCEFSSFUL BLOCK ADD?"+successfulBlockAdd));

          //verfiy the previous hash in the database matches our expectations - code is incomplete atm
          if(frankieCoin.getLatestBlock()["previousHash"] == currentChainHash && successfulBlockAdd == true){

            //increment the internal peer nonce of sending party to track longest chain
            frankieCoin.incrementPeerNonce(peerId,frankieCoin.getLength());
            //logging the block added to chain for console
            log(chalk.green("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock())));

            log(chalk.green("hash matches and we are good"));
            blocknumber = frankieCoin.getLength();
            log(chalk.red("the database block number is "+blocknumber));
            log(chalk.red("--------------------------------------------------------------------"));
            log(chalk.yellow("THERE NEEDS TO BE ANOTHER SOMETHING SET HERE FOR THE DATASE SYNCHING"));
            log(chalk.yellow("         BUT WE DID JUST GET A SUCESSFUL BLOCK FROM PEER            "));
            log(chalk.red("--------------------------------------------------------------------"));

            //////update the client database OR reject block and rollback the chain - code is incomplete atm
            var peerblock = {"blockchain":{
              id:null,
              blocknum:parseInt(frankieCoin.getLength()),
              previousHash:frankieCoin.getLatestBlock()["previousHash"],
              timestamp:frankieCoin.getLatestBlock()["timestamp"],
              transactions:frankieCoin.getLatestBlock()["transactions"],
              orders:frankieCoin.getLatestBlock()["orders"],
              ommers:frankieCoin.getLatestBlock()["ommers"],
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
            //add it to the database
            //BlockchainDB.addBlock(peerblock);
            BlkDB.addBlock(frankieCoin.blockHeight,JSON.stringify(frankieCoin.getLatestBlock()));
            //BlockchainDB.addTransactions(JSON.stringify(JSON.parse(data)["transactions"]),JSON.parse(data)["hash"]);
            BlkDB.addTransactions(JSON.stringify(JSON.parse(data)["transactions"]),JSON.parse(data)["hash"]);
            //add it to the RPC for miner
            var options = {
              uri: 'http://localhost:9090/rpc',
              method: 'POST',
              json: {createBlock:{block:frankieCoin.getLatestBlock()}}
            };

            request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                log(body.id) // Print the shortened url.
              }
            });

          }else{
            log("otherwise need to synch because block hash is "+frankieCoin.getLatestBlock()["previousHash"]+" compared to "+currentChainHash);
            //for now I am going to remove the next block down....until I scrape to a match
            //DEFINITELY need some logic here to verify peer synch height and chain
            log("which means we are REMOVING BLOCK");
            //remove the block from the chain and db

            var lastSynchBlock;
            for (let i in frankieCoin.chain.nodes){
              if(frankieCoin.chain.nodes[i]["id"] == peerId){
                lastSynchBlock = frankieCoin.chain.nodes[i]["info"]["chainlength"];
              }
            }

            if(parseInt(frankieCoin.getLength() - 1) != lastSynchBlock){
              log(chalk.red("V-----------------------------------------------------------------V"));
              log(chalk.red("                CONFLICT AND BLOCK REMOVAL                         "));
            }else{
              log("TTTTTTTTTTTHHHHHHHHHHHIIIIIIIIIISSSSSSSSSSS IS WHERE THE SYNCH IS STUCK");
            }

            frankieCoin.incrementPeerNonce(peerId,parseInt(frankieCoin.getLength() - 1));
            frankieCoin.chain.pop();

            //going test getting into synch with these parameters
            frankieCoin.inSynch=false;
            ///could just send this to one peeer but
            //setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},300);
            for (let id in peers) {
              log(chalk.yellow("          Sending ping for chain sync to all peers              "));
              log(chalk.red("^-----------------------------------------------------------------^"));
              //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
              peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
            }
            //we would never get the block to this point
            //BlockchainDB.clearBlock(frankieCoin.getLength());
            //okay do we need a return?
          }

        }else if(JSON.parse(data)["fromAddress"]){

          log("well, this is an order and we need to give it a transaction id when mined");

        }else if(JSON.parse(data)["uncle"]){

          log(chalk.bgBlue("THIS IS THE UNCLRE RETURN WE LOG THE OMMER AND DELETE"));
          log(data["uncle"]);

        }else if(JSON.parse(data)["ChainSyncPing"]){

          log(JSON.parse(data)["ChainSyncPing"]);
          if(JSON.parse(data)["ChainSyncPing"]["GlobalHash"] == globalGenesisHash){
            log(chalk.green("Global hashes matched!"));
            frankieCoin.incrementPeerMaxHeight(peerId,JSON.parse(data)["ChainSyncPing"]["MaxHeight"])
            var peerBlockHeight = JSON.parse(data)["ChainSyncPing"]["Height"];
            var pongBack = false;

              //increment it by one to return the next block
              peerBlockHeight++;
              //returning the block
              if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
                //peers[peerId].conn.write(JSON.stringify(frankieCoin.getBlock(parseInt(peerBlockHeight))));
                peers[peerId].conn.write(JSON.stringify(BlkDB.getBlockAtHeight(parseInt(peerBlockHeight))));
                pongBack = true;
              }else if(frankieCoin.getLength() == parseInt(peerBlockHeight)){
                //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
                peers[peerId].conn.write(JSON.stringify(BlkDB.getLatestBlock()));
                pongBack = true;
              }else if((peerBlockHeight > frankieCoin.getLength()) && (peerBlockHeight == (frankieCoin.getLength()+1))){
                //setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},3000);
                peerBlockHeight--;
                pongBack = true;
              }else if(peerBlockHeight > (frankieCoin.getLength()+2)){

                pongBack = false;
                //setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},3000);
                log("8888777766665555       THIS PEER IS NOT SYNCHED     5555666677778888");
                log("8888777766665555       THIS PEER IS NOT SYNCHED     5555666677778888");
                log("8888777766665555       51           51              5555666677778888");
                log("8888777766665555                 51                 5555666677778888");
                log("8888777766665555              ??                    5555666677778888");
                log("8888777766665555            ??                      5555666677778888");
                log("8888777766665555                                    5555666677778888");
                log("8888777766665555           PEER                     5555666677778888");
                log("8888777766665555           PEER                     5555666677778888");
              }

            //setting a delay and pong back
            //setTimeout(function(){peers[peerId].conn.write("ChainSyncPong("+peerBlockHeight+")");},5000);
            if(peers[peerId] && pongBack == true){
              setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPong":{Height:peerBlockHeight,MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},300);
            }
            //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }else{
            log("Did not match this hash and this peer is an imposter");
            //peers[peerId].conn.write("Don't hack me bro");
            peers[peerId].conn.write(JSON.stringify({"BadPeer":{Height:1337}}));
          }

        }else if(JSON.parse(data)["BadPeer"]){
          log("------------------------------------------------------");
          log(chalk.red("You modified your code base please update and try again"));
          log("------------------------------------------------------");
          process.exit();
          exit();
        }else if(JSON.parse(data)["ChainSyncPong"]){
          //returned block from sunched peer and parses it for db
          log(JSON.parse(data)["ChainSyncPong"]);
          if(JSON.parse(data)["ChainSyncPong"]["GlobalHash"] == globalGenesisHash){
            log(chalk.green("Hash Matched good pong"))
            var peerBlockHeight = JSON.parse(data)["ChainSyncPong"]["Height"];
            ChainSynchHashCheck(peerBlockHeight,JSON.parse(data)["ChainSyncPong"]["MaxHeight"]);
            //if chain is not synched ping back to synched peer
            if(frankieCoin.inSynch==true && frankieCoin.inSynchBlockHeight == frankieCoin.longestPeerBlockHeight){
              peers[peerId].conn.write("---------------------------------");
              peers[peerId].conn.write("THIS PEER IS NOW SYNCHED");
              peers[peerId].conn.write("---------------------------------");
            }else{
              setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},300);
            }

          }else{
            log("------------------------------------------------------");
            log(chalk.red("You are communicating with a bad actor and we must stop this connection"));
            log("------------------------------------------------------");
            peers[peerId].write("Stop hacking me bro");
            //peers[peerId].connection.close()//?;
          }
        }

      }else{

        //will repoen the GENESIS HASH NEXT

        if(data.toString() == "My Genesis Hash is: "+globalGenesisHash){
          log("the hash matched you would record that now");
        }

        if(data.toString().includes("BlockHeight: ")){
          log("Blockheight is "+data.toString());
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

//////////////////////////////////////////////////main console interface query 1
function cliGetInput(){
  //command line stuff
  rl.question('Enter a command: ', (userInput) => {
    // TODO: Log the userInput in a database
    log(`selected: ${userInput}`);
    if(userInput == "M"){//M is for mine and triggers the miner
      if(frankieCoin.inSynch == true || (frankieCoin.getLength() < 100 && peers[0] == undefined)){
        log("need to pull orders matching pairbuy orders from database and add to pending orders");
        log('at least within a certain range...');
        log(JSON.stringify(frankieCoin.pendingOrders));

        for(odr in frankieCoin.pendingOrders){
          if(frankieCoin.pendingOrders[odr]["buyOrSell"] == "BUY"){
            log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            log(frankieCoin.pendingOrders[odr]["price"]);
            log(frankieCoin.pendingOrders[odr]["amount"]);
            log("Any Sell Orders with pricing less tha or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity requested");
            //BlockchainDB.getOrdersPairBuy(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackBuyMiner);
            BlkDB.getOrdersPairBuy(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackBuyMiner)
          }else if (frankieCoin.pendingOrders[odr]["buyOrSell"] == "SELL"){
            log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            log(frankieCoin.pendingOrders[odr]["price"]);
            log(frankieCoin.pendingOrders[odr]["amount"]);
            log("Any BUY Orders with pricing greater than or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity offered");
            //BlockchainDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackSellMiner);
            BlkDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackBuyMiner)
          }
        }

        //log("pending transactions are"+frankieCoin.pendingTransactions);
        franks.mpt2();

        log("[placeholder] this would be mining stats");
        log("Mined Block Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
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
          ommers:frankieCoin.getLatestBlock()["ommers"],
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
        log("here is the mined block: ")
        log(minedblock);
        /***
        var blockExists = function(block){
          console.log("does my block exist: "+block["blocknum"]);
        }
        BlockchainDB.getBlock(parseInt(frankieCoin.getLength()),blockExists);
        ***/
        //BlockchainDB.addBlock(minedblock);
        //BlockchainDB.addTransactions(frankieCoin.getLatestBlock()["transactions"],frankieCoin.getLatestBlock()["hash"]);
        BlkDB.addTransactions(frankieCoin.getLatestBlock()["transactions"],frankieCoin.getLatestBlock()["hash"]);
        BlkDB.addBlock(frankieCoin.blockHeight,JSON.stringify(frankieCoin.getLatestBlock()));
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
            log(body.id) // Print the shortened url.
          }
        });
      }else{
        log("------------------------------------------------------");
        log(chalk.green("CHAIN IS NOT SYNCHED FOR MINING PLEASE WAIT"+frankieCoin.getLength()+peers[0]));
        log("------------------------------------------------------");
      }
      cliGetInput();
    }else if(userInput == "MM"){
      //var silly = rpcserver.db.miners.fetchKey(key,value);
      //log("got it and its "+silly);
      impceventcaller("passing data","this my peer");
      cliGetInput();
    }else if(userInput == "MMM"){
      console.log("calling all the blocks level db");
      BlkDB.getAllBLocks();
      BlkDB.getTransactionReceiptsByAddress('0x2025ed239a8dec4de0034a252d5c5e385b73fcd0');
      BlkDB.getBalanceAtAddress('0x2025ed239a8dec4de0034a252d5c5e385b73fcd0',addyBal);
      var myOrdersBuyCBTest = function(data){
        console.log("returning leeldb buy orders");
        console.log(JSON.stringify(data));
      }
      BlkDB.getOrdersBuy(myOrdersBuyCBTest);
      BlkDB.getOrdersBuySorted(myOrdersBuyCBTest);
      cliGetInput();
    }else if(userInput == "O"){//O is for order
      //other commands can go Here
      log("Order is processing from the database not chain");
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      //BlockchainDB.getOrdersPairBuy("EGEM",myCallbackBuy);
      BlkDB.getOrdersPairBuy("EGEM",myCallbackBuy);
      //just a reminder I have other order functions coded
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      cliGetInput();
    }else if(userInput == "OO"){//O is for order
      //other commands can go Here
      log("Nothing is happening in this selection as its commented out");
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      //BlockchainDB.getAllOrders();
      //just a reminder I have other order functions coded
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      cliGetInput();
    }else if(userInput.startsWith("getBlock(")){//GETBLOCK function
      log(userInput.slice(userInput.indexOf("getBlock(")+9, userInput.indexOf(")")));
      var blocknum = userInput.slice(userInput.indexOf("getBlock(")+9, userInput.indexOf(")"));
      log(JSON.stringify(frankieCoin.getBlock(parseInt(blocknum))));
      //BlockchainDB.getBlock(blocknum,cbGetBlock);//change name from callback 2 to something meaningful
      BlkDB.getBlock(blocknum,cbGetBlock);
      cliGetInput();
    }else if(userInput == "getLength()"){
      var currentChainLenth = frankieCoin.getLength();
      log("Current Chain Length = "+currentChainLenth);
      cliGetInput();
    }else if(userInput.startsWith("getBalance(")){
      log("");
      log(userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")")));
      var egemAddress = userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")"));
      //franks.getBalanceOfAddress(userInput);
      //note I did not need to use the miner function for balances
      frankieCoin.getBalanceOfAddress(egemAddress);
      BlkDB.getBalanceAtAddress(egemAddress,addyBal)
      //BlockchainDB.getTransactionReceiptsByAddress(egemAddress);
      log("---------------");
      //BlockchainDB.getBalanceByAddress(userInput);
      //log('\nMiners Function Balance of '+userInput+' is', getBalance2);
      cliGetInput();
    }else if(userInput == "T"){//T is for talk but using it to initiate chain sync
      //sneaking this chain synch in here...that is a "talk"
      for (let id in peers) {
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync."));
        log("------------------------------------------------------");
        //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
        peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
      }
      cliGetInput();
    }else if(userInput == "N"){//N is for Node info
      Genesis.fileHash();
      log("------------------------------------------------------");
      log(chalk.green("List of Nodes: "));//had to BCASH LOL
      log("------------------------------------------------------");
      log(JSON.stringify(frankieCoin.retrieveNodes()));
      cliGetInput();
    }else if(userInput == "reindex"){
      log(chalk.yellow("|------------------------------|"));
      BlockchainDB.clearDatabase();
      BlkDB.clearDatabase();
      BlockchainDB.clearOrderDatabase();
      BlockchainDB.clearTransactionDatabase();
      log(chalk.red("| Database has been deleted.   |"));
      log(chalk.green("| Synchronizing with network...|"));
      log(chalk.yellow("|------------------------------|"));
      //process.exit();
      var reindexChain = function(peers){
        for (let id in peers) {
          log("------------------------------------------------------");
          log(chalk.green("Sending ping for chain sync."));
          log("------------------------------------------------------");
          //peers[id].conn.write("ChainSyncPing("+frankieCoin.getLength()+")");
          peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
        }
      }
      setTimeout(function(peers){reindexChain(peers);},200)
    }else if(userInput == "SS"){
      //BlockchainDB.getLatestBlock();
      console.log("----------------------------");
      //BlockchainDB.getBlockchain(99,callBackEntireDatabase);
      BlkDB.getBlockchain(99,callBackEntireDatabase);
      //BlockchainDB.getAllTransactionReceipts();
      cliGetInput();
    }else if(userInput.startsWith("Send(")){//SEND function Send ( json tx )
      log(userInput.slice(userInput.indexOf("Send(")+5, userInput.indexOf(")")));
      var jsonSend = userInput.slice(userInput.indexOf("Send(")+5, userInput.indexOf(")"));
      var from = JSON.parse(jsonSend)["from"];
      var to = JSON.parse(jsonSend)["to"];
      var amount = JSON.parse(jsonSend)["amount"];
      var ticker = JSON.parse(jsonSend)["ticker"];
      log("Sending "+amount+" "+ticker+" from "+from+" to "+to);
      frankieCoin.createTransaction(new sapphirechain.Transaction(from, to, amount, ticker));
      cliGetInput();
    }else if(userInput.startsWith("Hash(")){//HASH FUNCTION FOR VERIFICATIONS
      log(userInput.slice(userInput.indexOf("Hash(")+5, userInput.indexOf(")")));
      var hashText = userInput.slice(userInput.indexOf("Hash(")+5, userInput.indexOf(")"));

      log(hashText);
      sapphirechain.Hash(hashText);
      cliGetInput();
    }else if(userInput.startsWith("getOmmer(")){//GETBLOCK function
      log(userInput.slice(userInput.indexOf("getOmmer(")+9, userInput.indexOf(")")));
      var blocknum = userInput.slice(userInput.indexOf("getOmmer(")+9, userInput.indexOf(")"));
      log(JSON.stringify(frankieCoin.getOmmersAtBlock(parseInt(blocknum))));
      //BlockchainDB.getBlock(blocknum,cbGetBlock);//change name from callback 2 to something meaningful
      BlkDB.getBlock(blocknum,cbGetBlock);
      cliGetInput();
    }else if(userInput.startsWith("Order(")){//ORDER function merging with below \/ \/
      ////frankieCoin.createOrder(new sapphirechain.Order('0x0666bf13ab1902de7dee4f8193c819118d7e21a6','BUY','SPHREGEM',3500,0.25));
      ////Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pair":"SPHREGEM","price":1.38,"ticker":"EGEM"});
      log(userInput.slice(userInput.indexOf("Order(")+6, userInput.indexOf(")")));
      //extract the JSON
      var jsonSend = userInput.slice(userInput.indexOf("Order(")+6, userInput.indexOf(")"));
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
      log("1st Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);
      myblockorder = new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price);
      frankieCoin.createOrder(myblockorder);
      //BlockchainDB.addOrder({order:myblockorder});
      BlkDB.addOrder(action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
      cliGetInput();
    }else if(isJSON(userInput)){//ORDER JSON style strait to order DB ^^ merging with above
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(userInput)["fromAddress"])){//adding function capabilioties
        //Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pairBuy":"EGEM","price":1.38,"pairSell":"SPHR"});
        log("Valid EGEM Sapphire Address")
        //create the order
        var myorder = {
          "order":
          {"id":null,
          "fromAddress":JSON.parse(userInput)["fromAddress"],
          "buyOrSell":JSON.parse(userInput)["buyOrSell"],
          "pairBuy":JSON.parse(userInput)["pairBuy"],
          "pairSell":JSON.parse(userInput)["pairSell"],
          "amount":JSON.parse(userInput)["amount"],
          "price":JSON.parse(userInput)["price"],
          //"state":JSON.parse(userInput)["state"],
          //"transactionID":JSON.parse(userInput)["transactionID"],
          //"originationID":JSON.parse(userInput)["originationID"],
          //"timestamp":JSON.parse(userInput)["timestamp"]
        }};
        //var myorder = {order:JSON.parse(userInput)};
        log("order is "+myorder)

        //putting it on the chain first
        var maker = JSON.parse(userInput)["fromAddress"];
        var action = JSON.parse(userInput)["buyOrSell"];
        var amount = JSON.parse(userInput)["amount"];
        var price = JSON.parse(userInput)["price"];
        var pairBuy = JSON.parse(userInput)["pairBuy"];
        var pairSell = JSON.parse(userInput)["pairSell"];
        log("2nd Placing order to "+action+" "+amount+" of "+pairBuy+" for "+price+" by "+maker);

        myblockorder = new sapphirechain.Order(maker,action,pairBuy,pairSell,amount,price);
        frankieCoin.createOrder(myblockorder);
        //BlockchainDB.addOrder({order:myblockorder});
        BlkDB.addOrder(action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
        //{"order":{"id":null,"fromAddress":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","buyOrSell":"SELL","pairBuy":"EGEM","pairSell":"SPHR","amount":"300","price":"26.00"}}

        cliGetInput();
      }
    }else{
      log("[placeholder] that selection is not valid atm");
      cliGetInput();
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
  ommers:frankieCoin.getLatestBlock()["ommers"],
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
//BlockchainDB.addGenBlock(genBlock);
BlkDB.addBlock(1,JSON.stringify(frankieCoin.getLatestBlock()));
BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);
//BlockchainDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);
log("peer chain is"+ frankieCoin.getEntireChain());
var franks = miner(frankieCoin);

/////////////////////////////////////////////////////////////////synch the chain
log("------------------------------------------------------")
log(chalk.green("CHAIN SYNC (Press T to sync.)"))
log("------------------------------------------------------")
//internal data blockheiht
var blockHeightPtr = 1;
function cbGetBlock(data){
  JSON.stringify(data);
}

var ChainSynchHashCheck = function(peerLength,peerMaxHeight){

  log("------------------------------------------------------")
  log(chalk.green("CHAIN SYNCING"))
  log("------------------------------------------------------")
  var nodesInChain = frankieCoin.retrieveNodes();
  var longestPeer = 0;
  for(node in nodesInChain){
    if(parseInt(nodesInChain[node]["info"]["chainlength"]) > longestPeer){
      longestPeer = parseInt(nodesInChain[node]["info"]["chainlength"]);
      frankieCoin.longestPeerBlockHeight = longestPeer;
    }
  }
  log("------------------------------------------------------")
  log(chalk.green("CHAIN DATA"))
  log("------------------------------------------------------")
  log(longestPeer+" <<lp   mh>>"+peerMaxHeight+"<<mh    pl>> "+peerLength)
  frankieCoin.incrementPeerNonce(nodesInChain[node]["id"],peerLength);
  log(JSON.stringify(nodesInChain));
  //the pong us set to be one higher from the ping and is above the chain length
  if(longestPeer <= peerMaxHeight){
    log("are you synched UP? "+frankieCoin.isChainSynch(longestPeer).toString())
  }else{
    log("are you synched UP? "+frankieCoin.isChainSynch(peerMaxHeight).toString())
  }
  log("3333333333    "+longestPeer+""+peerMaxHeight+""+frankieCoin.getLength()+"    333333333");
  if(longestPeer == peerMaxHeight && peerMaxHeight == frankieCoin.getLength()){
    log("------------------------------------------------------")
    log(chalk.green("MOST COMPLETE SYNC"))
    log("------------------------------------------------------")
    frankieCoin.inSynch = frankieCoin.isChainSynch(peerMaxHeight);
    frankieCoin.inSynchBlockHeight = peerMaxHeight;
  }

  //this.chain.inSynch = frankieCoin.isChainSynch()
}

var callBackEntireDatabase = function(data){
  for(obj in data){
    console.log(JSON.stringify(data[obj]));
  }
}

//the idea is to sync the chain data before progression so we start with a callback of data store limited by number of blocks
var cbChainGrab = function(data) {
  //log('got data: '+JSON.stringify(data));//test for input
  for (obj in data){
    //log("BLOCK CHAIN SYNCH "+JSON.stringify(data[obj]["blocknum"]));
    if(typeof frankieCoin.getBlock(data[obj]["blocknum"]) === "undefined" || frankieCoin.getBlock(data[obj]["blocknum"]) === null){
      //block not in memory
      frankieCoin.addBlockFromDatabase(data[obj]);
    }else{
      //log("block exists in chain data: "+data[obj]["blocknum"]);
    }
    blockHeightPtr++;
  }

  log(chalk.blue("BlocHeightPtr: "+ chalk.green(blockHeightPtr)));
  //this is where we call a function with the blockHeight pointer that finds out the peerBlockHeight and then download missing data
  for (let id in peers) {
    //chain sync ping
    peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
  }
  //finally we set the RPC block which is updated by peer synch processes
  //this is where we SUBMIT WORK leaving it to eeror right now
  log("------------------------------------------------------");
  log(chalk.green("CALLING SUBMIT BLOCK"));
  log("------------------------------------------------------");

  var options = {
    uri: 'http://localhost:9090/rpc',
    method: 'POST',
    json: {createBlock:{block:frankieCoin.getLatestBlock()}}
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      log(body.id) // Print the shortened url.
    }
  });

};
//a function call for datastore
function ChainGrab(blocknum){
  //BlockchainDB.getBlockchain(99,cbChainGrab);
  BlkDB.getBlockchain(99,cbChainGrab)
  //maybe some other stuff like .then
};
//and finally the actual call to function for synch
setTimeout(function(){ChainGrab();},3000);
//end by now we will know if synched or not and enable or disable mining
log("------------------------------------------------------")
log(chalk.green("CHAIN SYNCED"))
log("------------------------------------------------------")
/////////////////////////////////////////////////////////////END synch the chain

////////////////////////////////////////////////this is the functions for orders
var myTradeCallback = function(orig,data) {
  log('SELL TRADE ORDERS: '+JSON.stringify(data));//test for input
  log('SELL TRADE ORDERS: '+JSON.stringify(orig));//test for input
  for (obj in data){
    log("this would be the transaction: ");
    log("BUYER "+orig["fromAddress"]+" OF "+orig["pairBuy"]+" QTY "+orig["amount"]+" FOR "+orig["price"]+" OF "+orig["pairBuy"]+" PER "+orig["pairSell"]+" txID "+orig["transactionID"]+" ORIGTX "+orig["originationID"]);
    log("SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]+" txID "+data[obj]["transactionID"]+" ORIGTX "+data[obj]["originationID"]);

    if(parseInt(orig["amount"]) <= parseInt(data[obj]["amount"])){
      ///////////////////////////////////if the buy amount is less than the sell
      log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(orig["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(data[obj]["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseFloat(data[obj]["amount"]) - parseFloat(orig["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
      //log("UNFILLED REPLACEMENT ORDER: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "++ " OF "+orig["pairBuy"]);
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
      //BlockchainDB.addOrder({order:replacementOrder});
      BlkDB.addOrder("SELL"+":"+data[obj]["pairBuy"]+":"+data[obj]["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
    }else if (orig["amount"] > parseInt(data[obj]["amount"])){
      log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(data[obj]["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(data[obj]["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseFloat(orig["amount"]) - parseFloat(data[obj]["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
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
      //BlockchainDB.addOrder({order:replacementOrder});
      BlkDB.addOrder("BUY"+":"+orig["pairBuy"]+":"+orig["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
    }

  }
};

//processingTrades
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuyOrders = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSellOrders = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};

//////////////////////////////////////////////////////////////////////////////2nd call
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuyMiner = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    //frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', data[obj]["fromAddress"], 20, "SPHR"));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlkDB.buildTrade(data[obj],myTradeCallback);
    BlockchainDB.clearOrderById(data[obj]["id"]);
    //since the order needs to be on the blockchain here we really need to just delete it but the order processing below is not necessary
    //however I am keeping it here in comments in case I want to move this function to the block
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};
//////////////////////////////////////////////////////////////////////////////2nd call
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSellMiner = function(data) {
  log('SELL[BUY] ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("SELLER[BUYER] "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    frankieCoin.createOrder(new sapphirechain.Order(data[obj]["fromAddress"],data[obj]["action"],data[obj]["pairBuy"],data[obj]["pairSell"],data[obj]["amount"],data[obj]["price"]));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlkDB.buildTrade(data[obj],myTradeCallback);
    BlockchainDB.clearOrderById(data[obj]["id"]);
    //since the order needs to be on the blockchain here we really need to just delete it but the order processing below is not necessary
    //however I am keeping it here in comments in case I want to move this function to the block
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
  }
};

//this callback is for processing trades to database and may be eliminated to new process
var myCallbackBuy = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){

    log("BUYER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" PER "+JSON.parse(data[obj])["pairSell"]+" timestamp "+JSON.parse(data[obj])["timestamp"]+" transactionID "+JSON.parse(data[obj])["transactionID"]);
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlkDB.buildTrade(JSON.parse(data[obj]),myTradeCallback);
  }
};
//this callback is for processing trades to database and may be eliminated to new process
var myCallbackSell = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]+" timestamp "+data[obj]["timestamp"]+" transactionID "+data[obj]["transactionID"]);
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlkDB.buildTrade(data[obj],myTradeCallback);
  }
};
////////////////////////////////////////////////////////end functions for orders

//////////////////////////////////////////inter module parent child communicator
var broadcastPeersBlock = function(){
  //sending the block to the peers
  log("------------------------------------------------------")
  log(chalk.bgGreen("BROADCASTING QUARRY MINED BLOCK TO PEERS"))
  log("------------------------------------------------------")
  broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));
}

//parent communicator callback function sent to child below
var impcchild = function(childData,functionName){
  //log("------------------------------------------------------");
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(chalk.blue("Incoming data from child: "+chalk.green(childData)));

  if(isJSON(childData) && JSON.parse(childData)["createBlock"]){
    log(chalk.blue("Current prev hash is: "+chalk.green(frankieCoin.getLatestBlock().hash)+"\nIncoming block previous hash is: "+JSON.parse(childData)["createBlock"]["block"]["previousHash"]));

    if((frankieCoin.getLatestBlock().hash == JSON.parse(childData)["createBlock"]["block"]["previousHash"]) && JSON.parse(childData)["createBlock"]["block"]["timestamp"] != "1541437502148"){
      franks.mpt3(JSON.parse(childData)["address"],JSON.parse(childData)["createBlock"]["block"]);
      ////////here is the database update and peers broadcast
      log("[placeholder] mining stats from outside miner");
      log("Outside Miner Mined Block Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
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
        ommers:frankieCoin.getLatestBlock()["ommers"],
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
      log(minedblock);
      var blockExists = function(block){
        console.log("does my block exist: "+block["blocknum"]);
      }
      //BlockchainDB.getBlock(parseInt(frankieCoin.getLength()),blockExists);
      //BlockchainDB.addBlock(minedblock);
      BlkDB.addBlock(frankieCoin.blockHeight,JSON.stringify(frankieCoin.getLatestBlock()));
      BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);
      //BlockchainDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);

      functionName();
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
          log(body.id) // Print the shortened url.
        }
      });
    }

  }else if(isJSON(childData) && JSON.parse(childData)["getWorkForMiner"]){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(chalk.green("work returned to miner"));
    //log(JSON.parse(childData)["getWorkForMiner"])
  }else if(isJSON(childData) && JSON.parse(childData)["getOrderBook"]){
    log("now we are gonna have some fun")
    impceventcaller("returning from function","maybe the calling peer is not necessary");
  }else if(isJSON(childData) && JSON.parse(childData)["getBalance"]){
    log("retrieving a balance for address provided...");
    log(JSON.parse(childData)["getBalance"]);
    log(JSON.parse(childData)["getBalance"]["address"]);
    var getBalance3 = frankieCoin.getBalanceOfAddress(JSON.parse(childData)["getBalance"]["address"]);
    log('\nMiners Function Balance of '+JSON.parse(childData)["getBalance"]["address"]+' is', getBalance3);
    log(getBalance3["SPHR"]);

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
        log(body.id) // Print the shortened url.
      }
    });
  }else if(isJSON(childData) && JSON.parse(childData)["transaction"]){
    log("Incoming Transaction over RPC");
    log(chalk.yellow(JSON.stringify(JSON.parse(childData)["transaction"]["txhash"])));
    var txhash = JSON.parse(childData)["transaction"]["txhash"];
    var txsignature = JSON.parse(childData)["transaction"]["signature"];
    var egemSendingAddress = web3.eth.accounts.recover(txhash,txsignature);
    log("This transaction was submitted by "+chalk.yellow(egemSendingAddress));
    impceventcaller("This transaction was submitted by "+egemSendingAddress)
  }else{
    log("RCP commands were not properly formatted");
  }
}

var impcMethods = function(datacall){
  return new Promise((resolve)=> {
    log(chalk.yellow("data calling in peer [this message is for dev]"));
    log(JSON.stringify(datacall));
    var dataBuySell = [];
    var myCallbackOrderBuy = function(data) {
      log('BUY ORDERS: '+JSON.stringify(data));//test for input
      //resolve(data);
      dataBuySell.push({"buy":data});
      BlkDB.getOrdersPairSell(datacall["tickerBuy"],myCallbackOrderSell);
      //BlockchainDB.getOrdersPairSell(datacall["tickerBuy"],myCallbackOrderSell);
    };
    var myCallbackOrderSell = function(data) {
      log('SELL ORDERS: '+JSON.stringify(data));//test for input
      dataBuySell.push({"sell":data});
      resolve(dataBuySell);
    };
    BlkDB.getOrdersPairBuy(datacall["tickerBuy"],myCallbackOrderBuy);
    //BlockchainDB.getOrdersPairBuy(datacall["tickerBuy"],myCallbackOrderBuy);
  })
}

var impceventcaller;
var impcevent = function(callback){
    //sets the impcparent with the function from parent
    impceventcaller = callback;
}
//initialize the child with the parent communcator call back function
rpcserver.globalParentCom(impcchild,broadcastPeersBlock);
rpcserver.globalParentEvent(impcevent);
rpcserver.globalParentComMethods(impcMethods);
//////////////////////////////////////end inter module parent child communicator

////////////////////////////////////////////////initialize the console interface
cliGetInput();
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
