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
var web3 = new Web3(new Web3.providers.HttpProvider("https://lb.rpc.egem.io"));
//var web3 = new Web3(new Web3.providers.HttpProvider("https://rpc-2.egem.io/custom"));
var DatSyncLink = require("./datsynch.js");

//genesis hash variables
var Genesis = require('./genesis');
const fs = require('fs');
const sha256 = require('crypto-js/sha256');

//adding color to console
const chalk = require('chalk');
const log = console.log;

//////////////////////////////////////////////////this node private comm account
const privateCom = require('./privateCom.js');

////////////////////////////////////////////////////calls the level db interface
var BlkDB = require('./level.js');

//////////////////////////////////////////////////////////////////////rpc sercer
var rpcserver = require('./rpc_server.js');

/////////////////////////////////////////////////////////////////requests to rpc
var request = require('request');

///////////////////////Mining stuff : blockchain algo and mining initializations
var sapphirechain = require("./block.js");
sapphirechain.setBlockchainDB(BlkDB);
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
    BlkDB.addChainParams(globalGenesisHash,JSON.stringify({"version":"alpha.0.0.1"}));
    BlkDB.addChainParams(globalGenesisHash+":blockHeight",0);
    //BlkDB.addChainState("cs:blockHeight",403);//NEVER CALL THIS HERE WITH 0 IT DEFEATS THE PURPOSE
});
////////////////////////////////////////////////////////////////end genesis hash

////////////////////////////////////////////////////////////////synching section
var chainState = {};//need to store in the db as chain state and put event lop for changes
chainState.isSynching = false;
chainState.chainWalkHeight = 1;
chainState.chainWalkHash = '7e3f3dafb632457f55ae3741ab9485ba0cb213317a1e866002514b1fafa9388f';//block 1 hash
chainState.synchronized = 1;//when we are synched at a block it gets updated
chainState.topBlock = 0;
//chainState.accountsTrie = 0;
var isSynching = false;//will add numerics to this
////////////////////////////////////////////////////////////end synching section

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
  console.log("this address balance is ");
  console.log(chalk.green("------------------------"));
  for(x in val){
    console.log(chalk.yellow(x+": ")+val[x]);
  }
  console.log(chalk.green("------------------------"));
}
/////////////////////////////////////////////////////end callback for address balances

//////////////////////////////////////////////////////////////////CHAIN VAIDATOR
var cbBlockChainValidator = function(isValid,replyData,replyHash){
  if(isValid == true){
    if(chainState.chainWalkHeight == replyData){
      console.log("this point was already reached which means its stuck here ...pinging");
      for (let id in peers) {
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync."));
        log("------------------------------------------------------");
        peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(replyData),GlobalHash:globalGenesisHash}}));
      }
    }

    chainState.chainWalkHeight = replyData;
    chainState.chainWalkHash = replyHash;
    console.log("VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
    if( (parseInt(replyData) == parseInt(chainState.chainWalkHeight)) && (parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight)) ){
      console.log("do we even enter (load)?");
      chainState.synchronized = parseInt(replyData);
    }else{
      console.log("do we enter the else ?");
      console.log(parseInt(replyData) == parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight));
      console.log("AND THE VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
    }
    console.log("BLOCK HEIGHT VALIDATED TO "+replyData,replyHash);
    //set the chain state validated height;
  }else{
    console.log("NOT VALID NEED TO PING AT "+replyData);
    //set ping here
    for (let id in peers) {
      log("------------------------------------------------------");
      log(chalk.green("Sending ping for chain sync."));
      log("------------------------------------------------------");
      peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(replyData),GlobalHash:globalGenesisHash}}));
    }
  }
}
/////////////////////////////////////////////////////////////END CHAIN VALIDATOR

//////////////////////////////////////////////////////core function asynchronous
;(async () => {
  const port = await getPort()//grab available random port for peer connections

  sw.listen(port)//peers
  sw.join('egem-sfrx') // can be any id/name/hash
  //incoming connections from peers
  sw.on('connection', (conn, info) => {

    log(chalk.blue(JSON.stringify(info)));
    const seq = connSeq
    const peerId = info.id.toString('hex');

    if(info.id != myId){
      frankieCoin.registerNode(peerId,info.host,info.port,frankieCoin.length);
      BlkDB.addNode("node:"+peerId+":connection",{"host":info.host,"port":info.port});
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

    var incomingStream = "";
    var incomingBufferArray = [];

    conn.on('end',function(){
      console.log("data stream ended ");
      //setTimeout(function(){console.log("incoming buffer array is "+incomingBufferArray)},2000);

      console.log("this is on end "+incomingStream);



      console.log("Importing the data file to the db and then calling the memory synch");
      setTimeout(function(){BlkDB.importFromJSONStream(ChainGrabRefresh,parseInt(chainState.chainWalkHeight+1),cbChainGrab,frankieCoin.chainRiser,incomingStream);},2000);
      //setting this here and heed more intake checks
      frankieCoin.blockHeight = parseInt(chainState.chainWalkHeight);
      //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
      var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
        setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
      }

    });


    conn.on('readable',function(){

      console.log("ILL BEEEEEEEEEEEEEEEEEE RIGHT ON BRO WE HAVE FIGURED OUT THE STREAM IS READABLE "+this.readableHighWaterMark);

      let chunk;
      while (null !== (chunk = this.read())) {
        console.log(`Received ${chunk.length} bytes of data.`);
        incomingStream+=chunk.toString()
        incomingBufferArray.push(chunk.toString());
      }

    });


    conn.on('data', data => {
      // Here we handle incomming messages

      //console.log("type of is "+typeof(data)+JSON.stringify(data));
      //log('Received Message from peer ' + peerId + '----> ' + data.toString() + '====> ' + data.length +" <--> "+ data);
      // callback returning verified uncles post processing probably needs a rename
      var sendBackUncle = function(msg,peerId){
        peers[peerId].conn.write(JSON.stringify(msg));
      }

////////////////////////////////////////////begin the if block for incoming data
      if(isJSON(data.toString())){
////////////////////////////////////////////////////////////incoming transaction
        if(JSON.parse(data)["signature"]){//////////////////////////////////////
          console.log("TTTTTTTTTTTTTTTTTTTT    INCOMING TX or OX    TTTTTTTTTTTTTTTTTTTTTTTTTT");
          console.log("TTTTTTTTTTTTTTTTTTTT    INCOMING TX or OX    TTTTTTTTTTTTTTTTTTTTTTTTTT");
          var message = JSON.parse(data)["message"];
          if(JSON.parse(message)["send"]){
              console.log("TTTTTTTTTTTTTTTTTTTT    TXTXTXTXTXTXTXT    TTTTTTTTTTTTTTTTTTTTTTTTTT");
              var send = JSON.stringify(JSON.parse(message)["send"]);
              var addressFrom = JSON.stringify(JSON.parse(send)["from"]).replace(/['"/]+/g, '');
              var addressTo = JSON.stringify(JSON.parse(send)["to"]).replace(/['"/]+/g, '');
              var amount = JSON.stringify(JSON.parse(send)["amount"]).replace(/['"/]+/g, '');
              var ticker = JSON.stringify(JSON.parse(send)["ticker"]).replace(/['"/]+/g, '');
              var validatedSender = web3.eth.accounts.recover(JSON.parse(data)["message"],JSON.parse(data)["signature"]);
              if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
                ///need to alidate that this wallet has the funds to send
                frankieCoin.createTransaction(new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker));
                console.log("This legitimate signed transaction by "+validatedSender+" has been posted");

              }else{
                console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
              }
          }else if(JSON.parse(message)["order"]){
              console.log("TTTTTTTTTTTTTTTTTTTT    OXOXOXOXOXOXOXO    TTTTTTTTTTTTTTTTTTTTTTTTTT");
              var order = JSON.stringify(JSON.parse(message)["order"]);
              var addressFrom = JSON.stringify(JSON.parse(order)["fromAddress"]).replace(/['"/]+/g, '');
              var buyOrSell = JSON.stringify(JSON.parse(order)["buyOrSell"]).replace(/['"/]+/g, '');
              var pairBuy = JSON.stringify(JSON.parse(order)["pairBuy"]).replace(/['"/]+/g, '');
              var pairSell = JSON.stringify(JSON.parse(order)["pairSell"]).replace(/['"/]+/g, '');
              var amount = JSON.stringify(JSON.parse(order)["amount"]).replace(/['"/]+/g, '');
              var price = JSON.stringify(JSON.parse(order)["price"]).replace(/['"/]+/g, '');
              var validatedSender = web3.eth.accounts.recover(JSON.parse(data)["message"],JSON.parse(data)["signature"]);
              var transactionID = JSON.parse(data)["transactionID"];
              var originationID = JSON.parse(data)["originationID"];
              var timestamp = JSON.parse(data)["timestamp"]
              if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
                ///need to alidate that this wallet has the funds to send
                myblockorder = new sapphirechain.Order(addressFrom,buyOrSell,pairBuy,pairSell,amount,price);
                myblockorder["transactionID"]=transactionID;
                myblockorder["originationID"]=originationID;
                myblockorder["timestamp"]=timestamp;
                frankieCoin.pendingOrders.push(myblockorder);
                BlkDB.addOrder("ox:"+buyOrSell+":"+pairBuy+":"+pairSell+":"+transactionID+":"+timestamp,myblockorder);
                console.log("This legitimate signed order by "+validatedSender+" has been posted to chain with confirmation "+myblockorder.transactionID);
              }else{
                console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
              }
          }else{
              console.log("SOME OTHER TRANSMISSION NOT FORMATTED CORRECTLY")
          }
        }else if(JSON.parse(data)["deletableOrders"]){
          var getDeleteableOrders = JSON.parse(data)["deletableOrders"];
          console.log("these will be the deleted orders....%%%%%%%%%%%%%%%%%%");
          for(oxdel in getDeleteableOrders){
            console.log(JSON.stringify(getDeleteableOrders[oxdel]));
          }
////////////////////////////////////////////////////////////incomeing peer block
        }else if(JSON.parse(data)["previousHash"]){/////////need more refinement
          //storing some variables of current chain
          var currentChainHash = frankieCoin.getLatestBlock()["hash"];
          var incomingBLockHeight = JSON.parse(data)["blockHeight"];
          console.log("VVVVVVVVVVVVVVVVVVVVV        "+incomingBLockHeight+"        VVVVVVVVVVVVVVVVVVVV    ---->   "+frankieCoin.blockHeight);



            ///////////////NEED TO REMOVE ANY MATCHED PENDING TXS FROM MEME POOL
            console.log("RRRRRRRRRRRRRRRRRRRRR  removing txs RRRRRRRRRRRRRRR");
            console.log("RRRRRRRRRRRRRRRRRRRRR  removing txs RRRRRRRRRRRRRRR");
            var incomingTx = JSON.parse(data)["transactions"];
            var existingPendingTx = frankieCoin.pendingTransactions;
            var replacementTx = [];
            for(ptx in incomingTx){
              /****does not work this way need to rethink
              if(incomingTx[ptx]["oxdid"]){
                console.log("we are actually in the incoming tx looking at order id deletion")
                BlkDB.clearOrderById(incomingTx[ptx]["oxdid"],incomingTx[ptx]["oxtid"]);
              }
              ****/
              for(etx in existingPendingTx){
                //adding logic to remove orders if ox id present
                if(incomingTx[ptx]["hash"] == existingPendingTx[etx]["hash"]){
                  //do nothing removes this element
                }else{
                  replacementTx.push(existingPendingTx[etx]);
                }
              }
            }
            frankieCoin.pendingTransactions = [];
            frankieCoin.pendingTransactions = replacementTx;
            ///////////////NEED TO REMOVE ANY MATCHED PENDING OXS FROM MEME POOL
            console.log("RRRRRRRRRRRRRRRRRRRRR  removing oxs RRRRRRRRRRRRRRR");
            console.log("RRRRRRRRRRRRRRRRRRRRR  removing oxs RRRRRRRRRRRRRRR");
            var incomingOx = JSON.parse(data)["orders"];
            var existingPendingOx = frankieCoin.pendingOrders;
            var replacementOx = [];
            for(pox in incomingOx){
              for(eox in existingPendingOx){
                if(incomingOx[pox]["hash"] == existingPendingOx[eox]["hash"]){
                  //do nothing removes this element
                }else{
                  replacementOx.push(existingPendingOx[eox]);
                }
              }
            }
            frankieCoin.pendingOrders = [];
            frankieCoin.pendingOrders = replacementOx;
            ////////////////////////////////////END REMOVAL OF PENDING TX AND OX

            //first we add the block to the blockchain with call back and id of submitting peer for conflict resolution
            var successfulBlockAdd = frankieCoin.addBlockFromPeers(JSON.parse(data),sendBackUncle,peerId);

            log(chalk.bgGreen("SUCCEFSSFUL BLOCK ADD? "+successfulBlockAdd));


              //increment the internal peer nonce of sending party to track longest chain
              frankieCoin.incrementPeerNonce(peerId,JSON.parse(data)["blockHeight"]);
              BlkDB.addNode("node:"+peerId+":peerBlockHeight",JSON.parse(data)["blockHeight"]);
              //logging the block added to chain for console
              log(chalk.red("--------------------------------------------------------------------"));
              //log(chalk.green("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock())));//verbose
              log(chalk.green("block added to chain: "+JSON.stringify(JSON.parse(data)["blockHeight"])));
              log(chalk.green("in prev hash: ")+JSON.parse(data)["previousHash"]+chalk.green(" <=> chain: ")+currentChainHash);
              log(chalk.yellow("                     SUCESSFUL BLOCK FROM PEER                      "));
              log(chalk.red("--------------------------------------------------------------------"));
              //////update the client database OR reject block and rollback the chain - code is incomplete atm
              //add it to the database
              BlkDB.addBlock(parseInt(JSON.parse(data)["blockHeight"]),JSON.stringify(JSON.parse(data)),"202");
              BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(JSON.parse(data)["blockHeight"]));
              BlkDB.addChainState("cs:blockHeight",parseInt(JSON.parse(data)["blockHeight"]));
              BlkDB.addTransactions(JSON.stringify(JSON.parse(data)["transactions"]),JSON.parse(data)["hash"]);
              //add it to the RPC for miner
              rpcserver.postRPCforMiner({block:JSON.parse(data)});


              BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash);



        }else if(JSON.parse(data)["fromAddress"]){

          log("well, this is an order and we need to give it a transaction id when mined");

        }else if(JSON.parse(data)["uncle"]){

          log(chalk.bgBlue("THIS IS THE UNCLRE RETURN WE LOG THE OMMER AND DELETE"));
          log(data["uncle"]);

        }else if(JSON.parse(data)["ChainSyncPing"]){

          log(JSON.parse(data)["ChainSyncPing"]);
          if(JSON.parse(data)["ChainSyncPing"]["GlobalHash"] == globalGenesisHash){
            log(chalk.green("Global hashes matched!"));
            frankieCoin.incrementPeerMaxHeight(peerId,JSON.parse(data)["ChainSyncPing"]["MaxHeight"]);
            BlkDB.addNode("node:"+peerId+":MaxHeight",JSON.parse(data)["ChainSyncPing"]["MaxHeight"]);
            var peerBlockHeight = JSON.parse(data)["ChainSyncPing"]["Height"];
            var pongBack = false;

              //increment it by one to return the next block
              peerBlockHeight++;
              //returning the block
              console.log(frankieCoin.chainRiser+" <<<< chain riser "+(frankieCoin.getLength() - parseInt(peerBlockHeight)) / parseInt(frankieCoin.chainRiser)+" <<<<the difference");
              if((frankieCoin.getLength() > parseInt(peerBlockHeight)) && (chainState.synchronized > parseInt(peerBlockHeight)) && (frankieCoin.getLength() - parseInt(peerBlockHeight)) / parseInt(frankieCoin.chainRiser) > 0){
                console.log("this is properly flagged for streaming");
                /***
                var pongBackBlockStream = function(blockData){
                  peers[peerId].conn.write(JSON.stringify({pongBlockStream:blockData}));
                }
                BlkDB.getBlockStream(parseInt(peerBlockHeight),pongBackBlockStream);
                ***/
                var setDatSynch = function(datSynch,reqPeer){
                  reqPeer.conn.write(JSON.stringify({pongBlockStream:datSynch,blockHeight:frankieCoin.getLength()}));
                }
                var cbGetSynch = function(datpeer){
                  console.log("calling dat synch")
                  DatSyncLink.synchDatabaseJSON(setDatSynch,datpeer);
                }

                var cbGetStream = function(jsonStream,streamToPeerID){
                  streamToPeerID.conn.write(jsonStream);
                  streamToPeerID.conn.end();
                  //setting up some streams to try this out
                }
                //BlkDB.dumpDatCopy(cbGetSynch,peers[peerId]);
                //BlkDB.dumpToJsonFIle(cbGetSynch,peers[peerId]);
                BlkDB.dumpToStreamFIleRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],frankieCoin.chainRiser)
                //BlkDB.dumpToJsonFIleRange(cbGetSynch,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],frankieCoin.chainRiser);


                //pongBack = true;//not sure about this since this is a stream
              }else if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
                //peers[peerId].conn.write(JSON.stringify(frankieCoin.getBlock(parseInt(peerBlockHeight))));
                var pongBackBlock = function(blockData){
                  peers[peerId].conn.write(blockData.toString());
                }
                BlkDB.getBlock(parseInt(peerBlockHeight),pongBackBlock);
                pongBack = true;
              }else if(frankieCoin.blockHeight == parseInt(peerBlockHeight)){
                //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
                peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
                pongBack = true;
              }else if((peerBlockHeight > frankieCoin.blockHeight) && (peerBlockHeight == (frankieCoin.blockHeight+1))){
                //setTimeout(function(){peers[peerId].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));},3000);
                peerBlockHeight--;
                pongBack = true;
              }else if(peerBlockHeight > (frankieCoin.blockHeight+2)){

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
              setTimeout(function(){if(peers[peerId]){peers[peerId].conn.write(JSON.stringify({"ChainSyncPong":{Height:peerBlockHeight,MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));}},300);
            }
            //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }else{
            log("Did not match this hash and this peer is an imposter");
            //peers[peerId].conn.write("Don't hack me bro");
            peers[peerId].conn.write(JSON.stringify({"BadPeer":{Height:1337}}));
            ///tesst out setTimeout(function(){disconnet peers[peerId].conn.dissconnet();},1500);
          }

        }else if(JSON.parse(data)["BadPeer"]){
          log("------------------------------------------------------");
          log(chalk.red("You modified your code base please update and try again"));
          log("------------------------------------------------------");
          process.exit();
          exit();
        }else if(JSON.parse(data)["pongBlockStream"] && isSynching == true){
          console.log("Extra peer returned synch message but synch is in progress so ignoring")
        }else if(JSON.parse(data)["pongBlockStream"] && isSynching == false){

          isSynching = true;

          var mydata = JSON.parse(data)["pongBlockStream"];
          var providerBlockHeight = parseInt(JSON.parse(data)["blockHeight"]);

          log("------------------------------------------------------");
          log(chalk.green("         BLOCK STREAM SYNCH          "));
          log(chalk.yellow("              STAND BY               "));
          log(chalk.green("         BLOCK STREAM SYNCH          "));
          log("------------------------------------------------------");

          console.log("Block Height of provider is "+providerBlockHeight);
          console.log(mydata);//we can remove this soon

          //callback function to refresh db with downloaded synch then pull to memory
          var cbRefreshDB = function(){
            //passes in ChainGrab function with input params as callback when db is open
            console.log("Importing the data file to the db and then calling the memory synch");
            setTimeout(function(){BlkDB.importFromJSONFile(ChainGrabRefresh,providerBlockHeight,cbChainGrab,frankieCoin.chainRiser);},2000);
            //setting this here and heed more intake checks
            frankieCoin.blockHeight = parseInt(providerBlockHeight);
            //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
            var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
              setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
            }


          }
          //1) going to import the database and callback the refresh
          console.log("Data stream import initialized");
          DatSyncLink.grabDataFile(mydata,cbRefreshDB);


          ////////////////////////////////////USE TO DIRECT READ INCOMING STREAM
          /****
          for (obj in mydata){
            console.log("incoming chain data from synch");
            //log("BLOCK CHAIN SYNCH "+JSON.stringify(data[obj]["blocknum"]));//verbose
            //console.log("blockdata coming inbound "+JSON.parse(data[obj])["blockHeight"]+" vs memory "+JSON.stringify(frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"])))//verbose
            //verify block does not exist in memory
            if(typeof frankieCoin.getBlock(JSON.parse(mydata[obj])["blockHeight"]) === "undefined" || frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"]) === null){
              //block not in memory
              console.log("block does not exist "+mydata[obj]);
              var tempBlock = mydata[obj];
              frankieCoin.addBlockFromDatabase(tempBlock,"streaming in block "+JSON.parse(tempBlock)["blockHeight"])
              BlkDB.addBlock(parseInt(JSON.parse(tempBlock)["blockHeight"]),tempBlock,"414");
            }else{
              //block existed
              log("block exists in chain data: "+JSON.parse(mydata[obj])["blockHeight"]);
            }
            blockHeightPtr++;
          }
          log(chalk.blue("BlocHeightPtr: "+ chalk.green(blockHeightPtr)));
          ****/
          //////////////////////END ARCHIVED USED TO DIRECT READ INCOMING STREAM

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

        if(data.toString().includes("BlockHeight ")){
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
  for (let id in peers){
    if(peers[id] != "undefined"){
      peers[id].conn.write(message)
    }
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

        /****
        for(odr in frankieCoin.pendingOrders){
          if(frankieCoin.pendingOrders[odr]["buyOrSell"] == "BUY"){
            log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            log(frankieCoin.pendingOrders[odr]["price"]);
            log(frankieCoin.pendingOrders[odr]["amount"]);
            log("Any Sell Orders with pricing less tha or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity requested");
            BlkDB.getOrdersPairBuy(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackBuyMiner)
          }else if (frankieCoin.pendingOrders[odr]["buyOrSell"] == "SELL"){
            log(frankieCoin.pendingOrders[odr]["pairBuy"]);
            log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
            log(frankieCoin.pendingOrders[odr]["price"]);
            log(frankieCoin.pendingOrders[odr]["amount"]);
            log("Any BUY Orders with pricing greater than or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity offered");
            BlkDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],myCallbackSellMiner)
          }
        }
        ****/

        //log("pending transactions are"+frankieCoin.pendingTransactions);
        franks.mpt2();

        log("[placeholder] this would be mining stats");
        log("Mined Block Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
        //franks.calculateDigest("first try",10);

        //this is the most sensible place to add the block
        //this would seem to be a function that should be called from miner after meinePendingTx is called but it is better called here

        BlkDB.addTransactions(frankieCoin.getLatestBlock()["transactions"],frankieCoin.getLatestBlock()["hash"]);
        BlkDB.addBlock(parseInt(frankieCoin.getLength()),JSON.stringify(frankieCoin.getLatestBlock()),"469");
        BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(frankieCoin.getLength()));
        BlkDB.addChainState("cs:blockHeight",parseInt(frankieCoin.getLength()));
        //sending the block to the peers
        broadcastPeers(JSON.stringify(frankieCoin.getLatestBlock()));

        //post to rpcserver
        rpcserver.postRPCforMiner({block:frankieCoin.getLatestBlock()});

      }else{
        log("------------------------------------------------------");
        log(chalk.green("CHAIN IS NOT SYNCHED FOR MINING PLEASE WAIT"+frankieCoin.getLength()+peers[0]));
        log("------------------------------------------------------");
      }
      cliGetInput();
    }else if(userInput == "MM"){
      console.log("chain state chain walk height is "+chainState.chainWalkHeight);
      console.log("chain state synchronized equals "+chainState.synchronized);
      console.log("blockchain height is "+frankieCoin.blockHeight);
      setTimeout(function(){
        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash);
      },1000)
      cliGetInput();
    }else if(userInput == "INFO"){
      console.log("chain state chain walk height is "+chainState.chainWalkHeight);
      console.log("chain state synchronized equals "+chainState.synchronized);
      console.log("blockchain height is "+frankieCoin.blockHeight);

      cliGetInput();
    }else if(userInput == "MMM"){
      console.log("calling all orders level db");
      //BlkDB.getAllBLocks();
      //BlkDB.getTransactionReceiptsByAddress('o9');
      //BlkDB.getBalanceAtAddress('0x2025ed239a8dec4de0034a252d5c5e385b73fcd0',addyBal);
      var myOrdersBuyCBTest = function(data){
        console.log("returning leveldb buy orders");
        console.log(JSON.stringify(data));
      }
      //BlkDB.getOrdersBuy(myOrdersBuyCBTest);
      BlkDB.getOrdersBuySorted(myOrdersBuyCBTest);
      BlkDB.getOrdersSellSorted(myOrdersBuyCBTest);
      //BlkDB.getChainParams(globalGenesisHash);
      //BlkDB.getChainParamsBlockHeight(globalGenesisHash);
      cliGetInput();
    }else if(userInput == "PP"){
      for (let id in peers) {
        console.log(peers[id].conn);
      }
      BlkDB.getNodes();
      cliGetInput();
    }else if(userInput == "TX"){
      BlkDB.getTransactions();
      cliGetInput();
    }else if(userInput == "TRIE"){
      BlkDB.getEverythingFromTrie();
      cliGetInput();
    }else if(userInput == "O"){//O is for order
      //other commands can go Here
      log("Order is processing from the database not chain");
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      BlkDB.getOrdersPairBuy("EGEM","SFRX",myCallbackBuy);
      //just a reminder I have other order functions coded
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      cliGetInput();
    }else if(userInput == "OO"){//O is for order
      //other commands can go Here
      log("Just get everything in the database");
      BlkDB.dumpToJsonFIle();
      //BlkDB.getAll();
      log("reading from JSON file to screen");
      //setTimeout(function(){BlkDB.importFromJSONFile();},2000);
      //this function calls buy order from database and...
      //mycallcakbuy calls the sells to match them up
      //the logic may update itself as we move forward from loop to event
      //BlockchainDB.getAllOrders();
      //just a reminder I have other order functions coded
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      cliGetInput();
    }else if(userInput == "OX"){//O is for order
      //other commands can go Here
      var cbTestBuys = function(){
        console.log("does nothing yet");
      }
      BlkDB.getOrdersPairBuy("EGEM","SFRX",cbTestBuys);
      cliGetInput();
    }else if(userInput.startsWith("sign(")){//Sign some data function
      var packageToSign = userInput.slice(userInput.indexOf("sign(")+5, userInput.indexOf(")"));
      console.log(packageToSign);
      //console.log("JSON :"+JSON.parse(packageToSign)["data"]);
      var signedPackage = web3.eth.accounts.sign(JSON.stringify(JSON.parse(packageToSign)["data"]), JSON.parse(packageToSign)["pk"]);
      //console.log(signedPackage);
      var jsonSignedPackage = {"message":signedPackage["message"],"signature":signedPackage["signature"]}
      //var transaction = JSON.parse(JSON.parse(JSON.stringify(jsonSignedPackage))["message"])["send"];
      //console.log(JSON.parse(JSON.stringify(transaction))["from"])
      cliGetInput();
    }else if(userInput.startsWith("signTx(")){//Sign transaction
      var packageToSign = userInput.slice(userInput.indexOf("signTx(")+7, userInput.indexOf(")"));
      console.log(packageToSign);
      //console.log("JSON :"+JSON.parse(packageToSign)["data"]);
      var signedPackage = web3.eth.accounts.sign(JSON.stringify(JSON.parse(packageToSign)["data"]), JSON.parse(packageToSign)["pk"]);
      //console.log(signedPackage);
      var jsonSignedPackage = {"message":signedPackage["message"],"signature":signedPackage["signature"]}
      //var transaction = JSON.parse(JSON.parse(JSON.stringify(jsonSignedPackage))["message"])["send"];
      //console.log(JSON.parse(JSON.stringify(transaction))["from"])
      console.log(JSON.stringify(jsonSignedPackage));
      cliGetInput();
    }else if(userInput.startsWith("signedTransaction(")){//testing signed transactions
      var signedPackage = userInput.slice(userInput.indexOf("signedTransaction(")+18, userInput.indexOf(")"));

      ///////////////////////////////////////////////////////relay asap to peers
      broadcastPeers(signedPackage);

      //console.log("signed package is"+JSON.parse(signedPackage)["message"]);
      var message = JSON.parse(signedPackage)["message"];
      var send = JSON.stringify(JSON.parse(message)["send"]);
      var addressFrom = JSON.stringify(JSON.parse(send)["from"]).replace(/['"/]+/g, '');
      var addressTo = JSON.stringify(JSON.parse(send)["to"]).replace(/['"/]+/g, '');
      var amount = JSON.stringify(JSON.parse(send)["amount"]).replace(/['"/]+/g, '');
      var ticker = JSON.stringify(JSON.parse(send)["ticker"]).replace(/['"/]+/g, '');
      var validatedSender = web3.eth.accounts.recover(JSON.parse(signedPackage)["message"],JSON.parse(signedPackage)["signature"]);
      if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
        ///need to alidate that this wallet has the funds to send
        frankieCoin.createTransaction(new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker));
        console.log("This legitimate signed transaction by "+validatedSender+" has been posted");

      }else{
        console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
      }
      //console.log("finally the address that signed it:" + getMyAddressBack2);
      setTimeout(function(){cliGetInput();},2000);
    }else if(userInput.startsWith("signOrder(")){//Sign an order for the DEX
      //signOrder({"data":{"order":{"fromAddress":"0x7357589f8e367c2c31f51242fb77b350a11830f3","buyOrSell":"SELL","pairBuy":"EGEM","pairSell":"SPHR","amount":"300","price":"26.00"}},"pk":"0x3141592653589793238462643383279502884197169399375105820974944592"})
      var packageToSign = userInput.slice(userInput.indexOf("signOrder(")+10, userInput.indexOf(")"));
      console.log(packageToSign);
      var signedPackage = web3.eth.accounts.sign(JSON.stringify(JSON.parse(packageToSign)["data"]), JSON.parse(packageToSign)["pk"]);
      //console.log(signedPackage);
      var jsonSignedPackage = {"message":signedPackage["message"],"signature":signedPackage["signature"]}
      //var transaction = JSON.parse(JSON.parse(JSON.stringify(jsonSignedPackage))["message"])["send"];
      //console.log(JSON.parse(JSON.stringify(transaction))["from"])
      console.log(JSON.stringify(jsonSignedPackage));
      cliGetInput();
    }else if(userInput.startsWith("signedOrder(")){//testing signed transactions
      var signedPackage = userInput.slice(userInput.indexOf("signedOrder(")+12, userInput.indexOf(")"));
      //console.log("signed package is"+JSON.parse(signedPackage)["message"]);
      var message = JSON.parse(signedPackage)["message"];
      var order = JSON.stringify(JSON.parse(message)["order"]);
      var addressFrom = JSON.stringify(JSON.parse(order)["fromAddress"]).replace(/['"/]+/g, '');
      var buyOrSell = JSON.stringify(JSON.parse(order)["buyOrSell"]).replace(/['"/]+/g, '');
      var pairBuy = JSON.stringify(JSON.parse(order)["pairBuy"]).replace(/['"/]+/g, '');
      var pairSell = JSON.stringify(JSON.parse(order)["pairSell"]).replace(/['"/]+/g, '');
      var amount = JSON.stringify(JSON.parse(order)["amount"]).replace(/['"/]+/g, '');
      var price = JSON.stringify(JSON.parse(order)["price"]).replace(/['"/]+/g, '');
      var validatedSender = web3.eth.accounts.recover(JSON.parse(signedPackage)["message"],JSON.parse(signedPackage)["signature"]);
      if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
        ///need to alidate that this wallet has the funds to send
        myblockorder = new sapphirechain.Order(addressFrom,buyOrSell,pairBuy,pairSell,amount,price);
        frankieCoin.createOrder(myblockorder);
        BlkDB.addOrder("ox:"+buyOrSell+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
        console.log("This legitimate signed order by "+validatedSender+" has been posted to chain with confirmation "+myblockorder.transactionID);
      }else{
        console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
      }
      setTimeout(function(){cliGetInput();},2000);
    }else if(userInput.startsWith("getBlock(")){//GETBLOCK function
      log(userInput.slice(userInput.indexOf("getBlock(")+9, userInput.indexOf(")")));
      var blocknum = userInput.slice(userInput.indexOf("getBlock(")+9, userInput.indexOf(")"));
      log(JSON.stringify(frankieCoin.getBlock(parseInt(blocknum))));
      BlkDB.getBlock(blocknum,cbGetBlock);
      var pongBackBlock = function(blockData){
        console.log("this was the way to do it "+blockData.toString());
      }
      BlkDB.getBlock(parseInt(blocknum),pongBackBlock);
      cliGetInput();
    }else if(userInput.startsWith("getChainParams()")){//GETBLOCK function
      BlkDB.getChainParams(globalGenesisHash);
      BlkDB.getChainParamsBlockHeight(globalGenesisHash);
      cliGetInput();
    }else if(userInput == "getLength()"){
      var currentChainLenth = frankieCoin.getLength();
      log("Current Chain Length = "+currentChainLenth);
      cliGetInput();
    }else if(userInput.startsWith("getBalance(")){
      log("");
      log(userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")")));
      var egemAddress = userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")"));
      BlkDB.getBalanceAtAddress(egemAddress,addyBal)
      log("---------------");
      var addyBal2 = function(data){
        console.log("from the trie "+JSON.stringify(data));//do noting now
      }
      BlkDB.getBalanceAtAddressFromTrie(egemAddress,addyBal2)
      cliGetInput();
    }else if(userInput.startsWith("getPendingOrders()")){
      log("---------------");
      log(JSON.stringify(frankieCoin.pendingOrders));
      log("---------------");
      cliGetInput();
    }else if(userInput.startsWith("getOrders()")){
      log("---------------");
      var myOrdersBuyCBTest = function(data){
        console.log("returning leveldb buy orders");
        console.log(JSON.stringify(data));
      }
      //BlkDB.getOrdersBuy(myOrdersBuyCBTest);
      BlkDB.getOrdersBuySorted(myOrdersBuyCBTest);
      BlkDB.getOrdersSellSorted(myOrdersBuyCBTest);
      log("---------------");
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
      //possibly needs a callback
      BlkDB.clearDatabase();//Not implemented yet
      log(chalk.red("| Database has been deleted.   |"));
      log(chalk.green("| Synchronizing with network...|"));
      log(chalk.yellow("|------------------------------|"));
      //process.exit();
      var reindexChain = function(peers){
        for (let id in peers) {
          log("------------------------------------------------------");
          log(chalk.green("Sending ping for chain sync."));
          log("------------------------------------------------------");
          peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
        }
      }
      setTimeout(function(peers){reindexChain(peers);},200)
    }else if(userInput == "SS"){//open function right now
      console.log("----------------------------");

      var chainRiserStream = function(data){
        console.log("if hex works only top 10 "+data.toString())
      }
      var currentHeight = function(val){
        console.log(val);
        BlkDB.getBlockRange(val,parseInt(frankieCoin.chainRiser),chainRiserStream)
      }
      BlkDB.getChainStateParam("blockHeight",currentHeight);



      //BlkDB.getBlockchain(99,callBackEntireDatabase);
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
      log("HASHING THIS TEXT: "+hashText);
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
      ////frankieCoin.createOrder(new sapphirechain.Order('0x0666bf13ab1902de7dee4f8193c819118d7e21a6','BUY','SFRXEGEM',3500,0.25));
      ////Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pair":"SFRXEGEM","price":1.38,"ticker":"EGEM"});
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
      BlkDB.addOrder("ox:"+action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
      cliGetInput();
    }else if(isJSON(userInput)){//ORDER JSON style strait to order DB ^^ merging with above
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(userInput)["fromAddress"])){//adding function capabilioties
        //Order({"maker":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","action":"BUY","amount":24,"pairBuy":"EGEM","price":1.38,"pairSell":"SFRX"});
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
        BlkDB.addOrder("ox:"+action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
        //{"order":{"id":null,"fromAddress":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","buyOrSell":"SELL","pairBuy":"EGEM","pairSell":"SFRX","amount":"300","price":"26.00"}}

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

////////////////////////////////////////////////////chain walker synchtonisation

///////walks the chain from the start block verfying hashes and db records
var chainWalker = function(start,callback){
  var escape = false;
  var interCallBack = function(responder){
    if(!isJSON(responder)){
      if(responder.split(":")[1] == "NotFoundError"){
        escape = true;
      }
    }
    console.log("inter callback called")
    callback(responder)
  }
  for(var i=start;i<frankieCoin.chainRiser;i++){
    if(escape == false){
      BlkDB.getBlock(i,interCallBack)
      console.log("current block was "+i);
    }else{
      console.log("escape clause enacted on block"+i);
    }
  }
}
////////////////////////////////////////////////end chain walker synchronisation

//have to load the first block into local database
BlkDB.addBlock(1,JSON.stringify(frankieCoin.getLatestBlock()),"759");
BlkDB.addChainParams(globalGenesisHash+":blockHeight",1);
//BlkDB.addChainState("cs:blockHeight",1);//NEVER LOAD THIS HERE IT DEFEATS THE WHOLE PURPOSE
BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);
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
  BlkDB.addNode("node:"+nodesInChain[node]["id"]+":peerBlockHeight",peerLength);
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
  //console.log("chain grab callback...")
  //log('got data: '+data.toString());//test for input

  for (obj in data){
    //log("BLOCK CHAIN SYNCH "+JSON.stringify(data[obj]["blocknum"]));//verbose
    //console.log("blockdata coming inbound "+JSON.parse(data[obj])["blockHeight"]+" vs memory "+JSON.stringify(frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"])))//verbose
    //verify block does not exist in memory
    if(typeof frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"]) === "undefined" || frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"]) === null){
      //block not in memory
      console.log("block does not exist "+data[obj]);
      var tempBlock = data[obj];
      frankieCoin.addBlockFromDataStream(tempBlock,"sending in block "+JSON.parse(tempBlock)["blockHeight"]);
      frankieCoin.blockHeight = parseInt(JSON.parse(tempBlock)["blockHeight"]);
    }else{
      //block existed
      log("block exists in chain data: "+JSON.parse(data[obj])["blockHeight"]);
    }
    blockHeightPtr++;
  }
  log(chalk.blue("BlocHeightPtr: "+ chalk.green(blockHeightPtr)));
  //////////////////////////////////////////////////////////////////CHAIN VAIDATOR
  var cbBlockChainValidatorStartUp = function(isValid,replyData,replyHash){
    if(isValid == true){
      if(chainState.chainWalkHeight == replyData){
        console.log("this point was already reached which means its stuck here ...pinging");
        for (let id in peers) {
          log("------------------------------------------------------");
          log(chalk.green("Sending ping for chain sync."));
          log("------------------------------------------------------");
          //peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(replyData),GlobalHash:globalGenesisHash}}));
        }
      }
      chainState.chainWalkHeight = replyData;
      chainState.chainWalkHash = replyHash;

      if( (parseInt(replyData) == parseInt(chainState.chainWalkHeight)) && (parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight)) ){
        console.log("do we even enter (load)?");
        chainState.synchronized = parseInt(replyData);
      }else{
        console.log("do we enter the else ?");
        console.log(parseInt(replyData) == parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight));
        console.log("AND THE VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
      }
      console.log("VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
      console.log("BLOCK HEIGHT VALIDATED TO "+replyData,replyHash);
      //set the chain state validated height;
    }else{
      console.log("NOT VALID NEED TO PING AT "+replyData);
      //set ping here
      for (let id in peers) {
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync."));
        log("------------------------------------------------------");
        //peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(replyData),GlobalHash:globalGenesisHash}}));
      }
    }
  }
  /////////////////////////////////////////////////////////////END CHAIN VALIDATOR
  setTimeout(function(){
    //console.log(frankieCoin.blockHeight);
    if(frankieCoin.blockHeight > 1){
      BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(frankieCoin.blockHeight),cbBlockChainValidatorStartUp,chainState.chainWalkHash);

    }
  },1000);
  //this is where we call a function with the blockHeight pointer that finds out the peerBlockHeight and then download missing data
  /***
  for (let id in peers) {
    //chain sync ping
    peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),GlobalHash:globalGenesisHash}}));
  }
  //finally we set the RPC block which is updated by peer synch processes
  //this is where we SUBMIT WORK leaving it to eeror right now
  log("------------------------------------------------------");
  log(chalk.green("CALLING SUBMIT BLOCK"));
  log("------------------------------------------------------");
  ***?

  /*****
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
  *****/
  BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(frankieCoin.blockHeight));
  BlkDB.addChainState("cs:blockHeight",parseInt(frankieCoin.blockHeight));
  console.log("about to send this to rpc "+JSON.stringify({block:frankieCoin.getLatestBlock()}))
  rpcserver.postRPCforMiner({block:frankieCoin.getLatestBlock()});

  //need to open back up synching
  isSynching = false;

};
//a function call for datastore
function ChainGrab(blocknum){
  //BlockchainDB.getBlockchain(99,cbChainGrab);
  //BlkDB.getBlockchain(99,cbChainGrab,globalGenesisHash)
  var currentHeight = function(val){
    console.log(val);
    BlkDB.getBlockRange(val,frankieCoin.chainRiser,cbChainGrab)
  }
  BlkDB.getChainStateParam("blockHeight",currentHeight);
  //maybe some other stuff like .then
};
function ChainGrabRefresh(blocknum,cbChainGrab,chainRiser){
  //BlockchainDB.getBlockchain(99,cbChainGrab);
  console.log("called chain grab refresh with "+blocknum+cbChainGrab+chainRiser)
  //BlkDB.getBlockchain(99,cbChainGrab,ggHash)
  BlkDB.getBlockRange(blocknum,chainRiser,cbChainGrab)
  //maybe some other stuff like .then
};
//and finally the actual call to function for synch
isSynching = true;
setTimeout(function(){ChainGrab();},3000);
//end by now we will know if synched or not and enable or disable mining
log("------------------------------------------------------")
log(chalk.green("CHAIN SYNCED"))
log("------------------------------------------------------")
/////////////////////////////////////////////////////////////END synch the chain

////////////////////////////////////////////////this is the functions for orders
var myTradeCallback = function(orig,data) {
  log('SELL TRADE ORDERS data: '+JSON.stringify(data));//test for input
  BlkDB.clearOrderById(orig["transactionID"],orig["timestamp"]);
  log('SELL TRADE ORDERS orig: '+JSON.stringify(orig));//test for input
  for (obj in data){
    BlkDB.clearOrderById(JSON.parse(data[obj])["transactionID"],JSON.parse(data[obj])["timestamp"]);
    log("this would be the transaction: ");
    log("BUYER "+orig["fromAddress"]+" OF "+orig["pairBuy"]+" QTY "+orig["amount"]+" FOR "+orig["price"]+" OF "+orig["pairBuy"]+" PER "+orig["pairSell"]+" txID "+orig["transactionID"]+" ORIGTX "+orig["originationID"]);
    log("SELLER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairSell"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" PER "+JSON.parse(data[obj])["pairSell"]+" txID "+JSON.parse(data[obj])["transactionID"]+" ORIGTX "+JSON.parse(data[obj])["originationID"]);

    if(parseInt(orig["amount"]) <= parseInt(data[obj]["amount"])){
      ///////////////////////////////////if the buy amount is less than the sell
      log("TRANSACTION: SELLER "+JSON.parse(data[obj])["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(orig["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(JSON.parse(data[obj])["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      log("TRANSACTION: BUYER "+orig["fromAddress"]+" to SELLER "+JSON.parse(data[obj])["fromAddress"]+" QTY "+parseFloat(JSON.parse(data[obj])["amount"]*JSON.parse(data[obj])["price"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(orig["fromAddress"], JSON.parse(data[obj])["fromAddress"], parseFloat(JSON.parse(data[obj])["amount"]*JSON.parse(data[obj])["price"]), orig["pairBuy"]));
      log("UNFILLED REPLACEMENT - SELLER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairSell"]+" QTY "+(parseFloat(JSON.parse(data[obj])["amount"]) - parseFloat(orig["amount"]))+" FOR "+JSON.parse(data[obj])["price"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" PER "+JSON.parse(data[obj])["pairSell"]);
      //log("UNFILLED REPLACEMENT ORDER: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "++ " OF "+orig["pairBuy"]);
      var newOrderAmpount = parseFloat(parseFloat(JSON.parse(data[obj])["amount"]) - parseFloat(orig["amount"]));
      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
      //and a new one gets open
      var replacementOrder = new sapphirechain.Order(
        JSON.parse(data[obj])["fromAddress"],
        'SELL',
        JSON.parse(data[obj])["pairBuy"],
        JSON.parse(data[obj])["pairSell"],
        newOrderAmpount,
        JSON.parse(data[obj])["price"],
        '',
        ''
      );
      frankieCoin.createOrder(replacementOrder,JSON.parse(data[obj])["originationID"]);
      //BlockchainDB.addOrder({order:replacementOrder});
      BlkDB.addOrder("ox:SELL"+":"+JSON.parse(data[obj])["pairBuy"]+":"+JSON.parse(data[obj])["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
    }else if (orig["amount"] > parseInt(JSON.parse(data[obj])["amount"])){
      log("TRANSACTION: SELLER "+JSON.parse(data[obj])["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseFloat(JSON.parse(data[obj])["amount"])+ " OF "+orig["pairBuy"]);
      frankieCoin.createTransaction(new sapphirechain.Transaction(JSON.parse(data[obj])["fromAddress"], orig["fromAddress"], parseFloat(orig["amount"]), orig["pairBuy"]));
      log("UNFILLED REPLACEMENT - SELLER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairSell"]+" QTY "+(parseFloat(orig["amount"]) - parseFloat(JSON.parse(data[obj])["amount"]))+" FOR "+JSON.parse(data[obj])["price"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" PER "+JSON.parse(data[obj])["pairSell"]);
      var newOrderAmpount = parseFloat(parseFloat(orig["amount"])-parseFloat(JSON.parse(data[obj])["amount"]));
      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
      var replacementOrder = new sapphirechain.Order(
        orig["fromAddress"],
        'BUY',
        orig["pairBuy"],
        orig["pairSell"],
        newOrderAmpount,
        orig["price"],
        '',
        ''
      );
      frankieCoin.createOrder(replacementOrder,orig["originationID"]);
      //BlockchainDB.addOrder({order:replacementOrder});
      BlkDB.addOrder("ox:BUY"+":"+orig["pairBuy"]+":"+orig["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
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
    //frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', data[obj]["fromAddress"], 20, "SFRX"));
    //BlockchainDB.buildTrade(data[obj],myTradeCallback);
    BlkDB.buildTrade(data[obj],myTradeCallback);

    BlkDB.clearOrderById(data[obj]["transactionID"]);//NOT YET IMPLEMENTED
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

    BlkDB.clearOrderById(data[obj]["transactionID"]);//NOT YET IMPLEMENTED
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
  var deletedOrdersBroadcast = function(deletedOrders){
    console.log("THIS IS WHAT I WULD BE BROADCASTING TO PEER FOR DELETED ORDERS");
    console.log({"deletableOrders":JSON.stringify(deletedOrders)});
    broadcastPeers({"deletableOrders":JSON.stringify(deletedOrders)});
  }
  //setTimeout(function(){BlkDB.callDeletedOrders(deletedOrdersBroadcast)},1000);
}
//parent communicator callback function sent to child below
var impcchild = function(childData,fbroadcastPeersBlock,sendOrderTXID,sendTXID){
  //log("------------------------------------------------------");
  //process.stdout.clearLine();
  //process.stdout.cursorTo(0);
  process.stdout.write(chalk.blue("Incoming data from child: "+chalk.green(childData)));

  if(isJSON(childData) && JSON.parse(childData)["createBlock"]){
    log(chalk.blue("Current prev hash is: "+chalk.green(frankieCoin.getLatestBlock().hash)+"\nIncoming block previous hash is: "+JSON.parse(childData)["createBlock"]["block"]["previousHash"]));

    if((frankieCoin.getLatestBlock().hash == JSON.parse(childData)["createBlock"]["block"]["previousHash"]) && JSON.parse(childData)["createBlock"]["block"]["timestamp"] != "1541437502148"){
      //block from miner is commmitted though internal miner - could chainge this to a direct call

      /****
      ///ORDERS
      log("PROCESS TRADES IN PEERS PROCESS TRADES IN PEERS")
      for(odr in frankieCoin.pendingOrders){
        if(frankieCoin.pendingOrders[odr]["buyOrSell"] == "BUY"){
          log(frankieCoin.pendingOrders[odr]["pairBuy"]);
          log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
          log(frankieCoin.pendingOrders[odr]["price"]);
          log(frankieCoin.pendingOrders[odr]["amount"]);
          log("Any Sell Orders with pricing less tha or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity requested");
          BlkDB.getOrdersPairBuy(frankieCoin.pendingOrders[odr]["pairBuy"],frankieCoin.pendingOrders[odr]["pairSell"],myCallbackBuy)
        }else if (frankieCoin.pendingOrders[odr]["buyOrSell"] == "SELL"){
          log(frankieCoin.pendingOrders[odr]["pairBuy"]);
          log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
          log(frankieCoin.pendingOrders[odr]["price"]);
          log(frankieCoin.pendingOrders[odr]["amount"]);
          log("Any BUY Orders with pricing greater than or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity offered");
          BlkDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],frankieCoin.pendingOrders[odr]["pairSell"],myCallbackSell)
        }
      }
      ///END ORDERS
      ****/

      ///ORDERS REWRITE
      log("PROCESS TRADES IN PEERS PROCESS TRADES IN PEERS");
      for(odr in frankieCoin.pendingOrders){
        console.log("these are already in the db so..... validate transact and update I guess")
        log(frankieCoin.pendingOrders[odr]["pairBuy"]);
        log(frankieCoin.pendingOrders[odr]["buyOrSell"]);
        log(frankieCoin.pendingOrders[odr]["price"]);
        log(frankieCoin.pendingOrders[odr]["amount"]);
        if(frankieCoin.pendingOrders[odr]["buyOrSell"] == "BUY"){

          var myCallbackBuySells = function(data,dataSells) {
            //log('BUY ORDERS: '+JSON.stringify(data));//test for input
            for (obj in data){
              log("--------------------------");
              log('BUY ORDER: '+JSON.stringify(JSON.parse(data[obj])));//test for input
              log("--------------------------");
              log("BUYER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" PER "+JSON.parse(data[obj])["pairSell"]+" timestamp "+JSON.parse(data[obj])["timestamp"]+" transactionID "+JSON.parse(data[obj])["transactionID"]);
              log(JSON.parse(data[obj])["amount"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" TO "+JSON.parse(data[obj])["fromAddress"]);
              log(parseFloat(JSON.parse(data[obj])["amount"]*JSON.parse(data[obj])["price"])+" OF "+JSON.parse(data[obj])["pairSell"]+" TO [SELLER]");
              //BlkDB.buildTrade(JSON.parse(data[obj]),myTradeCallback);

              for (objs in dataSells){
                log("--------------------------");
                log('BUY ORDER: '+JSON.stringify(JSON.parse(data[obj])));//test for input
                log("--------------------------");
                log('SELL ORDER: '+JSON.stringify(JSON.parse(dataSells[objs])));
                log("-----V-------------V------");
                if(parseFloat(JSON.parse(data[obj])["price"]) >= parseFloat(JSON.parse(dataSells[objs])["price"])){//buyer i higher or equal than the seller
                  log("------------<>-------------");
                  log("SELLER "+JSON.parse(dataSells[objs])["fromAddress"]+" OF "+JSON.parse(dataSells[objs])["pairBuy"]+" QTY "+JSON.parse(dataSells[objs])["amount"]+" FOR "+JSON.parse(dataSells[objs])["price"]+" PER "+JSON.parse(dataSells[objs])["pairSell"]+" timestamp "+JSON.parse(dataSells[objs])["timestamp"]+" transactionID "+JSON.parse(dataSells[objs])["transactionID"]);
                  log(JSON.parse(dataSells[objs])["amount"]+" OF "+JSON.parse(dataSells[objs])["pairBuy"]+" TO "+JSON.parse(dataSells[objs])["fromAddress"]);
                  log("BUYER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" PER "+JSON.parse(data[obj])["pairSell"]+" timestamp "+JSON.parse(data[obj])["timestamp"]+" transactionID "+JSON.parse(data[obj])["transactionID"]);
                  log(parseFloat(JSON.parse(dataSells[objs])["amount"]*JSON.parse(dataSells[objs])["price"])+" OF "+JSON.parse(dataSells[objs])["pairSell"]+" TO [SELLER]");
                  log("------------<>-------------");

                  //var replacementOrder = {};

                  //transaction A
                  var addressFrom = JSON.parse(dataSells[objs])["fromAddress"];
                  var addressTo = JSON.parse(data[obj])["fromAddress"];

                  if(parseFloat(JSON.parse(data[obj])["amount"]) >= parseFloat(JSON.parse(dataSells[objs])["amount"])){
                    var amount = parseFloat(JSON.parse(dataSells[objs])["amount"]);
                    /////////////////////////////////////replacement order buyer
                    /****
                    replacementOrder.buyOrSell = "BUY";
                    replacementOrder.fromAddress = JSON.parse(data[obj])["fromAddress"];
                    replacementOrder.amount = parseFloat(JSON.parse(data[obj])["amount"]) - parseFloat(JSON.parse(dataSells[objs])["amount"]);
                    replacementOrder.price = JSON.parse(data[obj])["price"];
                    replacementOrder.pairing = JSON.parse(data[obj])["pairing"];
                    replacementOrder.pairBuy = JSON.parse(data[obj])["pairBuy"];
                    replacementOrder.pairSell = JSON.parse(data[obj])["pairSell"];
                    replacementOrder.transactionID = JSON.parse(data[obj])["transactionID"];
                    replacementOrder.originationID = JSON.parse(data[obj])["originationID"];
                    ***/

                    var replacementOrder = new sapphirechain.Order(
                      JSON.parse(data[obj])["fromAddress"],
                      'BUY',
                      JSON.parse(data[obj])["pairBuy"],
                      JSON.parse(data[obj])["pairSell"],
                      parseFloat(JSON.parse(data[obj])["amount"]) - parseFloat(JSON.parse(dataSells[objs])["amount"]),
                      JSON.parse(data[obj])["price"],
                      '',
                      ''
                    );

                    frankieCoin.createOrder(replacementOrder,JSON.parse(data[obj])["originationID"]);
                    BlkDB.addOrder("ox:BUY"+":"+JSON.parse(data[obj])["pairBuy"]+":"+JSON.parse(data[obj])["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
                  }else{
                    var amount = JSON.parse(data[obj])["amount"];
                    ////////////////////////////////////replacement order seller
                    /***
                    replacementOrder.buyOrSell = "SELL";
                    replacementOrder.fromAddress = JSON.parse(dataSells[objs])["fromAddress"];
                    replacementOrder.amount = parseFloat(JSON.parse(dataSells[objs])["amount"]) - parseFloat(JSON.parse(data[obj])["amount"]);
                    replacementOrder.price = JSON.parse(dataSells[objs])["price"];
                    replacementOrder.pairing = JSON.parse(dataSells[objs])["pairing"];
                    replacementOrder.pairBuy = JSON.parse(dataSells[objs])["pairBuy"];
                    replacementOrder.pairSell = JSON.parse(dataSells[objs])["pairSell"];
                    replacementOrder.transactionID = JSON.parse(dataSells[objs])["transactionID"];
                    replacementOrder.originationID = JSON.parse(data[obj])["originationID"];
                    ***/
                    var replacementOrder = new sapphirechain.Order(
                      JSON.parse(dataSells[objs])["fromAddress"],
                      'SELL',
                      JSON.parse(dataSells[objs])["pairBuy"],
                      JSON.parse(dataSells[objs])["pairSell"],
                      parseFloat(JSON.parse(dataSells[objs])["amount"]) - parseFloat(JSON.parse(data[obj])["amount"]),
                      JSON.parse(dataSells[objs])["price"],
                      '',
                      ''
                    );

                    frankieCoin.createOrder(replacementOrder,JSON.parse(dataSells[objs])["originationID"]);
                    BlkDB.addOrder("ox:SELL"+":"+JSON.parse(dataSells[objs])["pairBuy"]+":"+JSON.parse(dataSells[objs])["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
                  }

                  var ticker = JSON.parse(data[obj])["pairBuy"];
                  var myblocktx = new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker);
                  //does not work this way need tro rethink
                  //myblocktx.oxdid = JSON.parse(data[obj])["transactionID"];
                  //myblocktx.oxtid = JSON.parse(data[obj])["timestamp"];
                  console.log(JSON.stringify(myblocktx));
                  frankieCoin.createTransaction(myblocktx);

                  //transaction B
                  var addressFrom2 = JSON.parse(data[obj])["fromAddress"];
                  var addressTo2 = JSON.parse(dataSells[objs])["fromAddress"];
                  var amount2 = parseFloat(amount*JSON.parse(dataSells[objs])["price"]);

                  var ticker2 = JSON.parse(dataSells[objs])["pairSell"];
                  var myblocktx2 = new sapphirechain.Transaction(addressFrom2, addressTo2, amount2, ticker2);
                  //does not work this way need tro rethink
                  //myblocktx2.oxdid = JSON.parse(dataSells[objs])["transactionID"];
                  //myblocktx2.oxtid = JSON.parse(dataSells[objs])["timestamp"];
                  console.log(JSON.stringify(myblocktx2));
                  frankieCoin.createTransaction(myblocktx2);
                  ///////////////////////////////////REOG DELETE LOOP AND ORDERS
                  BlkDB.clearOrderById(JSON.parse(data[obj])["transactionID"],JSON.parse(data[obj])["timestamp"]);
                  BlkDB.clearOrderById(JSON.parse(dataSells[objs])["transactionID"],JSON.parse(dataSells[objs])["timestamp"]);
                  log("********************");
                  console.log(data.length+" "+obj+" "+dataSells.length+" "+objs);
                  data.splice(obj,1);
                  log("---DELETED CALLED---");
                  dataSells.splice(objs,1);
                  log("---DELETED CALLED---");
                  console.log(data.length+" "+obj+" "+dataSells.length+" "+objs);
                  log("********************");
                  //update the order in DB to partial
                  //////////////////////////////END REORG DELETE LOOP AND ORDERS
                  }
                  //just testing this out
                  //delete dataSells[objs];
                  //BlkDB.buildTrade(JSON.parse(data[obj]),myTradeCallback);
                }//end if price
              }
              //testing it
              //delete data[obj];
              log("--------------------------");
            }


          var myCallbackBuyPS = function(data) {
            log('BUY ORDERS: '+JSON.stringify(data));//test for input
            for (obj in data){

              log("BUYER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" PER "+JSON.parse(data[obj])["pairSell"]+" timestamp "+JSON.parse(data[obj])["timestamp"]+" transactionID "+JSON.parse(data[obj])["transactionID"]);
              log(JSON.parse(data[obj])["amount"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" TO "+JSON.parse(data[obj])["fromAddress"]);
              log(parseFloat(JSON.parse(data[obj])["amount"]*JSON.parse(data[obj])["price"])+" OF "+JSON.parse(data[obj])["pairSell"]+" TO [SELLER]");
              //BlkDB.buildTrade(JSON.parse(data[obj]),myTradeCallback);
            }
          };

          log("Any Sell Orders with pricing less tha or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity requested");
          BlkDB.getOrdersPairBuyAndSell(frankieCoin.pendingOrders[odr]["pairBuy"],frankieCoin.pendingOrders[odr]["pairSell"],myCallbackBuySells)

        }else if (frankieCoin.pendingOrders[odr]["buyOrSell"] == "SELL"){

          var myCallbackSellPS = function(data) {
            log('BUY ORDERS: '+JSON.stringify(data));//test for input
            for (obj in data){

              log("SELLER "+JSON.parse(data[obj])["fromAddress"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" QTY "+JSON.parse(data[obj])["amount"]+" FOR "+JSON.parse(data[obj])["price"]+" PER "+JSON.parse(data[obj])["pairSell"]+" timestamp "+JSON.parse(data[obj])["timestamp"]+" transactionID "+JSON.parse(data[obj])["transactionID"]);
              log(parseFloat(JSON.parse(data[obj])["amount"]*JSON.parse(data[obj])["price"])+" OF "+JSON.parse(data[obj])["pairSell"]+" TO "+JSON.parse(data[obj])["fromAddress"]);
              log(JSON.parse(data[obj])["amount"]+" OF "+JSON.parse(data[obj])["pairBuy"]+" TO [BUYER]");
              //BlkDB.buildTrade(data[obj],myTradeCallback);
            }
          };

          log("Any BUY Orders with pricing greater than or equal to "+frankieCoin.pendingOrders[odr]['price']+" up to the quantity offered");
          BlkDB.getOrdersPairSell(frankieCoin.pendingOrders[odr]["pairBuy"],frankieCoin.pendingOrders[odr]["pairSell"],myCallbackSellPS)

        }

      }

      //////////////going to have to make this sequential in a callback or chain
      franks.mpt3(JSON.parse(childData)["address"],JSON.parse(childData)["createBlock"]["block"]);
      BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"]);
      frankieCoin.hashOfThisBlock = sapphirechain.Hash(frankieCoin.hash+BlkDB.getStateTrieRootHash())+":"+frankieCoin.hash+":"+BlkDB.getStateTrieRootHash();
      ////////database update and peers broadcast
      log("[placeholder] mining stats from outside miner");
      //NOTE: there is time to modify the hash of the block before broadcast as opposed to using hashOfthisBlock for stateroot
      log("Outside Miner Mined Block Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
      /////////////////////////////////////////////////////block stored to level
      BlkDB.addBlock(parseInt(frankieCoin.blockHeight),JSON.stringify(frankieCoin.getLatestBlock()),"1475");
      BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(frankieCoin.blockHeight));
      BlkDB.addChainState("cs:blockHeight",parseInt(frankieCoin.blockHeight));
      ///////////////////////////////////////////////////////////peers broadcast
      fbroadcastPeersBlock();
      ////////////////////finally post the RPC get work block data for the miner
      rpcserver.postRPCforMiner({block:frankieCoin.getLatestBlock()});
    }

  }else if(isJSON(childData) && JSON.parse(childData)["getWorkForMiner"]){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(chalk.green("work returned to miner"));
    log(JSON.parse(childData)["getWorkForMiner"])
  }else if(isJSON(childData) && JSON.parse(childData)["getOrderBook"]){
    log("now we are gonna have some fun")
    impceventcaller("returning from function","maybe the calling peer is not necessary");
  }else if(isJSON(childData) && JSON.parse(childData)["getBalance"]){
    log("retrieving a balance for address provided...");
    log(JSON.parse(childData)["getBalance"]);
    log(JSON.parse(childData)["getBalance"]["address"]);
    //var getBalance3 = frankieCoin.getBalanceOfAddress(JSON.parse(childData)["getBalance"]["address"]);
    var returnAddressBalance = function(val){
      console.log("this address balance is ");
      console.log(chalk.green("------------------------"));
      for(x in val){
        console.log(chalk.yellow(x+": ")+val[x]);
      }
      console.log(chalk.green("------------------------"));
    }
    BlkDB.getBalanceAtAddress(JSON.parse(childData)["getBalance"]["address"],addyBal);

  }else if(isJSON(childData) && JSON.parse(childData)["transaction"]){
    log("Incoming Transaction over RPC");
    log(chalk.yellow(JSON.stringify(JSON.parse(childData)["transaction"]["txhash"])));
    var txhash = JSON.parse(childData)["transaction"]["txhash"];
    var txsignature = JSON.parse(childData)["transaction"]["signature"];
    var egemSendingAddress = web3.eth.accounts.recover(txhash,txsignature);
    log("This transaction was submitted by "+chalk.yellow(egemSendingAddress));
    impceventcaller("This transaction was submitted by "+egemSendingAddress)
  }else if(isJSON(childData) && JSON.parse(childData)["signedOrder"]){
    log("Incoming Order over RPC");
    log(chalk.yellow(JSON.stringify(JSON.parse(childData)["signedOrder"]["message"])));
    var order = JSON.stringify(JSON.parse(childData)["signedOrder"]["message"]);
    var orderFromAddy = JSON.stringify(JSON.parse(childData)["signedOrder"]["message"]["order"]);
    //order = order.replace(/['"/\\]+/g, '').replace('\"','');
    var txsignature = JSON.stringify(JSON.parse(childData)["signedOrder"]["signature"])
    console.log("order is "+order);
    console.log("order parsed "+JSON.parse(order));
    var parsedorder = JSON.parse(order);
    console.log("deep order "+JSON.parse(parsedorder)["order"]);
    var signedPackageOrder = JSON.parse(parsedorder)["order"];
    console.log("address is "+signedPackageOrder["fromAddress"]);


    var addressFrom = signedPackageOrder["fromAddress"];
    var buyOrSell = signedPackageOrder["buyOrSell"];
    var pairBuy = signedPackageOrder["pairBuy"];
    var pairSell = signedPackageOrder["pairSell"];
    var amount = signedPackageOrder["amount"];
    var price = signedPackageOrder["price"];
    var validatedSender = web3.eth.accounts.recover(JSON.parse(childData)["signedOrder"]["message"],JSON.parse(childData)["signedOrder"]["signature"]);
    if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
      ///need to alidate that this wallet has the funds to send
      myblockorder = new sapphirechain.Order(addressFrom,buyOrSell,pairBuy,pairSell,amount,price);
      frankieCoin.createOrder(myblockorder);
      BlkDB.addOrder("ox:"+buyOrSell+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp,myblockorder);
      console.log("This legitimate signed order by "+validatedSender+" has been posted to chain with confirmation "+myblockorder.transactionID);
    }else{
      console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
    }
    console.log("my confirmation to return "+myblockorder.transactionID);
    sendOrderTXID(myblockorder.transactionID);
    var peerOrder = JSON.parse(childData)["signedOrder"];
    peerOrder["transactionID"] = myblockorder.transactionID;
    peerOrder["originationID"] = myblockorder.originationID;
    peerOrder["timestamp"] = myblockorder.timestamp;
    broadcastPeers(JSON.stringify(peerOrder));
    //broadcastPeers(JSON.stringify({"message":order,"signature":txsignature,"transactionID":myblockorder.transactionID,"timestamp":myblockorder.timestamp}));
    //impceventcaller("This order and callback was submitted by "+egemSendingAddress)
  }else if(isJSON(childData) && JSON.parse(childData)["signedTransaction"]){
    log("Incoming Transaction over RPC");
    log(chalk.yellow(JSON.stringify(JSON.parse(childData)["signedTransaction"]["message"])));
    var tx = JSON.stringify(JSON.parse(childData)["signedTransaction"]["message"]);
    //order = order.replace(/['"/\\]+/g, '').replace('\"','');
    var txsignature = JSON.stringify(JSON.parse(childData)["signedTransaction"]["signature"])
    console.log("transaction is "+tx);
    console.log("transaction parsed "+JSON.parse(tx));
    var parsedtx = JSON.parse(tx);
    console.log("deep transaction "+JSON.parse(parsedtx)["send"]);
    var signedPackageTx = JSON.parse(parsedtx)["send"];
    console.log("address is "+signedPackageTx["from"]);


    var addressFrom = signedPackageTx["from"];
    var addressTo = signedPackageTx["to"];
    var amount = signedPackageTx["amount"];
    var ticker = signedPackageTx["ticker"];
    var validatedSender = web3.eth.accounts.recover(JSON.parse(childData)["signedTransaction"]["message"],JSON.parse(childData)["signedTransaction"]["signature"]);
    if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){
      ///need to alidate that this wallet has the funds to send
      var myblocktx = new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker);
      frankieCoin.createTransaction(myblocktx);
      console.log("This legitimate signed transaction by "+validatedSender+" has been posted");

    }else{
      console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
    }
    console.log("my confirmation to return "+"placeholder"+myblocktx.hash);
    sendTXID("placeholder"+myblocktx.hash);

    //prepped up using same format as order
    //var peerTx = JSON.parse(childData)["signedTransaction"];
    //peerTx["transactionID"] = myblockorder.transactionID;
    //peerTx["timestamp"] = myblockorder.timestamp;
    //broadcastPeers(JSON.stringify(peerTx));

    broadcastPeers(JSON.stringify(JSON.parse(childData)["signedTransaction"]));
    //impceventcaller("This order and callback was submitted by "+egemSendingAddress)
  }else{
    log("RCP commands were not properly formatted");
  }
}

//probably need to name this specific order methods
var impcMethods = function(datacall){
  return new Promise((resolve)=> {
    log(chalk.yellow("data calling in peer [this message is for dev]"));
    log(JSON.stringify(datacall));
    var dataBuySell = [];
    var myCallbackOrderBuy = function(data) {
      log('BUY ORDERS: '+JSON.stringify(data));//test for input
      //resolve(data);
      dataBuySell.push({"buy":data});
      BlkDB.getOrdersPairSell(datacall["tickerBuy"],datacall["tickerSell"],myCallbackOrderSell);
      //BlockchainDB.getOrdersPairSell(datacall["tickerBuy"],myCallbackOrderSell);
    };
    var myCallbackOrderSell = function(data) {
      log('SELL ORDERS: '+JSON.stringify(data));//test for input
      dataBuySell.push({"sell":data});
      resolve(dataBuySell);
    };
    BlkDB.getOrdersPairBuy(datacall["tickerBuy"],datacall["tickerSell"],myCallbackOrderBuy);
    //BlockchainDB.getOrdersPairBuy(datacall["tickerBuy"],myCallbackOrderBuy);
  })
}

var impcBalance = function(addr,cbBalanceEvent){
  BlkDB.getBalanceAtAddress(addr,cbBalanceEvent);
}

var impceventcaller;
var impcevent = function(callback){
    //sets the impcparent with the function from parent
    impceventcaller = callback;
}
//initialize the child with the parent communcator call back function
rpcserver.globalParentCom(impcchild,broadcastPeersBlock);
rpcserver.globalParentEvent(impcevent);
rpcserver.globalParentComMethods(impcMethods,impcBalance);
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
