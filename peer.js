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
var assert = require('assert');
const defaults = require('dat-swarm-defaults');
const readline = require('readline');
const getPort = require('get-port');
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://lb.rpc.egem.io"));
var bitcoin  = require('bitcoinjs-lib');
var bitcoinMessage = require('bitcoinjs-message');
var cs = require('coinstring');
const ecies = require('standard-ecies');
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
//chainState.version = "alpha.0.0.1"
chainState.chainWalkHeight = 1;
chainState.chainWalkHash = '7e3f3dafb632457f55ae3741ab9485ba0cb213317a1e866002514b1fafa9388f';//block 1 hash
chainState.synchronized = 1;//when we are synched at a block it gets updated
chainState.topBlock = 0;
chainState.checkPointHash;
chainState.previousBlockCheckPointHash = {};
chainState.currentBlockCheckPointHash = {};
chainState.datapack = "";
chainState.nodePersistantId;
chainState.peerNonce = 0;
//now adding parameters for transactions
chainState.transactionHeight = 0;
chainState.transactionRootHash = '';
//activesynch
chainState.interval = 10000;
chainState.activeSynch;

//activeping process that keeps in touch with other nodes and synch based on isSynching
var activeSync = function(timer){
  console.log(chalk.bgRed("AS TIMER "+timer))
  console.log(chalk.bgRed("------------------------------------------------------------------"));
  console.log(chalk.bgCyan.black(" chainwalkht: ")+chalk.bgMagenta(parseInt(chainState.chainWalkHeight+1))+chalk.bgCyan.black(" chainStateSynchronized: ")+chalk.bgMagenta(chainState.synchronized)+chalk.bgCyan.black(" blockchainht: ")+chalk.bgMagenta(frankieCoin.blockHeight));
  console.log(chalk.bgCyan.black(" cspeernonce: ")+chalk.bgMagenta(parseInt(chainState.peerNonce))+chalk.bgCyan.black(" transactionheight: ")+chalk.bgMagenta(chainState.transactionHeight)+chalk.bgCyan.black(" topblockheight: ")+chalk.bgMagenta(chainState.topBlock));
  console.log(chalk.bgCyan.black(" fcnlongpeer: ")+chalk.bgMagenta(parseInt(frankieCoin.longestPeerBlockHeight))+chalk.bgCyan.black(" transactionheight: ")+chalk.bgMagenta(chainState.transactionHeight)+chalk.bgCyan.black(" topblockheight: ")+chalk.bgMagenta(chainState.topBlock));

  setTimeout(function(){
    BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,107);
  },timer)

}

var tranSynch = function(){
  var startEnd = parseInt(chainState.transactionHeight+1);
  var topEnd = parseInt(startEnd+500);
  console.log("want to call TXVLDY with "+topEnd+" and "+chainState.synchronized)
  if(topEnd >= chainState.synchronized){
    topEnd = chainState.synchronized
  }

  transactionValidator(parseInt(startEnd),parseInt(topEnd));
}

//maybe turn slowCounter into chainstate var
var slowCounter = 0;
var adjustedTimeout = function() {
  var timerInterval = 223;
  frankieCoin.isChainSynch(chainState.synchronized)
  if(slowCounter == 0){
    console.log("calling active sync with issynching = "+isSynching+" and chainstate.issynching = "+chainState.isSynching);
    console.log("calling active sync with chainState.peerNonce = "+chainState.peerNonce+" and chainState.synchronized = "+chainState.synchronized);
    activeSync(parseInt(timerInterval+(slowCounter*79)));
    //activePing();
    slowCounter++;
  }else if((slowCounter % 4) == 0){//need a different trigger for transaction sync but for now ok
    tranSynch();
    slowCounter++;
  }else if(chainState.peerNonce < chainState.synchronized){
    console.log("calling active sync with issynching = "+isSynching+" and chainstate.issynching = "+chainState.isSynching);
    console.log("calling active sync with chainState.peerNonce = "+chainState.peerNonce+" and chainState.synchronized = "+chainState.synchronized);
    activeSync(parseInt(timerInterval+(slowCounter*81)));
    activePing(parseInt(timerInterval+(slowCounter*43)));
  }else if(isSynching == false && chainState.isSynching == false && slowCounter < 10){
    console.log("calling active sync with issynching = "+isSynching+" and chainstate.issynching = "+chainState.isSynching);
    console.log("calling active sync with chainState.peerNonce = "+chainState.peerNonce+" and chainState.synchronized = "+chainState.synchronized);
    activeSync(parseInt(timerInterval+(slowCounter*110)));
    activePing(parseInt(timerInterval+(slowCounter*101)));
    slowCounter++;
  }else{
    tranSynch();
    if((slowCounter % 4) == 0){
      activeSync(parseInt(timerInterval+(slowCounter*100)));
      activePing(parseInt(timerInterval+(slowCounter*100)));
    }
    slowCounter++;
    //console.log("chain is not synching so is it sync? ")
  }
  console.log("synching again in "+chainState.interval)
  setTimeout(adjustedTimeout, chainState.interval);
  if(slowCounter == 14){
    slowCounter = 1;
  }
}
setTimeout(adjustedTimeout, chainState.interval);

var activePing = function(timer){
  //we should get longestPeer first
  console.log(chalk.bgRed("AP TIMER "+timer))
  var nodesInChain = frankieCoin.retrieveNodes();
  for (let id in peers) {
    if(peers[id].conn != undefined){
      //log("------------------------------------------------------");
      //log(chalk.green("Sending ping for peer id "+id));
      //log("------------------------------------------------------");

      setTimeout(function(){
        peers[id].conn.write(JSON.stringify({"nodeStatePing":{Height:parseInt(chainState.synchronized),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash,checkPointHash:chainState.checkPointHash,currentBlockCheckPointHash:chainState.currentBlockCheckPointHash}}));
      },timer)

    }
  }
  //console.log(nodesInChain);
  var longestPeer = 0;
  for(node in nodesInChain){
    if(parseInt(nodesInChain[node]["info"]["chainlength"]) > longestPeer){

      /****
      console.log("                  ")
      console.log("   this a node    ")
      console.log("     -------      ")
      console.log(JSON.stringify(nodesInChain[node]))
      console.log("     -------      ")
      console.log("   was  a node    ")
      console.log("                  ")
      ****/

      longestPeer = parseInt(nodesInChain[node]["info"]["maxHeight"]);
      chainState.peerNonce = longestPeer;
      frankieCoin.longestPeerBlockHeight = longestPeer;
    }
  }
  if(chainState.synchronized >= longestPeer){
    //console.log("chain state synchronized "+chainState.synchronized);
    //console.log("longest peer "+longestPeer);
    //console.log("peer appears to be synched or ahead of network")
  }
  if(chainState.isSynching = false){//keep in touch
    //console.log("is synching is FALSE");
    for(peer in frankieCoin.nodes){

    }
  }else{

  }
}

var calculateCheckPoints = async function(blockNum,source,incomingCheckHash){

    if(blockNum > frankieCoin.chainRiser){

      var riserOffset = (parseInt(blockNum) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
      var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
      checkPointBlock = JSON.stringify(checkPointBlock);
      console.log("CALCULATED CHECK POINT IS "+JSON.parse(checkPointBlock)["blockHeight"]+" Hash "+JSON.parse(checkPointBlock)["hash"]);

      var blockNumHash = JSON.parse(JSON.stringify(frankieCoin.getBlock(blockNum)))["hash"];
      //var blockNumHash = await JSON.parse(BlkDB.getBlock(blockNum))["hash"];
      //console.log("blockNumHash: "+blockNumHash);

      var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);

      if(source == "miner"){
        chainState.previousBlockCheckPointHash = chainState.currentBlockCheckPointHash;
        chainState.currentBlockCheckPointHash = {"blockNumber":blockNum,"checkPointHash":thisBlockCheckPointHash};
        return 1;
      }else if(source == "peer" && incomingCheckHash.split(":")[0] == blockNum && incomingCheckHash.split(":")[1] == thisBlockCheckPointHash){
        chainState.previousBlockCheckPointHash = chainState.currentBlockCheckPointHash;
        chainState.currentBlockCheckPointHash = {"blockNumber":blockNum,"checkPointHash":thisBlockCheckPointHash};
        return 1;
      }else{
        return 2;
      }

      //console.log(JSON.stringify(chainState.previousBlockCheckPointHash))
      //console.log(JSON.stringify(chainState.currentBlockCheckPointHash));

  }else{

    console.log("INCOMING INFORMATION FOR CALC CHK POINTS ************************************");
    console.log(source+incomingCheckHash);
    console.log("INCOMING INFORMATION FOR CALC CHK POINTS ************************************");

    if(blockNum > 1){
      var lastBLockNumber = frankieCoin.getLatestBlock()["blockHeight"];
      var blockNumHash = JSON.parse(JSON.stringify(frankieCoin.getLatestBlock()))["hash"];
      //console.log(lastBLockNumber+blockNum);
    }else{
      var blockNumHash = '7e3f3dafb632457f55ae3741ab9485ba0cb213317a1e866002514b1fafa9388f';
    }
    var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+"0000000000000000000000000000000000000000000000000000000000000000");
    chainState.previousBlockCheckPointHash = chainState.currentBlockCheckPointHash;
    chainState.currentBlockCheckPointHash = {"blockNumber":blockNum,"checkPointHash":thisBlockCheckPointHash};
    return 1;
    //0000000000000000000000000000000000000000000000000000000000000000
  }

}

var setChainStateTX = async function(validTXHeight,transationCheckPointHash){
  console.log(chalk.bgGreen.black("setting chain state height to "+validTXHeight+" with hash of "+transationCheckPointHash));
  chainState.transactionHeight = await parseInt(validTXHeight);
  chainState.transactionRootHash = await transationCheckPointHash;
  if(validTXHeight > 1){//otherwise it resets a memory load when it loads block 1
    BlkDB.addChainState("cs:transactionHeight",chainState.transactionHeight+":"+transationCheckPointHash);
  }
  //BlkDB.addChainState("cs:transactionHeight",chainState.transactionHeight+":"+transationCheckPointHash);
  /***
  if(isNaN(isValidTXHeight)){
    console.log("transaction validation returned NaN");
  }else{

  }
  ***/
}

var getChainState = function(){
  return chainState;
}
sapphirechain.setChainState(getChainState);
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
var getConnectionConfig = async function(ntwk){
  return new Promise(function(resolve, reject) {
    var callBackNodePersistence = function(npid){
      myLastSessionId = npid;
      console.log("my last session = "+myLastSessionId);
      if(myLastSessionId != "notfound"){
        chainState.nodePersistantId = myLastSessionId;
        console.log("node persistantce was already set ")
      }else{
        chainState.nodePersistantId = crypto.randomBytes(32);
        BlkDB.addChainParams(globalGenesisHash+":nodePersistantId",chainState.nodePersistantId);
      }
      //network related connections
      const config = defaults({
        // peer-id
        id: chainState.nodePersistantId,
      })

      const ntwk = swarm(config);
      resolve(ntwk);
    }
    BlkDB.getChainParamsByName(globalGenesisHash,'nodePersistantId',callBackNodePersistence);
  })
}

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
var cbBlockChainValidatorStartUp = function(isValid,replyData,replyHash){

  console.log(chalk.bgRed(replyData+" << replydata and then replyhash >> "));

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
      chainState.synchronized = parseInt(replyData);
    }else{
      //console.log(parseInt(replyData) == parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight));
      //console.log("AND THE VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
    }
    //console.log("VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
    //console.log("BLOCK HEIGHT VALIDATED TO (CW STARTUP VERSION) "+replyData,replyHash);
    //set the chain state validated height;
    //now that we are valid we are going to check 3 blocks back to see if it is a candidate for chain state
    //console.log("TRUE OR FALSE? "+parseInt(replyData)+" "+(parseInt(replyData) > 3)+" "+(parseInt(replyData - 3))+" "+parseInt(frankieCoin.chainRiser))
    if( parseInt(replyData) > 3 && (parseInt(replyData - 3) % parseInt(frankieCoin.chainRiser)) == 0 ){
      var checkPoint = parseInt(replyData - 3);
      var pongBackBlock = function(blockData){
        //console.log("in pong back block");
        //console.log("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"]);
        BlkDB.addChainState("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"],JSON.parse(blockData)["hash"]);
        chainState.checkPointHash = "cs:"+checkPoint+":"+JSON.parse(blockData)["hash"];
      }
      BlkDB.getBlock(parseInt(checkPoint),pongBackBlock);
    }

    ////this does se the params
    /***
    console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
    console.log("                STREAM UP CHAIN STATS:             ");
    console.log("                                                    ");
    console.log("  frankieCoin.blockHeight: "+frankieCoin.blockHeight);
    console.log("  chainState.chainWalkHeight: "+chainState.chainWalkHeight);
    console.log("  chainState.isSynching: "+chainState.isSynching);
    console.log("  chainState.chainWalkHeight: "+chainState.chainWalkHeight);
    console.log("  chainState.chainWalkHash: "+chainState.chainWalkHash);
    console.log("  chainState.synchronized: "+chainState.synchronized);
    console.log("  chainState.topBlock: "+chainState.chainWalkHeight);
    console.log("  chainState.chainStateHash: "+JSON.stringify(chainState.previousBlockCheckPointHash));
    console.log("  chainState.chainStateHash: "+JSON.stringify(chainState.currentBlockCheckPointHash));
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
    console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
    ***/

    if(chainState.chainWalkHeight == parseInt(frankieCoin.blockHeight-1)){
      calculateCheckPoints(
        parseInt(frankieCoin.blockHeight-1),
        'miner',
        ''
      ).then(function(response,err){
        if(err){
          console.log(err);
        }else if(response == 2){
          console.log("streamed in chain state response NOT NORMAL "+response);
        }
      });
    }else if(chainState.chainWalkHeight == frankieCoin.blockHeight){
      calculateCheckPoints(
        frankieCoin.blockHeight,
        'miner',
        ''
      ).then(function(response,err){
        if(err){
          console.log(err);
        }else if(response == 2){
          console.log("streamed in chain state response NOT NORMAL "+response);
        }
      });
    }
    //end this does set the params

    //set the chain state validated height;
  }else{

    if(isNaN(replyData)){
      console.log("NaN chain walk height is "+chainState.chainWalkHeight)
    }
    console.log("NOT VALID NEED TO PING AT "+replyData+typeof(replyData));
    if(parseInt(replyData) > 2){

      var clipHeight = parseInt(replyData-3)
      chainClipperReduce(frankieCoin.blockHeight,clipHeight).then(function(){
        console.log("clipped chain to "+clipHeight+" restart to reindex")
        chainState.chainWalkHeight = clipHeight;
        chainState.synchronized = clipHeight;
        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,416);
      });

    }

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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//////////////////////////////////////////////////////////////////CHAIN VAIDATOR
var cbBlockChainValidator = function(isValid,replyData,replyHash){

  if(isValid == true){

    if(chainState.chainWalkHeight == replyData){
      console.log("this point was already reached which means its stuck here ...pinging");
      for (let id in peers) {
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync."));
        log("------------------------------------------------------");
        //peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
      }
    }

    chainState.chainWalkHeight = replyData;
    chainState.chainWalkHash = replyHash;

    console.log("VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);

    //i just set the chainWalkHeight from reply data so ofc that part is equal verify why written this way
    if( (parseInt(replyData) == parseInt(chainState.chainWalkHeight)) && (parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight) ) ){
      console.log("do we even enter (load)?");
      //BlkDB.addTransactionsFromStream(JSON.parse(blockData)["transactions"],JSON.parse(blockData)["hash"],JSON.parse(blockData)["blockHeight"])
      chainState.synchronized = parseInt(replyData);
    }else{
      console.log("do we enter the else ?");
      console.log(parseInt(replyData) == parseInt(chainState.chainWalkHeight) == parseInt(frankieCoin.blockHeight));
      console.log("AND THE VALUES "+replyData+" "+chainState.chainWalkHeight+" "+frankieCoin.blockHeight+" "+chainState.synchronized);
    }

    console.log(chalk.black.bgCyan("BLOCK HEIGHT VALIDATED TO (CW PEER VERSION)")+chalk.bgMagenta(replyData),chalk.bgBlue(replyHash));
    //now that we are valid we are going to check 3 blocks back to see if it is a candidate for chain state
    console.log("TRUE OR FALSE? "+parseInt(replyData)+" "+(parseInt(replyData) > 3)+" "+(parseInt(replyData - 3))+" "+parseInt(frankieCoin.chainRiser))
    if( parseInt(replyData) > 3 && (parseInt(replyData - 3) % parseInt(frankieCoin.chainRiser)) == 0 ){
      var checkPoint = parseInt(replyData - 3);
      var pongBackBlock = function(blockData){
        console.log("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"]);
        BlkDB.addChainState("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"],JSON.parse(blockData)["hash"]);
        chainState.checkPointHash = "cs:"+checkPoint+":"+JSON.parse(blockData)["hash"];
      }
      BlkDB.getBlock(parseInt(checkPoint),pongBackBlock);
    }

    //show params
    console.log(chalk.black.bgCyan("STREAM SYNC CHAIN STATS:"));
    console.log(chalk.bgBlue("frankieCoin.blockHeight: ")+chalk.black.bgCyan(frankieCoin.blockHeight));
    console.log(chalk.bgBlue("chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
    console.log(chalk.bgBlue("chainState.isSynching: ")+chalk.black.bgCyan(chainState.isSynching));
    console.log(chalk.bgBlue("chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
    console.log(chalk.bgBlue("chainState.chainWalkHash: ")+chalk.black.bgCyan(chainState.chainWalkHash));
    console.log(chalk.bgBlue("chainState.synchronized: ")+chalk.black.bgCyan(chainState.synchronized));
    console.log(chalk.bgBlue("chainState.topBlock: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
    console.log(chalk.bgBlue("chainState.chainStateHash: ")+chalk.black.bgYellow(JSON.stringify(chainState.previousBlockCheckPointHash)));
    console.log(chalk.bgBlue("chainState.chainStateHash: ")+chalk.black.bgYellow(JSON.stringify(chainState.currentBlockCheckPointHash)));

    if(chainState.chainWalkHeight == parseInt(frankieCoin.blockHeight-1)){
      calculateCheckPoints(
        parseInt(frankieCoin.blockHeight-1),
        'miner',
        ''
      ).then(function(response,err){
        if(err){
          console.log(err);
        }else{
          console.log("streamed sync chain state response normal "+response);
        }
      });
    }else if(chainState.chainWalkHeight == frankieCoin.blockHeight){
      calculateCheckPoints(
        frankieCoin.blockHeight,
        'miner',
        ''
      ).then(function(response,err){
        if(err){
          console.log(err);
        }else{
          console.log("streamed in chain state response normal "+response);
        }
      });
    }

    //set the chain state validated height;
  }else if(isValid == false && replyData == chainState.transactionHeight){

    console.log("CHAIN STATE HEIGHT IS "+replyData+typeof(replyData)+" and chainstate issynching = "+chainState.isSynching);

  }else{

    if(replyData == "NaN"){
      console.log("chain walk height is "+chainState.chainWalkHeight)
    }

    console.log("NOT VALID NEED TO PING AT "+replyData+typeof(replyData)+" and chainstate issynching = "+chainState.isSynching);

    //set ping here
    //var random = 0;//will randomize later
    var randomizer = peers.length;
    var random = getRandomInt(randomizer);
    var called = false;
    var i = 0;
    for(var j=0;j<peers.length;j++){
      if(peers[j].conn2 != undefined){
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync in cbBlockChainValidator top"));
        log("------------------------------------------------------");
        if(random == j && peers[j]){
          peers[j].conn2.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
          called = true;
        }
      }
    }
    for (let id in peers) {
      if(peers[id].conn2 != undefined){
        log("------------------------------------------------------");
        log(chalk.green("Sending ping for chain sync in cbBlockChainValidator bottom"));
        log("------------------------------------------------------");
        if(random == i && peers[id] && called == false){
          peers[id].conn2.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
          called = true;
        }else if(called == false && peers[id]){
          peers[id].conn2.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
          called = true;
        }
        i++;
      }
    }
  }
}
/////////////////////////////////////////////////////////////END CHAIN VALIDATOR

///////////////////////////////////////////////////////////TRANSACTION VQLIDATOR
var transactionValidator = async function(start,end){

  var cbCheckChainStateTX = async function(csTransactionHeight){


    if(csTransactionHeight == 0 || parseInt(csTransactionHeight.toString().split(":")[0]) < end){

      console.log("CALLED TXVLDY WITH "+start+" and "+end)
      if(start <= end){

        var incrementor = parseInt(start);
        console.log("TRANSACTION VALIDATION STARTING AT "+incrementor);
        var validateThisBlock = await function(){
          return new Promise((resolve)=> {
            var cbTxValidator = function(blockToValidate){
              console.log(blockToValidate.toString())
              resolve(blockToValidate.toString());
            }
            BlkDB.getBlock(incrementor,cbTxValidator)
          })
        }
        var thisOneBlock = await validateThisBlock();
        //console.log(thisOneBlock);

        var riserOffset = await (parseInt(incrementor) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain

        var returnCheckPointBlock = async function(checkPointBlock){
          var blockNumHash = await JSON.parse(checkPointBlock)["hash"];
          console.log("blockNumHash: "+blockNumHash);

          var thisBlockCheckPointHash = await sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);

          var updateChainStateTX = await function(isValidTXHeight,transationCheckPointHash){
            console.log(chalk.bgGreen.black("updating chain state height to "+isValidTXHeight));
            chainState.transactionHeight = parseInt(isValidTXHeight);
            chainState.transactionRootHash = transationCheckPointHash;
            BlkDB.addChainState("cs:transactionHeight",chainState.transactionHeight+":"+transationCheckPointHash);
            /***
            if(isNaN(isValidTXHeight)){
              console.log("transaction validation returned NaN");
            }else{

            }
            ***/
          }
          await BlkDB.addTransactionsFromStream(JSON.parse(thisOneBlock)["transactions"],JSON.parse(thisOneBlock)["hash"],JSON.parse(thisOneBlock)["blockHeight"],thisOneBlock,updateChainStateTX,thisBlockCheckPointHash)
          start++;
          if(start == end){
            console.log("break clause reached");
            return;
          }else{
            transactionValidator(start,end)
          }

        }

        BlkDB.getBlock(incrementor,returnCheckPointBlock);
        //console.log("CALCULATED CHECK POINT IS "+JSON.parse(checkPointBlock)["blockHeight"]+" Hash "+JSON.parse(checkPointBlock)["hash"]);
      }else{
        console.log("start was greater than end ?")
      }

    }else if(csTransactionHeight.split(":")[0] == end){
      console.log(csTransactionHeight);
    }

  }

  BlkDB.getChainStateParam("transactionHeight",cbCheckChainStateTX);

}
///////////////////////////////////////////////////////////TRANSACTION VALIDATOR

/////////////////////////////////////////////////////ENCRYPTED DIRECT MESSAGEING
var directMessage = function(secretMessage){

  secretPeerID = secretMessage.split(":")[0];//index of node to message
  secretPeerMSG = secretMessage.split(":")[1];
  secretAction = secretMessage.split(":")[2];//create Wallet
  encryptMessage = secretMessage.split(":")[3];//encrypted messages to this node public
  egemAccount = secretMessage.split(":")[4];
  rcvEgemAccount = secretMessage.split(":")[5];
  if(egemAccount){egemAccount = egemAccount.toLowerCase()};
  //if(rcvEgemAccount){rcvEgemAccount = rcvEgemAccount.toLowerCase()};

  //console.log("SECRET MESSAGE BEGINNINGS BRO "+secretPeerMSG);
  //for (let i in frankieCoin.nodes){

    var remotePeerNode = frankieCoin.nodes.filter(function(nodeUp) {
       return nodeUp.index == secretPeerID;
    });



    //console.log(JSON.parse(JSON.stringify(remotePeerNode))["index"])

    //var i = parseInt(secretPeerID);

    if(remotePeerNode[0]){

      //console.log(remotePeerNode);
      //console.log(remotePeerNode[0].index)

      var options = {
          hashName: 'sha256',
          hashLength: 32,
          macName: 'sha256',
          macLength: 32,
          curveName: 'secp256k1',
          symmetricCypherName: 'aes-256-ecb',
          iv: null, // iv is used in symmetric cipher, set null if cipher is in ECB mode.
          keyFormat: 'uncompressed',
          s1: null, // optional shared information1
          s2: null // optional shared information2
      }
      var ecdh = remotePeerNode[0].ecdh;
      var plainText = new Buffer.from('hello world');
      var encryptedText = ecies.encrypt(ecdh.getPublicKey(), plainText, options);
      //console.log("the public key to text hex "+ecdh.getPublicKey().toString("hex"));
      ecdhPubKeyHex = ecdh.getPublicKey().toString("hex");
      //console.log(encryptedText.toString("hex"));
      var decryptedText = ecies.decrypt(ecdh, encryptedText, options);
      //console.log(decryptedText.toString());
      encryptMessage =  new Buffer.from(encryptMessage)

      if(encryptMessage != ""){
        var peerPubKey = new Buffer.from(remotePeerNode[0]["publicPair"],"hex");
        //console.log("PEER PUB KEY "+peerPubKey);

        //console.log("whats up with JSON "+JSON.stringify(remotePeerNode));

        var encryptedMessageToSend = ecies.encrypt(peerPubKey,encryptMessage,options);
        encryptedMessageToSend = encryptedMessageToSend.toString("hex");
      }else{
        var encryptedMessageToSend = "nodata"
      }
      //going to need a peerPublicPair which is only after 2nd message


      //I am passing a peer safe initialization request
      peers[remotePeerNode[0].id].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:secretPeerMSG,secretAction:secretAction,egemAccount:egemAccount,rcvEgemAccount:rcvEgemAccount,encoded:encryptedMessageToSend,public:ecdhPubKeyHex}}));
      //broadcastPeers(JSON.stringify({peerSafe:{message:"SECRET MESSAGE BEGINNINGS BRO "+secretPeerMSG+encrypted.toString(hex)}}));
    }
  //}

  cliGetInput();

}
//////////////////////////////////////////////////END ENCRYPTED DIRECT MESSAGING

///////////////////////////////////////////////////////////////////CHAIN CLIPPER
var chainClipper = async function(blockHeight){//clip back to last riser from this height
  return new Promise(async function(resolve, reject) {

    var hairCut = (blockHeight % frankieCoin.chainRiser);
    var lastRiser = parseInt(blockHeight - hairCut)

    for(var i = blockHeight; i > lastRiser;i--){

        await BlkDB.removeBlock(i);
        await frankieCoin.chain.pop();
        console.log("FRANKIECOIN BLOCKNUM BEFORE REDUCE IS "+frankieCoin.blockHeight);
        frankieCoin.blockHeight-=1;
        chainState.chainWalkHeight = frankieCoin.blockHeight;
        chainState.chainWalkHash = await frankieCoin.getLatestBlock()["hash"];//block 1 hash
        chainState.synchronized = frankieCoin.blockHeight;//when we are synched at a block it gets updated
        chainState.topBlock = frankieCoin.blockHeight;
        var riserOffset = (parseInt(frankieCoin.blockHeight) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
        var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
        checkPointBlock = JSON.stringify(checkPointBlock);
        console.log("CALCULATED CHECK POINT IS "+JSON.parse(checkPointBlock)["blockHeight"]+" Hash "+JSON.parse(checkPointBlock)["hash"]);
        console.log("FRANKIECOIN BLOCKNUM AFTER REDUCE IS "+frankieCoin.blockHeight)
        var blockForHash = frankieCoin.getLatestBlock();
        console.log("BLOCK FOR HASH IS "+blockForHash);
        var blockNumHash = JSON.parse(JSON.stringify(blockForHash))["hash"];
        var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);
        chainState.previousBlockCheckPointHash = {"blockNumber":frankieCoin.blockHeight,"checkPointHash":thisBlockCheckPointHash};
        chainState.currentBlockCheckPointHash = {"blockNumber":frankieCoin.blockHeight,"checkPointHash":thisBlockCheckPointHash};

    }

    if(frankieCoin.blockHeight == lastRiser){
      resolve(lastRiser);
    }

  })
}
var chainClipperReduce = async function(blockHeight,hairCut){//clip back to last riser from this height
  return new Promise(async function(resolve, reject) {

    var reduction = parseInt(blockHeight - hairCut)
    var lastRiser = parseInt(blockHeight - reduction)

    for(var i = blockHeight; i > lastRiser;i--){

        await BlkDB.removeBlock(i);
        await frankieCoin.chain.pop();
        console.log("FRANKIECOIN BLOCKNUM BEFORE REDUCE IS "+frankieCoin.blockHeight);
        frankieCoin.blockHeight-=1;
        chainState.chainWalkHeight = frankieCoin.blockHeight;
        //chainState.chainWalkHash = await frankieCoin.getLatestBlock()["hash"];//block 1 hash
        chainState.synchronized = frankieCoin.blockHeight;//when we are synched at a block it gets updated
        chainState.topBlock = frankieCoin.blockHeight;
        //var riserOffset = (parseInt(frankieCoin.blockHeight) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
        //var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
        //checkPointBlock = JSON.stringify(checkPointBlock);
        //console.log("CALCULATED CHECK POINT IS "+JSON.parse(checkPointBlock)["blockHeight"]+" Hash "+JSON.parse(checkPointBlock)["hash"]);
        console.log("FRANKIECOIN BLOCKNUM AFTER REDUCE IS "+frankieCoin.blockHeight)
        //var blockForHash = frankieCoin.getLatestBlock();
        //console.log("BLOCK FOR HASH IS "+blockForHash);
        //var blockNumHash = JSON.parse(JSON.stringify(blockForHash))["hash"];
        //var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);
        //chainState.previousBlockCheckPointHash = {"blockNumber":frankieCoin.blockHeight,"checkPointHash":thisBlockCheckPointHash};
        //chainState.currentBlockCheckPointHash = {"blockNumber":frankieCoin.blockHeight,"checkPointHash":thisBlockCheckPointHash};

    }

    if(frankieCoin.blockHeight == lastRiser){
      resolve(lastRiser);
    }

  })
}
///////////////////////////////////////////////////////////////END CHAIN CLIPPER

const peers = {}
// Counter for connections, used for identify connections
let connSeq = 0
let connSeq2 = 0
//////////////////////////////////////////////////////core function asynchronous
;(async () => {
  const port = await getPort()//grab available random port for peer connections
  const port2 = await getPort()

  const sw = await getConnectionConfig(this);
  const sw2 = await getConnectionConfig(this);
  sw.listen(port)//peers
  sw2.listen(port2)
  sw.join('egem-sfrx-001') // can be any id/name/hash
  sw2.join('egem-sfrx-002')//second teier peers
  sw.maxConnections = 20;//testing this out for node organization

  //incoming connections from peers
  sw.on('connection', (conn, info) => {

    //log(chalk.blue(JSON.stringify(info)));
    const seq = connSeq
    const peerId = info.id.toString('hex');

    if(info.id != Buffer.from(chainState.nodePersistantId).toString('hex')){

      frankieCoin.registerNode(peerId,info.host,info.port,frankieCoin.length);
      BlkDB.addNode("node:"+peerId+":connection",{"host":info.host,"port":info.port}).then(function(){
        //log(chalk.green("Incoming Peer Info: "+ chalk.red(JSON.stringify(info))));
        log(chalk.bgBlue('New Peer id: '+ chalk.bold(peerId)));
        var tempNodeCallerID = sapphirechain.ReDuex(peerId);
        //console.log("tempcallerNodeid "+tempNodeCallerID);
        ///////////////WE MIGHT WANT TO RESERVE THE CALL BELOW FOR SYNCHED PEERS
        directMessage(tempNodeCallerID+':0:0:')//this is establishing the encryption to the peer

      });
    }

    conn.on('timeout', () => {
      console.log("timout for "+peerId)
    })

    conn.on('close', () => {
      /***
      setTimeout(function(){

        //going to set a node check variable that is not reactivated this node gets deleted

        // If the closing connection is the last connection with the peer, removes the peer
        if ((peers[peerId]) && peers[peerId].seq === seq) {
          // Here we handle peer disconnection
          log(chalk.blue("Connection"+ chalk.green(seq) + "closed, peer id: " + chalk.green(peerId)))
          frankieCoin.removeNode(peerId);
          delete peers[peerId]
        }

        connSeq--

      },3000)
      ***/
    })

    var incomingStream = "";
    var incomingBufferArray = [];

    conn.on('end',async function(){
      //console.log("data stream ended ");
      //setTimeout(function(){console.log("incoming buffer array is "+incomingBufferArray)},2000);

      //console.log("this is on end "+incomingStream);

      if(incomingStream.startsWith('{"blockHeight"}')){
        console.log("Importing the data stream to the db and calling the memory synch");
        //setTimeout(function(){BlkDB.importFromJSONStream(ChainGrabRefresh,parseInt(chainState.chainWalkHeight+1),cbChainGrab,frankieCoin.chainRiser,incomingStream);},2000);
        //setting this here and heed more intake checks

        BlkDB.importFromJSONStream(ChainGrabRefresh,parseInt(chainState.chainWalkHeight+1),cbChainGrab,frankieCoin.chainRiser,incomingStream);

        frankieCoin.blockHeight = parseInt(chainState.chainWalkHeight);
        //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
        var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
          setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
        }
      }



    });

    conn.on('readable',function(){
      //console.log("BLOCK STREAM "+this.readableHighWaterMark);

      let chunk;
      while (null !== (chunk = this.read())) {
        //console.log(`Received ${chunk.length} bytes of data.`);
        //console.log(chunk.toString());
        //console.log("<== ");
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
        //}else if(JSON.parse(data)["previousHash"]){/////////need more refinement
        //{checkPointHash:chainState.checkPointHash,currentBlockCheckPointHash:chainState.currentBlockCheckPointHash,block:frankieCoin.getLatestBlock()}
        }else if(JSON.parse(data)["checkPointHash"] && JSON.parse(data)["currentBlockCheckPointHash"] && JSON.parse(data)["block"]){


          var riserOffset = (parseInt(JSON.parse(data)["block"]["blockHeight"]) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain

          console.log("Riser OFFSET IS "+riserOffset);

          var checkPointBlockAtHeight = JSON.stringify(frankieCoin.getBlockFromIndex(parseInt(riserOffset)));

          console.log("check point block at height "+checkPointBlockAtHeight);
          //var checkPointBlockPlusOne = JSON.stringify(frankieCoin.getBlockFromIndex(parseInt(riserOffset-1)));///getCheckpoint
          //var checkPointBlockThreeBack = JSON.stringify(frankieCoin.getBlockFromIndex(parseInt(riserOffset-3)));

          console.log("CALCULATED CHECK POINT AT HEIGHT "+JSON.parse(checkPointBlockAtHeight)["blockHeight"]+" Hash "+JSON.parse(checkPointBlockAtHeight)["hash"]);
          //console.log("CALCULATED CHECK POINT PLUS ONE "+JSON.parse(checkPointBlockPlusOne)["blockHeight"]+" Hash "+JSON.parse(checkPointBlockPlusOne)["hash"]);
          //console.log("CALCULATED CHECK POINT THREE BACK "+JSON.parse(checkPointBlockThreeBack)["blockHeight"]+" Hash "+JSON.parse(checkPointBlockThreeBack)["hash"]);


          var blockNumHash = JSON.parse(data)["block"]["hash"];
          console.log("blockNumHash: "+blockNumHash);

          var thisBlockCheckPointHashAtHeight = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlockAtHeight)["hash"]);
          //var thisBlockCheckPointHashPlusOne = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlockPlusOne)["hash"]);
          //var thisBlockCheckPointHashThreeBack = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlockThreeBack)["hash"]);

          console.log("BLOCK CHECK POINT HASH AT HEIGHT "+thisBlockCheckPointHashAtHeight);
          //console.log("BLOCK CHECK POINT HASH PLUS ONE "+thisBlockCheckPointHashPlusOne);
          //console.log("BLOCK CHECK POINT HASH THREE BACK "+thisBlockCheckPointHashThreeBack);

          //calculate from this JSON.parse(data)["currentBlockCheckPointHash"]  and block data also
          if(JSON.parse(data)["block"]["chainStateHash"]["checkPointHash"] == chainState.currentBlockCheckPointHash.checkPointHash && JSON.parse(data)["checkPointHash"] == chainState.checkPointHash && JSON.parse(data)["currentBlockCheckPointHash"]["checkPointHash"] == thisBlockCheckPointHashAtHeight){

            console.log("VALID BLOCK MATCHING CALCULATED CHECK POINT HASHES")
            //if I log this information on the chain state I can see it quickly


            //storing some variables of current chain
            var currentChainHash = frankieCoin.getLatestBlock()["hash"];
            var incomingBLockHeight = JSON.parse(data)["block"]["blockHeight"];
            console.log("VVVVVVVVVVVVVVVVVVVVV        "+incomingBLockHeight+"        VVVVVVVVVVVVVVVVVVVV    ---->   "+frankieCoin.blockHeight);

            console.log("incoming blocknum "+JSON.parse(data)["block"]["chainStateHash"]["blockNumber"]+" incoming check point hash "+JSON.parse(data)["block"]["chainStateHash"]["checkPointHash"]);
            console.log("chain state previous "+JSON.stringify(chainState.previousBlockCheckPointHash));
            console.log("chain state current "+JSON.stringify(chainState.currentBlockCheckPointHash));

            if(incomingBLockHeight < frankieCoin.blockHeight){

              console.log(chalk.bgRed("         THIS BLOCK IS LOWER THAN EXPECTED!         "));
              console.log(chalk.bgRed("                                                    "));
              console.log(chalk.bgBlue("frankieCoin.blockHeight: ")+chalk.black.bgCyan(frankieCoin.blockHeight));
              console.log(chalk.bgBlue("chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
              console.log(chalk.bgBlue("chainState.isSynching: ")+chalk.black.bgCyan(chainState.isSynching));
              console.log(chalk.bgBlue("chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
              console.log(chalk.bgBlue("chainState.chainWalkHash: ")+chalk.black.bgCyan(chainState.chainWalkHash));
              console.log(chalk.bgBlue("chainState.synchronized: ")+chalk.black.bgCyan(chainState.synchronized));
              console.log(chalk.bgBlue("chainState.topBlock: ")+chalk.black.bgCyan(chainState.topblock));
              console.log(chalk.bgRed("                                                    "));
              //if(frankieCoin.blockHeight > frankieCoin.chainRiser){
                calculateCheckPoints(
                  frankieCoin.blockHeight,
                  'peer',
                  JSON.parse(data)["block"]["chainStateHash"]["blockNumber"]+":"+JSON.parse(data)["block"]["chainStateHash"]["checkPointHash"]
                ).then(function(response,err){
                  if(err){
                    console.log(err);
                  }else if(response == 2){
                    console.log("chain state response is not normal "+response);
                    var syncTrigger = {"syncTrigger":incomingBLockHeight,"submitCurrrentChainStateHash":JSON.parse(data)["block"]["chainStateHash"],"peerCurrentBlockCheckPointHash":chainState.currentBlockCheckPointHash}//chainState.currentBlockCheckPointHash
                    peers[peerId].conn.write(JSON.stringify(syncTrigger));
                    //peerId
                  }else{
                    console.log("chain state response "+response);
                  }
                });
              //}
            }else if(incomingBLockHeight > parseInt(frankieCoin.blockHeight+1)){/////need to move this below the block add and add the block differently to not mess with blockheight or txs
              console.log(chalk.bgCyan.red("*************   ***********   ***********   *********   **************"));
              console.log("WE ARE IGNORING INCOMING BLOCKS WHILE is synching is "+chainState.isSynching+" syncronized "+chainState.synchronized);
              console.log(chalk.bgCyan.red("*************   ***********   ***********   *********   **************"));
            }else{

              console.log(chalk.bgGreen("                THIS BLOCK CHAIN STATS:             "));
              console.log(chalk.bgGreen("                                                    "));
              console.log(chalk.bgBlue("  frankieCoin.blockHeight: ")+chalk.black.bgCyan(frankieCoin.blockHeight));
              console.log(chalk.bgBlue("  chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
              console.log(chalk.bgBlue("  chainState.isSynching: ")+chalk.black.bgCyan(chainState.isSynching));
              console.log(chalk.bgBlue("  chainState.chainWalkHeight: ")+chalk.black.bgCyan(chainState.chainWalkHeight));
              console.log(chalk.bgBlue("  chainState.chainWalkHash: ")+chalk.black.bgCyan(chainState.chainWalkHash));
              console.log(chalk.bgBlue("  chainState.synchronized: ")+chalk.black.bgCyan(chainState.synchronized));
              console.log(chalk.bgBlue("  chainState.topBlock: ")+chalk.black.bgCyan(chainState.topblock));
              console.log(chalk.bgGreen("                                                    "));

              //if(frankieCoin.blockHeight > frankieCoin.chainRiser){
                calculateCheckPoints(
                  frankieCoin.blockHeight,
                  'peer',
                  JSON.parse(data)["block"]["chainStateHash"]["blockNumber"]+":"+JSON.parse(data)["block"]["chainStateHash"]["checkPointHash"]
                ).then(function(response,err){
                  if(err){
                    console.log(err);
                  }else{
                    console.log("chain state response normal "+parseInt(response));

                    if(response == 1){

                      ///////////////NEED TO REMOVE ANY MATCHED PENDING TXS FROM MEME POOL
                      console.log("RRRRRRRRRRRRRRRRRRRRR  removing txs RRRRRRRRRRRRRRR");
                      console.log("RRRRRRRRRRRRRRRRRRRRR  removing txs RRRRRRRRRRRRRRR");
                      var incomingTx = JSON.parse(data)["block"]["transactions"];
                      var existingPendingTx = frankieCoin.pendingTransactions;
                      var replacementTx = [];
                      for(ptx in incomingTx){
                        //will be removed
                        console.log("before the processed order check");
                        if(incomingTx[ptx]["oxdid"]){
                          console.log("we are actually in the incoming tx looking at order id deletion")
                          BlkDB.clearOrderById(incomingTx[ptx]["oxdid"],incomingTx[ptx]["oxtid"]);
                        }
                        for(etx in existingPendingTx){
                          //adding logic to remove orders if ox id present
                          if(incomingTx[ptx]["hash"] == existingPendingTx[etx]["hash"]){

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
                      var incomingOx = JSON.parse(data)["block"]["orders"];
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
                      var successfulBlockAdd = frankieCoin.addBlockFromPeers(JSON.parse(data)["block"],sendBackUncle,peerId);

                      log(chalk.bgGreen("SUCCEFSSFUL BLOCK ADD? "+successfulBlockAdd));


                        //increment the internal peer nonce of sending party to track longest chain
                        frankieCoin.incrementPeerNonce(peerId,JSON.parse(data)["block"]["blockHeight"]);
                        BlkDB.addNode("node:"+peerId+":peerBlockHeight",JSON.parse(data)["block"]["blockHeight"]);
                        //logging the block added to chain for console
                        log(chalk.red("--------------------------------------------------------------------"));
                        //log(chalk.green("block added to chain: "+JSON.stringify(frankieCoin.getLatestBlock())));//verbose
                        log(chalk.green("block added to chain: "+JSON.stringify(JSON.parse(data)["block"]["blockHeight"])));
                        log(chalk.green("in prev hash: ")+JSON.parse(data)["block"]["previousHash"]+chalk.green(" <=> chain: ")+currentChainHash);
                        log(chalk.yellow("                     SUCESSFUL BLOCK FROM PEER                      "));
                        log(chalk.red("--------------------------------------------------------------------"));

                        var blockNum = JSON.parse(data)["block"]["blockHeight"];
                        //calculating this 2 times but needed at addBlock for transations to verify properly
                        var riserOffset = (parseInt(blockNum) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
                        var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
                        checkPointBlock = JSON.stringify(checkPointBlock);
                        var blockNumHash = JSON.parse(JSON.stringify(frankieCoin.getLatestBlock()))["hash"];
                        var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);
                        //end pre calculation

                        //////update the client database OR reject block and rollback the chain - code is incomplete atm
                        //add it to the database
                        BlkDB.addBlock(parseInt(JSON.parse(data)["block"]["blockHeight"]),JSON.stringify(JSON.parse(data)["block"]),JSON.parse(data)["block"]["hash"],"967",setChainStateTX,frankieCoin.chainRiser,JSON.parse(checkPointBlock)["hash"],thisBlockCheckPointHash);
                        BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(JSON.parse(data)["block"]["blockHeight"]));
                        BlkDB.addChainState("cs:blockHeight",parseInt(JSON.parse(data)["block"]["blockHeight"]));
                        BlkDB.addTransactions(JSON.stringify(JSON.parse(data)["block"]["transactions"]),JSON.parse(data)["block"]["hash"],parseInt(JSON.parse(data)["block"]["blockHeight"]),thisBlockCheckPointHash);
                        //add it to the RPC for miner
                        rpcserver.postRPCforMiner({block:JSON.parse(data)["block"]});

                        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,1112);

                        //miner call
                        calculateCheckPoints(frankieCoin.blockHeight,'miner','');

                    }else if(parseInt(response == 2)){

                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");
                      console.log("WARNING INCOMING PEER INFORMATION DID NOT MATCH CHAIN WEIGHT BAD WARNING");
                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");
                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");
                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");
                      console.log("WARNING INCOMING PEER INFORMATION DID NOT MATCH CHAIN WEIGHT BAD WARNING");
                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");
                      console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING: WARNING WARNING");

                    }

                  }
                });
              //}
            }


          }else{

            console.log("UNCLE OR ON WRONG CHAIN")
            var uncleReply = JSON.stringify({uncle:JSON.parse(data),chainState:chainState})
            sendbackUncle(uncleReply,peerId)
            //peers[peerId].conn.write(JSON.stringify(syncTrigger));
            //if I log this information on the chain state I can see it quickly

            ///this is how I did it BEFORE but in block.js and if we add a chain weight to it...
            //var tmpOmmer = new Ommer(inBlock.timestamp,inBlock.previousHash,inBlock.nonce,inBlock.hash,inBlock.miner,inBlock.sponsor)
            //this.addOmmer(tmpOmmer);
            //and return the last block to the sending peer...
            //callback({"uncle":{"blockNumber":parseInt(this.chain.length-1),"block":inBlock}},peerId);

          }



        }else if(JSON.parse(data)["syncTrigger"]){

          //isSynching = yes
          chainState.isSynching=true;
          console.log(chalk.bgRed(" DELETING BACK TO PREVIOUS CHECK POINT AND SYNC "+JSON.parse(data)["syncTrigger"]));
          console.log("SUBMITED "+JSON.parse(data)["syncTrigger"]["submitCurrrentChainStateHash"]+" PEER "+JSON.parse(data)["syncTrigger"]["peerCurrrentChainStateHash"])
          //var hairCut = (JSON.parse(data)["syncTrigger"] % frankieCoin.chainRiser);
          //var lastRiser = parseInt(JSON.parse(data)["syncTrigger"] - hairCut)
          chainClipper(JSON.parse(data)["syncTrigger"]).then(function(){
            BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,1145);
          });

          //setTimeout(function(){
          //  peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
          //},2000)
          //var deltaToRiser = parseInt(frankieCoin.chainRiser - )



        }else if(JSON.parse(data)["fromAddress"]){

          log("well, this is an order and we need to give it a transaction id when mined");

        }else if(JSON.parse(data)["uncle"]){

          log(chalk.bgBlue("THIS IS THE UNCLRE RETURN WE LOG THE OMMER AND DELETE"));
          log(data["uncle"]);

          //I have an uncle insert somewhere we maybe ned to insert it

          chainClipper(frankieCoin.blockHeight).then(function(){
            BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,2216);
          });
          //clipChainAt(parseInt(chainState.syncronized - 10))

        }else if(JSON.parse(data)["nodeStatePong"]){

          var nSPongPeercurrentCPH = JSON.stringify(JSON.parse(data)["nodeStatePong"]["currentBlockCheckPointHash"]);
          console.log("NODE STATE PONG "+JSON.parse(nSPongPeercurrentCPH)["blockNumber"]+" AND YOU "+chainState.synchronized)
          var nSPongPeerCPH = JSON.stringify(JSON.parse(data)["nodeStatePong"]["checkPointHash"]);
          if(nSPongPeerCPH != undefined){
            console.log("NODE STATE PONG CP "+nSPongPeerCPH.split(":")[0]+" AND HASH "+nSPongPeerCPH.split(":")[1]+" AND YOU "+chainState.checkPointHash)
          }

          if(JSON.parse(data)["nodeStatePong"]["GlobalHash"] == globalGenesisHash){//will add more to this
            frankieCoin.incrementPeerMaxHeight(peerId,JSON.parse(data)["nodeStatePong"]["MaxHeight"]);
            BlkDB.addNode("node:"+peerId+":MaxHeight",JSON.parse(data)["nodeStatePong"]["MaxHeight"]);
          }

        }else if(JSON.parse(data)["nodeStatePing"]){

          var nSPingPeercurrentCPH = JSON.stringify(JSON.parse(data)["nodeStatePing"]["currentBlockCheckPointHash"]);
          console.log("NODE STATE PONG "+JSON.parse(nSPingPeercurrentCPH)["blockNumber"]+" AND YOU "+chainState.synchronized)
          var nSPingPeerCPH = JSON.stringify(JSON.parse(data)["nodeStatePing"]["checkPointHash"]);
          if(nSPongPeerCPH != undefined){
            console.log("NODE STATE PONG CP "+nSPingPeerCPH.split(":")[0]+" AND HASH "+nSPingPeerCPH.split(":")[1]+" AND YOU "+chainState.checkPointHash)
          }

          if(JSON.parse(data)["nodeStatePing"]["GlobalHash"] == globalGenesisHash){//will add more to this
            frankieCoin.incrementPeerMaxHeight(peerId,JSON.parse(data)["nodeStatePing"]["MaxHeight"]);
            BlkDB.addNode("node:"+peerId+":MaxHeight",JSON.parse(data)["nodeStatePing"]["MaxHeight"]);
            peers[peerId].conn.write(JSON.stringify({"nodeStatePong":{Height:parseInt(chainState.synchronized),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash,checkPointHash:chainState.checkPointHash,currentBlockCheckPointHash:chainState.currentBlockCheckPointHash}}));
          }

        }else if(JSON.parse(data)["ChainSyncPing"]){

          //log(JSON.parse(data)["ChainSyncPing"]);
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
                  reqPeer.conn.write(JSON.stringify({pongBlockStream:datSynch,blockHeight:chainState.synchronized}));
                }
                //var cbGetSynch = function(datpeer){
                //  console.log("calling dat synch")
                //  DatSyncLink.synchDatabaseJSON(setDatSynch,datpeer);
                //}

                var cbGetStream = function(jsonStream,streamToPeerID){
                  console.log("the streams cb condition is met");
                  streamToPeerID.conn2.write(jsonStream);
                  //streamToPeerID.conn2.end();
                  //setting up some streams to try this out
                }
                //BlkDB.dumpDatCopy(cbGetSynch,peers[peerId]);
                //BlkDB.dumpToJsonFIle(cbGetSynch,peers[peerId]);
                if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 2500){
                  var numRecordsToStream = 2500;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 1000){
                  var numRecordsToStream = 1000;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 500){
                  var numRecordsToStream = 500;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 100){
                  var numRecordsToStream = 100;
                }else{
                  var numRecordsToStream = parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]);
                }
                //BlkDB.dumpToStreamFIleRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream)
                //var numRecordsToStream = parseInt(frankieCoin.synchronized);
                BlkDB.dumpToStreamBlockRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream).then(function(jsonStream){
                  peers[peerId].conn2.write(jsonStream);
                  //console.log("wrote this "+jsonStream);
                  //peers[peerId].conn2.end();
                  console.log("the streams then condition is met and num records to stream was "+numRecordsToStream);
                })

                setTimeout(function(){
                  BlkDB.dumpToStreamTXOXRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream).then(function(jsonStream){
                    peers[peerId].conn2.write(jsonStream);
                    //console.log("wrote this "+jsonStream);
                    peers[peerId].conn2.end();
                    console.log("the streams then condition is met and num records to stream was "+numRecordsToStream);
                  })
                },4000)
                //BlkDB.dumpToJsonFIleRange(cbGetSynch,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],frankieCoin.chainRiser);


                //pongBack = true;//not sure about this since this is a stream
              }else if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
                //okay this is a legitimate pong
                if(chainState.synchronized > peerBlockHeight){
                  var pongBackBlock = function(blockData){
                    peers[peerId].conn.write(blockData.toString());
                  }
                  BlkDB.getBlock(parseInt(peerBlockHeight),pongBackBlock);
                  pongBack = true;
                }else{
                  console.log("you are not synchronized to the peers and we should call a block synch");
                  //call chainWalker
                  chainWalker(peerBlockHeight,cbBlockChainValidatorStartUp);
                }

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
              setTimeout(function(){if(peers[peerId]){peers[peerId].conn.write(JSON.stringify({"ChainSyncPong":{Height:peerBlockHeight,MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));}},300);
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
        }else if(JSON.parse(data)["peerSafe"]){//PEER SAFE MESSAGES
          //log(chalk.bgRed("------------------------------------------------------"));
          //log(chalk.red("THIS IS A PEER SAFE MESSAGE AND WILL BE HIDDEN"));
          //log(chalk.bgRed("------------------------------------------------------"));
          //console.log("what the peer sent "+data);
          var peerData = JSON.parse(data)["peerSafe"];

          var secretPeerID = JSON.parse(data)["peerSafe"]["secretPeerID"];
          var secretPeerMSG = JSON.parse(data)["peerSafe"]["secretPeerMSG"];
          var secretAction = JSON.parse(data)["peerSafe"]["secretAction"];
          var encryptedMessage = JSON.parse(data)["peerSafe"]["encoded"];
          var thisPeerPublicKey = JSON.parse(data)["peerSafe"]["public"];
          var egemAccount = JSON.parse(data)["peerSafe"]["egemAccount"];
          var rcvEgemAccount = JSON.parse(data)["peerSafe"]["rcvEgemAccount"];

          if(rcvEgemAccount && rcvEgemAccount.includes("|")){
            var rcvBTCAccount = rcvEgemAccount.split("|")[1];
            rcvEgemAccount = rcvEgemAccount.split("|")[0];
          }

          var options = {
              hashName: 'sha256',
              hashLength: 32,
              macName: 'sha256',
              macLength: 32,
              curveName: 'secp256k1',
              symmetricCypherName: 'aes-256-ecb',
              iv: null, // iv is used in symmetric cipher, set null if cipher is in ECB mode.
              keyFormat: 'uncompressed',
              s1: null, // optional shared information1
              s2: null // optional shared information2
          }

          //console.log(chalk.bgRed("INCOMING PS TX: "));
          //console.log("SECRET PEER ID: "+secretPeerID);
          //console.log("SECRET PEER MSG: "+secretPeerMSG);
          //console.log("SCRET PEER ACTION "+secretAction);
          //console.log("ENCRYPTED MESSAGE "+encryptedMessage);
          //console.log("MY PUBLIC KEY FROM SENDER "+thisPeerPublicKey);

          peerData = JSON.stringify(peerData);

          //console.log("Public Key stringified and parsed"+JSON.stringify(JSON.parse(peerData)["public"]));
          //console.log("Peer data is "+JSON.stringify(peerData));
          peerPublicPair = JSON.parse(peerData)["public"];
          //console.log("testing JSON parse "+JSON.parse(JSON.stringify(peerPublicPair))["data"].toString("hex"));
          for(thisNode in frankieCoin.nodes){
            if(frankieCoin.nodes[thisNode]["id"] == peerId){
              frankieCoin.nodes[thisNode]["publicPair"] = peerPublicPair;

              if(encryptedMessage != "nodata"){
                var ecdh = frankieCoin.nodes[thisNode]["ecdh"];
                //console.log("public key of ecdh "+ecdh.getPublicKey().toString("hex"));
                var encryptedMessageBuffer = new Buffer.from(encryptedMessage,"hex");
                var decryptedPeerMessage = ecies.decrypt(ecdh, encryptedMessageBuffer, options);
                console.log("I DID IT IF IT DONT ERROR "+decryptedPeerMessage.toString());
              }

              //console.log(secretAction+" was ");

              if(secretAction == "getAllWallets"){

                console.log("we have an action to pull list locked unspent transaction outputs");

                var ticker = "BTC"//temporarily just doing BTC
                var cbPeerSafeExistance = function(data){

                  //need to loop thru return now
                  console.log("length of returned"+data.length)

                  if(data.length > 0){
                    var allPeerSafes = data;
                    console.log("IIIIIIIIIIIIIIIII")
                    console.log("keys "+Object.keys(allPeerSafes)+" and "+Object.values(allPeerSafes));
                    console.log("IIIIIIIIIIIIIIIII")
                    var returnSafes = []
                    for(safe in allPeerSafes){
                      var addy = {"btcAddy":JSON.parse(allPeerSafes[safe])["coinAddress"]};
                      var parsedSafe = JSON.stringify(allPeerSafes[safe]);

                      console.log("in addy yup "+JSON.parse(parsedSafe));
                      returnSafes.push(JSON.stringify(addy));
                    }

                    peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:returnSafes,secretAction:"DepositAddressList",encoded:"nodata",public:ecdhPubKeyHex}}));
                  }else{
                    console.log("There are no unspent txo available for this addresss on this coin")
                  }

                  if(data == "nodata"){
                  }else{
                    /***
                    console.log("Peer Safe Existed for Coin "+ticker+" and is "+data.toString())
                    var publicAddress = JSON.parse(data)["coinAddress"];
                    var privateKey = JSON.parse(data)["addressPK"];
                    console.log("private key is "+privateKey);
                    console.log("BTC address is: "+publicAddress);
                    peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));
                    ***/
                  }
                }
                BlkDB.getPeerSafeAccounts(peerId+":"+egemAccount+":"+ticker,cbPeerSafeExistance)

              }else if(secretAction == "Wallet"){
                //time to make a safe for him
                //////we will actually make ethereum addresses and derive the BTC for now using random and testnet

                var ticker = "BTC"//temporarily just doing BTC
                var cbPeerSafeExistance = function(data){
                  console.log("SEARCH RETURNED WITH "+data)
                  if(data == "nodata"){
                    var keyPair = bitcoin.ECPair.makeRandom();
                    //var publicAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey },bitcoin.networks.testnet).address;
                    //var privateKey = keyPair.toWIF(bitcoin.networks.testnet);
                    var privateKeyHex = keyPair.privateKey.toString('hex');

                    console.log("testnet private key "+privateKeyHex)
                    //for compressed, append "01"
                    privateKeyHex += '01'

                    var privateKeyHexBuf = new Buffer(privateKeyHex, 'hex');

                    var version = 0xef; //Bitcoin private key

                    //console.log(cs.encode(privateKeyHexBuf, version))
                    var testnetWIFpk = cs.encode(privateKeyHexBuf, version)
                    keyPair = bitcoin.ECPair.fromWIF(testnetWIFpk, bitcoin.networks.testnet);
                    var publicAddress = address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network:bitcoin.networks.testnet }).address;

                    console.log("private key is "+privateKeyHex);
                    //console.log("public key is "+keyPair.publicKey);
                    console.log("BTC address is: "+publicAddress);
                    //going to require a digned transaction from the peer before I do this

                    var blake2sAddress = sapphirechain.Hash(publicAddress);
                    console.log("Blake2s: "+blake2sAddress);


                    //frankieCoin.peerSafe(peerPublicPair,peerId,privateKeyHex,"BTC",egemAccount,"empty");//peerSafe(nodeId,key,type,store)

                    BlkDB.addUpdateSafe(peerId+":"+egemAccount+":BTC:"+blake2sAddress,JSON.stringify({secretPeerID:secretPeerID,ticker:"BTC",coinAddress:publicAddress,addressPK:privateKeyHex,egemAccount:egemAccount,public:ecdhPubKeyHex}))

                    peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));

                    //need to broadcast to all peer BUT this peer the encrypted information
                    for(peer2s in peers){
                      if(peer2s != peerId){

                        var thisKeyToHide = peerId+":"+egemAccount+":BTC:"+blake2sAddress;
                        var thisValueToHide = JSON.stringify({secretPeerID:secretPeerID,ticker:"BTC",coinAddress:publicAddress,addressPK:privateKeyHex,egemAccount:egemAccount,public:ecdhPubKeyHex});

                        var thisStoreHexMessage = new Buffer.from(thisKeyToHide+"~|*|~"+thisValueToHide).toString('hex');

                        console.log("message for peer hex = "+thisStoreHexMessage);

                        console.log("message BEFORE SENDING BACK TO = "+Buffer.from(thisStoreHexMessage,"hex").toString("utf8"));

                        console.log("peer2s is "+peer2s)
                        console.log("peer id is"+peerId)

                        var remoteNodeIndex = sapphirechain.ReDuex(peer2s);

                        //let the directMessage do the work to encrypt and send the encrypted pper store
                        directMessage(remoteNodeIndex+":0:peerStoreTX:"+thisStoreHexMessage+":"+egemAccount);

                      }
                    }
                    //end need to broadcast to all peer BUT this peer the encrypted information

                  }else{
                    console.log("Peer Safe Existed for Coin "+ticker+" and is "+data.toString())
                    var publicAddress = JSON.parse(data)["coinAddress"];
                    var privateKey = JSON.parse(data)["addressPK"];
                    console.log("private key is "+privateKey);
                    console.log("BTC address is: "+publicAddress);

                    peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));

                    //need to broadcast to all peer BUT this peer the encrypted information

                    //end need to broadcast to all peer BUT this peer the encrypted information

                  }
                }
                BlkDB.getPeerSafe(peerId+":"+egemAccount+":"+ticker,cbPeerSafeExistance)
                /////end safe creation and immediate next case is for receipt of DM
              }else if(secretAction == "peerStoreTX"){
                //here we need to decode from base64 and decrypt

                console.log("we are in the decreypt section ...")
                let rewindingStore = new Buffer.from(decryptedPeerMessage, 'hex').toString("utf8");
                console.log("rewinded hex"+rewindingStore);
                console.log("rewinded string"+rewindingStore.toString("utf8"))
                console.log("rewinding strait up "+decryptedPeerMessage.toString("utf8"))

                //var testingETHdecoder = web3.utils.hexToUtf8(decryptedPeerMessage)

                function hex_to_ascii(str1)
                 {
                    var hex  = str1.toString();
                    var str = '';
                    for (var n = 0; n < hex.length; n += 2) {
                        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
                    }
                    return str;
                 }
                var hexedUpStore = hex_to_ascii(decryptedPeerMessage);
                var thisKeyToHide = hexedUpStore.split("~|*|~")[0];
                var thisValueToHide = hexedUpStore.split("~|*|~")[1];

                BlkDB.addUpdateSafe(thisKeyToHide,thisValueToHide);
                //console.log("testingETHdecoder "+testingETHdecoder);

              }else if(secretAction == "Transact"){

                var ticker = "BTC"//temporarily just doing BTC
                var cbPeerSafeExistance = function(data){
                  console.log("SEARCH RETURNED WITH "+data)
                  if(data == "nodata"){
                    var keyPair = bitcoin.ECPair.makeRandom();
                    //var publicAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey },bitcoin.networks.testnet).address;
                    //var privateKey = keyPair.toWIF(bitcoin.networks.testnet);
                    var privateKeyHex = keyPair.privateKey.toString('hex');

                    console.log("testnet private key "+privateKeyHex)
                    //for compressed, append "01"
                    privateKeyHex += '01'

                    var privateKeyHexBuf = new Buffer(privateKeyHex, 'hex');

                    var version = 0xef; //Bitcoin private key

                    //console.log(cs.encode(privateKeyHexBuf, version))
                    var testnetWIFpk = cs.encode(privateKeyHexBuf, version)
                    keyPair = bitcoin.ECPair.fromWIF(testnetWIFpk, bitcoin.networks.testnet);
                    var publicAddress = address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network:bitcoin.networks.testnet }).address;

                    console.log("private key is "+privateKeyHex);
                    //console.log("public key is "+keyPair.publicKey);
                    console.log("BTC address is: "+publicAddress);
                    //going to require a digned transaction from the peer before I do this


                    //frankieCoin.peerSafe(peerPublicPair,peerId,privateKeyHex,"BTC",egemAccount,"empty");//peerSafe(nodeId,key,type,store)

                    BlkDB.deleteSafe("safe:"+peerId+":"+egemAccount+":BTC:"+rcvBTCAccount);
                    BlkDB.addUpdateSafe(peerId+":"+rcvEgemAccount+":BTC:"+rcvBTCAccount,JSON.stringify({secretPeerID:secretPeerID,ticker:"BTC",coinAddress:publicAddress,addressPK:privateKey,egemAccount:rcvEgemAccount,public:ecdhPubKeyHex}))

                    //peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));
                  }else{

                    console.log("Peer Safe Existed for Coin "+ticker+" and is "+data.toString())
                    var publicAddress = JSON.parse(data)["coinAddress"];
                    var privateKey = JSON.parse(data)["addressPK"];
                    console.log("private key is "+privateKey);
                    console.log("BTC address is: "+publicAddress);

                    BlkDB.deleteSafe("safe:"+peerId+":"+egemAccount+":BTC:"+rcvBTCAccount);
                    BlkDB.addUpdateSafe(peerId+":"+rcvEgemAccount+":BTC:"+rcvBTCAccount,JSON.stringify({secretPeerID:secretPeerID,ticker:"BTC",coinAddress:publicAddress,addressPK:privateKey,egemAccount:rcvEgemAccount,public:ecdhPubKeyHex}))

                    //peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));
                  }
                }
                rcvBTCAccount = sapphirechain.Hash(rcvBTCAccount);
                console.log("what I send in to get it "+peerId+":"+egemAccount+":"+ticker+":"+rcvBTCAccount)
                BlkDB.getPeerSafe(peerId+":"+egemAccount+":"+ticker+":"+rcvBTCAccount,cbPeerSafeExistance)

              }else if(secretAction == "DecryptoStore"){


              }else if(secretAction == "SignOwner"){

                var ticker = "BTC"//temporarily just doing BTC
                var cbPeerSafeExistance = function(data){
                  console.log("SEARCH RETURNED WITH "+data)
                  if(data == "nodata"){

                    //This peer safe does not exist
                    console.log("Account does not exist for coin "+ticker+" and EGEM account "+egemAccount);
                    //We probably need a return message to the peer client

                  }else{

                    console.log("Peer Safe Existed for Coin "+ticker+" and is "+data.toString())
                    var publicAddress = JSON.parse(data)["coinAddress"];
                    var privateKey = JSON.parse(data)["addressPK"];
                    console.log("private key is "+privateKey);
                    console.log("BTC address is: "+publicAddress);
                    var privateKeyHexBuf = new Buffer.from(privateKey,'hex');
                    var version = 0xef; //Bitcoin private key
                    console.log(cs.encode(privateKeyHexBuf, version))
                    var testnetWIFpk = cs.encode(privateKeyHexBuf, version)
                    keyPair = bitcoin.ECPair.fromWIF(testnetWIFpk, bitcoin.networks.testnet);
                    var privateKeyBS = keyPair.privateKey;
                    console.log("THE PRIVATE KEY "+privateKeyBS+" PK to HEX "+privateKeyBS.toString("hex")+" PK HEX BUF "+privateKeyHexBuf);
                    var message = egemAccount+" controls this address "+publicAddress;
                    console.log(message)

                    ////now for messaging
                    var signature = bitcoinMessage.sign(message, privateKeyBS, keyPair.compressed)
                    console.log(signature.toString('base64'))

                    var address = publicAddress;

                    console.log(bitcoinMessage.verify(message, address, signature))

                    //chainState.datapack = signature+":"+message+":"+bitcoinMessage.verify(message, address, signature);
                    var signatureProofReturn = signature.toString('base64')+":"+message+":"+bitcoinMessage.verify(message, address, signature);

                    peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:signatureProofReturn,secretAction:"DepositAddressProof",encoded:"nodata",public:ecdhPubKeyHex}}));
                    //peers[peerId].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:publicAddress,secretAction:"DepositAddress",encoded:"nodata",public:ecdhPubKeyHex}}));
                  }

                }
                var blakeCoinAddress = sapphirechain.Hash(rcvEgemAccount);
                BlkDB.getPeerSafe(peerId+":"+egemAccount+":"+ticker+":"+blakeCoinAddress,cbPeerSafeExistance)

              }else if(secretAction == "DepositAddress" || secretAction == "DepositAddressProof" || secretAction == "DepositAddressList"){
                //console.log(secretPeerMSG);
                chainState.datapack = secretAction+":"+secretPeerMSG;
              }

              //console.log("THIS NODES INFO "+JSON.stringify(frankieCoin.nodes[thisNode]))

              ////need to construct and send reply message
              //peers[frankieCoin.nodes[i]["id"]].conn.write(JSON.stringify({peerSafe:{secretPeerID:secretPeerID,secretPeerMSG:secretPeerMSG,secretAction:secretAction,encoded:encryptedMessageToSend,public:ecdhPubKeyHex}}));
            }
          }
        }else if(JSON.parse(data)["pongBlockStream"] && isSynching == true){
          console.log("Extra peer returned synch message but synch is in progress so ignoring")
        }else if(JSON.parse(data)["pongBlockStream"] && isSynching == false){

          isSynching = true;
          chainState.isSynching = true;

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
            console.log("Importing the data file to the db and then calling the JSON FILE memory synch");
            setTimeout(function(){BlkDB.importFromJSONFile(ChainGrabRefresh,providerBlockHeight,cbChainGrab,frankieCoin.chainRiser);},2000);
            //setting this here and heed more intake checks
            frankieCoin.blockHeight = parseInt(providerBlockHeight);
            //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
            var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
              setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
            }


          }
          //1) going to import the database and callback the refresh
          //console.log("Data stream import initialized");
          //DatSyncLink.grabDataFile(mydata,cbRefreshDB);

        }else if(JSON.parse(data)["ChainSyncPong"]){
          //returned block from sunched peer and parses it for db
          log(JSON.parse(data)["ChainSyncPong"]);
          if(JSON.parse(data)["ChainSyncPong"]["GlobalHash"] == globalGenesisHash){
            log(chalk.green("Hash Matched good pong"))
            var peerBlockHeight = JSON.parse(data)["ChainSyncPong"]["Height"];
            ChainSynchHashCheck(peerBlockHeight,JSON.parse(data)["ChainSyncPong"]["MaxHeight"]);
            //if chain is not synched ping back to synched peer
            if(peerBlockHeight == chainState.synchronized){
            //if(frankieCoin.inSynch==true && frankieCoin.inSynchBlockHeight == frankieCoin.longestPeerBlockHeight){
              peers[peerId].conn.write("---------------------------------");
              peers[peerId].conn.write("THIS PEER IS NOW SYNCHED");
              peers[peerId].conn.write("---------------------------------");
            }else{
              console.log("CONN1 NOT REALLY SYNCHED AND NOT SURE IF SHOULD BE PinGIN BACK HERE ....")
              //setTimeout(function(){peers[peerId].conn2.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));},300);
              chainClipper(frankieCoin.blockHeight).then(function(){
                BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,1687);
              });
            }

          }else{
            log("------------------------------------------------------");
            log(chalk.red("You are communicating with a bad actor and we must stop this connection"));
            log("------------------------------------------------------");
            peers[peerId].conn.write("Stop hacking me bro");
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
/////////////////////////////////////////////////////////SECOND LEVEL CONNECTION
  sw2.on('connection', (conn2, info) => {

    //log(chalk.blue(JSON.stringify(info)));
    const seq2 = connSeq2
    const peerId = info.id.toString('hex');

    if(info.id != chainState.nodePersistantId){

        //causes screen scroll so removing right now
        //log(chalk.green("CHANNEL 2 Incoming Peer Info: "+ chalk.red(JSON.stringify(info))));
        //log(chalk.bgBlue('CHANNEL 2 Peer id: '+ chalk.bold(peerId)));

    }

    conn2.on('timeout', () => {
      console.log("timout for "+peerId)
    })

    conn2.on('close', () => {

      connSeq2--
    })

    var incomingStream2 = "";
    var incomingBufferArray2 = [];

    conn2.on('end',async function(){

      //setTimeout(function(){BlkDB.importFromJSONStream(ChainGrabRefresh,parseInt(chainState.chainWalkHeight+1),cbChainGrab,frankieCoin.chainRiser,incomingStream);},2000);
      //setting this here and heed more intake checks

      if(incomingStream2.startsWith('{"blockHeight"}') || incomingStream2.startsWith('[{"ox:') || incomingStream2.startsWith('[{"tx:') || incomingStream2.startsWith('[{"sfblk:')){

        console.log(chalk.bgRed("data stream ended"));
        console.log(chalk.bgRed("data stream ended"));
        console.log(chalk.bgRed("data stream ended"));
        //console.log("CONN 2 this is on end "+incomingStream2);
        console.log("CONN 2 Importing the data file to the db and then calling the memory synch");

        BlkDB.importFromJSONStream(ChainGrabRefresh,parseInt(chainState.chainWalkHeight+1),cbChainGrab,frankieCoin.chainRiser,incomingStream2);

        frankieCoin.blockHeight = parseInt(chainState.chainWalkHeight);
        //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
        var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
          setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
        }

      }

    });

    conn2.on('readable',function(){

      //console.log("BLOCK STREAM "+this.readableHighWaterMark);

      let chunk;
      while (null !== (chunk = this.read())) {
        //console.log(`Received ${chunk.length} bytes of data.`);
        //console.log(chunk.toString());
        //console.log("<== ");
        incomingStream2+=chunk.toString()
        incomingBufferArray2.push(chunk.toString());
      }

    });


    conn2.on('data', data => {
      // Here we handle incomming messages

      //console.log("connection 2 type of is "+typeof(data)+JSON.stringify(data));
      //log('Received Message from peer ' + peerId + '----> ' + data.toString() + '====> ' + data.length +" <--> "+ data);
      // callback returning verified uncles post processing probably needs a rename
      var sendBackUncle = function(msg,peerId){
        peers[peerId].conn2.write(JSON.stringify(msg));
      }

////////////////////////////////////////////begin the if block for incoming data
      if(isJSON(data.toString())){



        if(JSON.parse(data)["syncTrigger"]){

          isSynching = true;
          chainState.isSynching=true;
          console.log(chalk.bgRed(" DELETING BACK TO PREVIOUS CHECK POINT AND SYNC "+JSON.parse(data)["syncTrigger"]));
          console.log("SUBMITED "+JSON.parse(data)["syncTrigger"]["submitCurrrentChainStateHash"]+" PEER "+JSON.parse(data)["syncTrigger"]["peerCurrrentChainStateHash"])
          //var hairCut = (JSON.parse(data)["syncTrigger"] % frankieCoin.chainRiser);
          //var lastRiser = parseInt(JSON.parse(data)["syncTrigger"] - hairCut)
          chainClipper(JSON.parse(data)["syncTrigger"]).then(function(){
            BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,1816);
          });

          //setTimeout(function(){
          //  peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:parseInt(replyData),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
          //},2000)
          //var deltaToRiser = parseInt(frankieCoin.chainRiser - )


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
                  reqPeer.conn2.write(JSON.stringify({pongBlockStream:datSynch,blockHeight:chainState.synchronized}));
                }
                //var cbGetSynch = function(datpeer){
                //  console.log("calling dat synch")
                //  DatSyncLink.synchDatabaseJSON(setDatSynch,datpeer);
                //}

                var cbGetStream = function(jsonStream,streamToPeerID){
                  console.log("the streams cb condition is met");
                  //streamToPeerID.conn2.write(jsonStream);
                  //streamToPeerID.conn2.end();
                  //setting up some streams to try this out
                }
                //BlkDB.dumpDatCopy(cbGetSynch,peers[peerId]);
                //BlkDB.dumpToJsonFIle(cbGetSynch,peers[peerId]);

                if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 2500){
                  var numRecordsToStream = 2500;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 1000){
                  var numRecordsToStream = 1000;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 500){
                  var numRecordsToStream = 500;
                }else if(parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]) > 100){
                  var numRecordsToStream = 100;
                }else{
                  var numRecordsToStream = parseInt(chainState.synchronized - JSON.parse(data)["ChainSyncPing"]["Height"]);
                }
                //BlkDB.dumpToStreamFIleRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream)
                //var numRecordsToStream = parseInt(frankieCoin.synchronized);
                BlkDB.dumpToStreamBlockRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream).then(function(jsonStream){
                  peers[peerId].conn2.write(jsonStream);
                  console.log("wrote this "+jsonStream);
                  peers[peerId].conn2.end();
                  console.log("the streams then condition is met and num records to stream was "+numRecordsToStream);
                })

                /****
                setTimeout(function(){
                  BlkDB.dumpToStreamTXOXRange(cbGetStream,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],numRecordsToStream).then(function(jsonStream){
                    peers[peerId].conn2.write(jsonStream);
                    //console.log("wrote this "+jsonStream);
                    peers[peerId].conn2.end();
                    console.log("the streams then condition is met and num records to stream was "+numRecordsToStream);
                  })
                },500)
                ***/

                //BlkDB.dumpToJsonFIleRange(cbGetSynch,peers[peerId],JSON.parse(data)["ChainSyncPing"]["Height"],frankieCoin.chainRiser);


                //pongBack = true;//not sure about this since this is a stream
              }else if(frankieCoin.getLength() > parseInt(peerBlockHeight)){
                //okay this is a legitimate pong
                if(chainState.synchronized > peerBlockHeight){
                  var pongBackBlock = function(blockData){
                    peers[peerId].conn2.write(blockData.toString());
                  }
                  BlkDB.getBlock(parseInt(peerBlockHeight),pongBackBlock);
                  pongBack = true;
                }else{
                  console.log("you are not synchronized to the peers and we should call a block synch");
                  //call chainWalker
                  chainWalker(peerBlockHeight,cbBlockChainValidatorStartUp);
                }

              }else if(frankieCoin.blockHeight == parseInt(peerBlockHeight)){
                //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
                peers[peerId].conn2.write(JSON.stringify(frankieCoin.getLatestBlock()));
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
              setTimeout(function(){if(peers[peerId]){peers[peerId].conn2.write(JSON.stringify({"ChainSyncPong":{Height:peerBlockHeight,MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));}},300);
            }
            //peers[peerId].conn.write(JSON.stringify(frankieCoin.getLatestBlock()));
          }else{
            log("Did not match this hash and this peer is an imposter");
            //peers[peerId].conn.write("Don't hack me bro");
            peers[peerId].conn2.write(JSON.stringify({"BadPeer":{Height:1337}}));
            ///tesst out setTimeout(function(){disconnet peers[peerId].conn.dissconnet();},1500);
          }


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
            console.log("Importing the data file to the db and then calling the JSON FILE memory synch");
            setTimeout(function(){BlkDB.importFromJSONFile(ChainGrabRefresh,providerBlockHeight,cbChainGrab,frankieCoin.chainRiser);},2000);
            //setting this here and heed more intake checks
            frankieCoin.blockHeight = parseInt(providerBlockHeight);
            //setTimeout(function(){BlkDB.refresh(ChainGrabRefresh,99,cbChainGrab,globalGenesisHash);},3000}
            var cbBlockMemLoad = function(blockNum,cbChainGrab,chainRiser){
              setTimeout(function(){ChainGrabRefresh(blockNum,cbChainGrab,chainRiser);},3000)
            }


          }
          //1) going to import the database and callback the refresh
          //console.log("Data stream import initialized");
          //DatSyncLink.grabDataFile(mydata,cbRefreshDB);


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
            if(peerBlockHeight == chainState.synchronized){
            //if(frankieCoin.inSynch==true && frankieCoin.inSynchBlockHeight == frankieCoin.longestPeerBlockHeight){
              peers[peerId].conn2.write("---------------------------------");
              peers[peerId].conn2.write("THIS PEER IS NOW SYNCHED");
              peers[peerId].conn2.write("---------------------------------");
            }else{
              console.log("CONN2 NOT REALLY SYNCHED AND NOT SURE IF SHOULD BE PinGIN BACK HERE ....")
              //setTimeout(function(){peers[peerId].conn2.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));},300);
              chainClipper(frankieCoin.blockHeight).then(function(){
                BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,2027);
              });
            }

          }else{
            log("------------------------------------------------------");
            log(chalk.red("You are communicating with a bad actor and we must stop this connection"));
            log("------------------------------------------------------");
            peers[peerId].conn2.write("Stop hacking me bro");
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
    peers[peerId].conn2 = conn2
    peers[peerId].seq2 = seq2
    connSeq2++
  })

})()
/////////////////////////////////////ending asynchronous peers connection engine

//////////////////////////////////////////////////////////////messaging to peers
var broadcastPeers = function(message){
  for (let id in peers){
    if(peers[id] && peers[id].conn != undefined){
      peers[id].conn.write(message)
    }
  }
}

var broadcastPeers2 = function(message){
  for (let id in peers){
    if(peers[id] && peers[id].conn2 != undefined){
      peers[id].conn2.write(message)
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

        //calculating this 2 times but needed at addBlock for transations to verify properly
        var riserOffset = (parseInt(blockNum) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
        var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
        checkPointBlock = JSON.stringify(checkPointBlock);
        var blockNumHash = JSON.parse(JSON.stringify(frankieCoin.getBlock(blockNum)))["hash"];
        var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);
        //end pre calculation
        BlkDB.addTransactions(frankieCoin.getLatestBlock()["transactions"],frankieCoin.getLatestBlock()["hash"],parseInt(frankieCoin.getLatestBlock()["blockHeight"]),thisBlockCheckPointHash);
        BlkDB.addBlock(parseInt(frankieCoin.getLength()),JSON.stringify(frankieCoin.getLatestBlock()),frankieCoin.getLatestBlock()["hash"],"1962",setChainStateTX,frankieCoin.chainRiser,thisBlockCheckPointHash);
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
    }else if(userInput.startsWith("getBlockByHash(")){//Sign transaction
      var blockHash = userInput.slice(userInput.indexOf("getBlockByHash(")+15, userInput.indexOf(")"));
      BlkDB.getBlockByHash(blockHash).then(function(value){
        var thisBlockHash = value;
        console.log("block number for hash "+blockHash+" is "+thisBlockHash);
      }).catch(console.log)

      cliGetInput();
    }else if(userInput.startsWith("clipChainAt(")){
      var clipHeight = userInput.slice(userInput.indexOf("clipChainAt(")+12, userInput.indexOf(")"));
      chainClipperReduce(frankieCoin.blockHeight,clipHeight).then(function(){
        console.log("clipped chain to "+clipHeight+" restart to reindex")
        chainState.chainWalkHeight = clipHeight;
        chainState.synchronized = clipHeight;
        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,2165);
      });
      cliGetInput();
    }else if(userInput == "MM"){
      console.log("chain state chain walk height is "+chainState.chainWalkHeight);
      console.log("chain state synchronized equals "+chainState.synchronized);
      console.log("blockchain height is "+frankieCoin.blockHeight);
      setTimeout(function(){
        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,2173);
      },30)
      cliGetInput();
    }else if(userInput == "MT"){
      //activePing();
      console.log("Clearing /dist/ module cache from server")
      Object.keys(require.cache).forEach(function(id) {
        if (/[\/\\]app[\/\\]/.test(id)) delete require.cache[id]
      })
      cliGetInput();
    }else if(userInput == "INFO"){
      console.log("IS SYNCHING "+chainState.isSynching);
      console.log("MY NODE PERSISTANT ID "+chainState.nodePersistantId+" and in hex "+Buffer.from(chainState.nodePersistantId).toString('hex'))
      console.log(chalk.bgBlackBright.black("chain riser is ")+chalk.bgMagenta(frankieCoin.chainRiser))
      console.log(chalk.bgBlackBright.black("chain state chain walk height is ")+chalk.bgMagenta(chainState.chainWalkHeight));
      console.log(chalk.bgBlackBright.black("chain state chain walk hash is ")+chalk.bgMagenta(chainState.chainWalkHash));
      console.log(chalk.bgBlackBright.black("chain state synchronized equals ")+chalk.bgMagenta(chainState.synchronized));
      console.log(chalk.bgBlackBright.black("blockchain height is ")+chalk.bgMagenta(frankieCoin.blockHeight));
      console.log(chalk.bgBlackBright.black("previousBlockCheckPointHash is ")+chalk.bgMagenta(JSON.stringify(chainState.previousBlockCheckPointHash)));
      console.log(chalk.bgBlackBright.black("currentBlockCheckPointHash is ")+chalk.bgMagenta(JSON.stringify(chainState.currentBlockCheckPointHash)));
      console.log(chalk.bgBlackBright.black("transactionHeight is ")+chalk.bgMagenta(JSON.stringify(chainState.transactionHeight)));
      console.log(chalk.bgBlackBright.black("transactionRootHash is ")+chalk.bgMagenta(JSON.stringify(chainState.transactionRootHash)));
      BlkDB.getCheckPoints();
      cliGetInput();
    }else if(userInput == "TXVLDY"){

      var startEnd = parseInt(chainState.transactionHeight+1);
      var topEnd = parseInt(startEnd+500);
      console.log("want to call TXVLDY with "+topEnd+" and "+chainState.synchronized)
      if(topEnd >= chainState.synchronized){
        topEnd = chainState.synchronized
      }

      transactionValidator(parseInt(startEnd),parseInt(topEnd));

      cliGetInput();

    }else if(userInput == "HSHBLK"){
      BlkDB.getAllBLocksByHash();
      cliGetInput();
    }else if(userInput == "CLIP"){
      console.log("cliping chain from "+frankieCoin.blockHeight+" back one riser ");
      chainClipper(frankieCoin.blockHeight).then(function(){
        BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(chainState.chainWalkHeight+frankieCoin.chainRiser+1),cbBlockChainValidator,chainState.chainWalkHash,frankieCoin.chainRiser,2216);
      });
      cliGetInput();
    }else if(userInput == "CHECKPOINT"){
      BlkDB.getTopChainStateCheckPoint(frankieCoin.blockHeight,frankieCoin.chainRiser);
      cliGetInput();
    }else if(userInput == "RPCCLOSE"){
      rpcserver.closePort();
      cliGetInput();
    }else if(userInput == "RPCOPEN"){
      rpcserver.openPort();
      cliGetInput();
    }else if(userInput == "MMM"){
      console.log("calling all orders level db");
      //BlkDB.getAllBLocks();
      BlkDB.getTransactionReceiptsByAddress('0xc91Fc51124bdf9E2010Eb366da97a0b67B70E1f5');
      //BlkDB.getBalanceAtAddress('0x2025ed239a8dec4de0034a252d5c5e385b73fcd0',addyBal);
      var myOrdersBuyCBTest = function(data){
        console.log("returning leveldb buy orders");
        console.log(JSON.stringify(data));
      }
      //BlkDB.getOrdersBuy(myOrdersBuyCBTest);
      //BlkDB.getOrdersBuySorted(myOrdersBuyCBTest);
      //BlkDB.getOrdersSellSorted(myOrdersBuyCBTest);
      //BlkDB.getChainParams(globalGenesisHash);
      //BlkDB.getChainParamsBlockHeight(globalGenesisHash);
      cliGetInput();
    }else if(userInput == "PP"){
      for (let id in peers) {
        console.log(peers[id].conn);
      }
      BlkDB.getNodes();
      cliGetInput();
    }else if(userInput.startsWith("PM(")){

      var secretMessage = userInput.slice(userInput.indexOf("PM(")+3, userInput.indexOf(")"));

      directMessage(secretMessage);

      cliGetInput();

    }else if(userInput == "TX"){
      //BlkDB.getTransactions();
      BlkDB.getAllPeerSafes();
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
    }else if(userInput == "OOO"){//O is for order
      //other commands can go Here
      log("Just get everything in the database");
      BlkDB.getAllBLocks();
      //BlkDB.getAll();
      console.log("all blocks");
      cliGetInput();
    }else if(userInput == "OX"){//O is for order
      //other commands can go Here
      var cbTestBuys = function(){
        console.log("does nothing yet");
      }
      BlkDB.getOrdersPairBuy("EGEM","SFRX",cbTestBuys);
      cliGetInput();
    }else if(userInput.startsWith("addAllBalanceRecord(")){//
      var tempAddBalance = userInput.slice(userInput.indexOf("addAllBalanceRecord(")+20, userInput.indexOf(")"));
      BlkDB.addAllBalanceRecord(tempAddBalance.split(":")[0],tempAddBalance.split(":")[1],parseFloat(tempAddBalance.split(":")[2]).toFixed(8));
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

      var message = JSON.parse(signedPackage)["message"];
      var send = JSON.stringify(JSON.parse(message)["send"]);

      try{
        var action = JSON.stringify(JSON.parse(send)["action"]).replace(/['"/]+/g, '');
      }catch{
        ///////////////////////////////////////////////////////relay asap to peers
        broadcastPeers(signedPackage);
      }

      try{
        var coinEGEMAddress = JSON.stringify(JSON.parse(send)["address"]).replace(/['"/]+/g, '');
      }catch{
        //do noting right now
      }


      //console.log("signed package is"+JSON.parse(signedPackage)["message"]);


      var addressFrom = JSON.stringify(JSON.parse(send)["from"]).replace(/['"/]+/g, '');
      var addressTo = JSON.stringify(JSON.parse(send)["to"]).replace(/['"/]+/g, '');
      var amount = JSON.stringify(JSON.parse(send)["amount"]).replace(/['"/]+/g, '');
      var ticker = JSON.stringify(JSON.parse(send)["ticker"]).replace(/['"/]+/g, '');
      var validatedSender = web3.eth.accounts.recover(JSON.parse(signedPackage)["message"],JSON.parse(signedPackage)["signature"]);
      if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){

        //////////////////////////////////////////if there is an action redirect
        if(action){
          //will randomize and track but for now first node also need a variable
          var remoteNodeIndex = frankieCoin.nodes[0].index;
          if(action == "deposit"){
            directMessage(remoteNodeIndex+':0:Wallet::'+validatedSender.toLowerCase()+":");//node index:
          }else if(action == "transfer"){
            directMessage(remoteNodeIndex+':0:Transact::'+validatedSender.toLowerCase()+":"+addressTo.toLowerCase()+"|"+coinEGEMAddress);//node index:
            console.log("here is the first "+addressTo.toLowerCase()+"|"+coinEGEMAddress)
          }else if(action == "proof"){
            directMessage(remoteNodeIndex+':0:SignOwner::'+validatedSender.toLowerCase()+":"+coinEGEMAddress);//node index:
          }else if(action == "listlockedunspent"){
            directMessage(remoteNodeIndex+':0:getAllWallets::'+validatedSender.toLowerCase()+":");//node index:
          }
        }
        /////////////////////////////////////////////////////end action redirect

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
      console.log(chalk.yellow("-------------------------------------------------------------------------"));
      log(chalk.blue("Block Stored in memory: ")+JSON.stringify(frankieCoin.getBlock(parseInt(blocknum))));
      BlkDB.getBlock(blocknum,cbGetBlock);
      var pongBackBlock = function(blockData){
        console.log(chalk.green("Block Stored In DB: ")+blockData.toString());
        console.log(chalk.yellow("-------------------------------------------------------------------------"));
      }
      BlkDB.getBlock(parseInt(blocknum),pongBackBlock);
      cliGetInput();
    }else if(userInput.startsWith("getChainParams()")){//GETBLOCK function
      BlkDB.getChainParams(globalGenesisHash);
      BlkDB.getChainParamStream(globalGenesisHash);
      BlkDB.getChainParamsBlockHeight(globalGenesisHash);
      cliGetInput();
    }else if(userInput.startsWith("removeSafe(")){
      var keyToRemove = userInput.slice(userInput.indexOf("removeSafe(")+11, userInput.indexOf(")"));
      BlkDB.deleteSafe(keyToRemove);
      cliGetInput();
    }else if(userInput == "getLength()"){
      var currentChainLenth = frankieCoin.getLength();
      log("Current Chain Length = "+currentChainLenth);
      cliGetInput();
    }else if(userInput.startsWith("getBalance(")){
      log("");
      log(userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")")));
      var egemAddress = userInput.slice(userInput.indexOf("getBalance(")+11, userInput.indexOf(")")).toLowerCase();
      BlkDB.getBalanceAtAddress(egemAddress,addyBal)
      log("---------------");
      var addyBal2 = function(data){
        console.log("from the trie "+JSON.stringify(data));//do noting now
      }
      BlkDB.getBalanceAtAddressFromTrie(egemAddress,addyBal2)
      var addyBal3 = function(data){
        console.log("from the all balances "+JSON.stringify(data));//do noting now
      }
      BlkDB.getBalanceAtAddressAllBalance(egemAddress,addyBal3)
      var addyBal4 = function(data){
        console.log(chalk.yellow("--------------------------------"));
        console.log("FROM THE TRIE "+JSON.stringify(data));
        console.log(chalk.yellow("--------------------------------"));
      }
      BlkDB.getBalanceAtAddressABTrie(egemAddress,'SFRX',chainState.transactionHeight,addyBal4)
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
        peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
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
          peers[id].conn.write(JSON.stringify({"ChainSyncPing":{Height:frankieCoin.getLength(),MaxHeight:parseInt(chainState.synchronized),GlobalHash:globalGenesisHash}}));
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
      console.log(sapphirechain.Hash(hashText));
      cliGetInput();
    }else if(userInput.startsWith("Hash8(")){//HASH FUNCTION FOR VERIFICATIONS
      log(userInput.slice(userInput.indexOf("Hash8(")+6, userInput.indexOf(")")));
      var hashText = userInput.slice(userInput.indexOf("Hash8(")+6, userInput.indexOf(")"));
      log("HASHING REDUEX THIS TEXT: "+hashText);
      console.log(sapphirechain.Hash8(hashText));
      cliGetInput();
    }else if(userInput.startsWith("ReDuex(")){//HASH FUNCTION FOR VERIFICATIONS
      log(userInput.slice(userInput.indexOf("ReDuex(")+7, userInput.indexOf(")")));
      var hashText = userInput.slice(userInput.indexOf("ReDuex(")+7, userInput.indexOf(")"));
      log("HASHING REDUEX THIS TEXT: "+hashText);
      console.log(sapphirechain.ReDuex(hashText));
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
var chainWalker = function(syncpoint,cbBlockChainValidatorStartUp){
  console.log(" --|{-------------- CHAIN WALKER ---------------}|-- ");
  console.log("a peer has identified you are out of sync at block "+syncpoint);
  setTimeout(function(){
    //console.log(frankieCoin.blockHeight);
    if(frankieCoin.blockHeight > 1){
      BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(syncpoint),cbBlockChainValidatorStartUp,chainState.chainWalkHash,frankieCoin.chainRiser,2666);

    }
  },1000);
}
////////////////////////////////////////////////end chain walker synchronisation

//have to load the first block into local database
BlkDB.addBlock(1,JSON.stringify(frankieCoin.getLatestBlock()),frankieCoin.getLatestBlock()["hash"],"2462",setChainStateTX,frankieCoin.chainRiser,'');
BlkDB.addChainParams(globalGenesisHash+":blockHeight",1);
//BlkDB.addChainState("cs:blockHeight",1);//NEVER LOAD THIS HERE IT DEFEATS THE WHOLE PURPOSE
BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"],parseInt(frankieCoin.getLatestBlock()["blockHeight"]),"");//is there a chain state hash?
//log("peer chain is"+ frankieCoin.getEntireChain());

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
  log(chalk.green("PEER CHAIN COMPARISON DATA: "));
  console.log(chalk.bgCyan.black(" longest peer: ")+chalk.bgMagenta.white(longestPeer)+chalk.bgCyan.black(" max height: ")+chalk.bgMagenta.white(peerMaxHeight)+chalk.bgCyan.black(" peer length: ")+chalk.bgMagenta.white(peerLength))
  console.log(chalk.bgCyan.black(" chainwalk ht: ")+chalk.bgMagenta.white(chainState.chainWalkHeight)+chalk.bgCyan.black(" synchro ht: ")+chalk.bgMagenta.white(chainState.synchronized)+chalk.bgCyan.black(" chain lngth: ")+chalk.bgMagenta.white(frankieCoin.getLength()))
  console.log(chalk.bgCyan.black(" peerNonce ht: ")+chalk.bgMagenta.white(chainState.peerNonce)+chalk.bgCyan.black(" synching ht: ")+chalk.bgMagenta.white(chainState.isSynching)+chalk.bgCyan.black(" isSynch: ")+chalk.bgMagenta.white(isSynching))
  //log("------------------------------------------------------")
  //log(longestPeer+" <<lp   mh>>"+peerMaxHeight+"<<mh    pl>> "+peerLength)
  frankieCoin.incrementPeerNonce(nodesInChain[node]["id"],peerLength);
  BlkDB.addNode("node:"+nodesInChain[node]["id"]+":peerBlockHeight",peerLength);
  //log(JSON.stringify(nodesInChain));
  //the pong us set to be one higher from the ping and is above the chain length
  /*****
  if(longestPeer <= peerMaxHeight){
    log("are you synched UP? "+frankieCoin.isChainSynch(longestPeer).toString())
  }else{
    log("are you synched UP? "+frankieCoin.isChainSynch(peerMaxHeight).toString())
  }
  ****/

  //log("3333333333    "+longestPeer+" "+peerMaxHeight+" "+frankieCoin.getLength()+"    333333333");
  if(longestPeer == peerMaxHeight && peerMaxHeight == frankieCoin.getLength()){
    //log("------------------------------------------------------")
    log(chalk.green("MOST COMPLETE SYNC"))
    log("------------------------------------------------------")
    frankieCoin.inSynch = frankieCoin.isChainSynch(peerMaxHeight);
    frankieCoin.inSynchBlockHeight = peerMaxHeight;
    chainState.peerNonce = peerMaxHeight;
    chainState.isSynching = false;
    chainState.interval = 25000;
  }else if(parseInt(peerMaxHeight - frankieCoin.getLength()) > 2500){
    //chainState.isSynching = false;
    if(chainState.interval == 10000 && chainState.synchronized < 10){
      console.log("calling active sync now ");
      activeSync();
    }
    chainState.interval = 10000;
  }else if(parseInt(peerMaxHeight - frankieCoin.getLength()) > 1000){
    //chainState.isSynching = false;
    chainState.interval = 8000;
  }else{
    chainState.interval = 4000;
    log("------------------------------------------------------")
    //chainState.isSynching = false;//if I set to true here it stops
  }

  //this.chain.inSynch = frankieCoin.isChainSynch()
}

var callBackEntireDatabase = function(data){
  for(obj in data){
    console.log(JSON.stringify(data[obj]));
  }
}

//the idea is to sync the chain data before progression so we start with a callback of data store limited by number of blocks
var cbChainGrab = async function(data) {
  //console.log("chain grab callback...")
  //log('got data: '+data.toString());//test for input

  for (obj in data){
    //log("BLOCK CHAIN SYNCH "+JSON.stringify(data[obj]["blocknum"]));//verbose
    //console.log("blockdata coming inbound "+JSON.parse(data[obj])["blockHeight"]+" vs memory "+JSON.stringify(frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"])))//verbose
    //verify block does not exist in memory
    if(typeof frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"]) === "undefined" || frankieCoin.getBlock(JSON.parse(data[obj])["blockHeight"]) === null){
      //block not in memory
      //console.log("block does not exist "+data[obj]);
      var tempBlock = data[obj];
      frankieCoin.addBlockFromDataStream(tempBlock,"sending in block "+JSON.parse(tempBlock)["blockHeight"]);
      frankieCoin.blockHeight = parseInt(JSON.parse(tempBlock)["blockHeight"]);

    }else{
      //block existed
      //log("block exists in chain data: "+JSON.parse(data[obj])["blockHeight"]);
      //frankieCoin.blockHeight = parseInt(JSON.parse(data[obj])["blockHeight"]);
    }
    blockHeightPtr++;
  }
  log(chalk.blue("BlocHeightPtr: "+ chalk.green(blockHeightPtr)));

  setTimeout(function(){
    //console.log(frankieCoin.blockHeight);
    if(frankieCoin.blockHeight > 1){
      BlkDB.blockRangeValidate(parseInt(chainState.chainWalkHeight+1),parseInt(frankieCoin.blockHeight),cbBlockChainValidatorStartUp,chainState.chainWalkHash,frankieCoin.chainRiser,2718);

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

  console.log(chalk.yellow.bgBlue("CHAIN GRAB BLOCK HEIGHT: ")+chalk.bgMagenta.bold(frankieCoin.blockHeight));
  BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(frankieCoin.blockHeight));
  BlkDB.addChainState("cs:blockHeight",parseInt(frankieCoin.blockHeight));
  //console.log("about to send this to rpc "+JSON.stringify({block:frankieCoin.getLatestBlock()}))
  rpcserver.postRPCforMiner({block:frankieCoin.getLatestBlock()});

  //need to open back up synching
  isSynching = false;
  chainState.isSynching = false;

};
//a function call for datastore
function ChainGrab(blocknum){
  //BlockchainDB.getBlockchain(99,cbChainGrab);
  //BlkDB.getBlockchain(99,cbChainGrab,globalGenesisHash)
  var currentHeight = function(val){
    //console.log(val);
    BlkDB.getBlockRange(val,frankieCoin.chainRiser,cbChainGrab)
  }
  BlkDB.getChainStateParam("blockHeight",currentHeight);
  var resetTransactionHeight = function(val){
    console.log("setting transaction state based on "+val)
    if(val != 0){
      setChainStateTX(val.split(":")[0],val.split(":")[1]);
    }
  }
  BlkDB.getChainStateParam("transactionHeight",resetTransactionHeight);
  //maybe some other stuff like .then
};
function ChainGrabRefresh(blocknum,cbChainGrab,chainRiser){
  //BlockchainDB.getBlockchain(99,cbChainGrab);
  console.log("called chain grab refresh with blockNum "+blocknum+" chainRiser "+chainRiser)
  //BlkDB.getBlockchain(99,cbChainGrab,ggHash)
  BlkDB.getBlockRange(blocknum,chainRiser,cbChainGrab);
  //maybe some other stuff like .then
};

/*-------THE DYNC CALLS ON STARTUP---------------*/
//and finally the actual call to function for synch
isSynching = true;

setTimeout(function(){ChainGrab();},3000);
/*-------THE DYNC CALLS ON STARTUP---------------*/

//end by now we will know if synched or not and enable or disable mining
log("------------------------------------------------------")
log(chalk.green("CHAIN SYNCED"))//not true need to edit this comment based on a parameter
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

var broadcastPeersBlock = function(trigger,order = ''){
  if(trigger == "block"){
    //sending the block to the peers
    log("------------------------------------------------------")
    log(chalk.bgGreen("BROADCASTING QUARRY MINED BLOCK TO PEERS"))
    log("------------------------------------------------------")
    broadcastPeers(JSON.stringify({checkPointHash:chainState.checkPointHash,currentBlockCheckPointHash:chainState.currentBlockCheckPointHash,block:frankieCoin.getLatestBlock()}));
  }else if(trigger == "order"){
    //sending the block to the peers
    log("------------------------------------------------------")
    log(chalk.bgGreen("BROADCASTING REPLACEMENT ORDER TO PEERS"))
    log("------------------------------------------------------")
    broadcastPeers(order);
  }

  /****
  var deletedOrdersBroadcast = function(deletedOrders){
    console.log("THIS IS WHAT I WOULD BE BROADCASTING TO PEER FOR DELETED ORDERS");
    console.log({"deletableOrders":JSON.stringify(deletedOrders)});
    broadcastPeers({"deletableOrders":JSON.stringify(deletedOrders)});
  }
  ****/
  //setTimeout(function(){BlkDB.callDeletedOrders(deletedOrdersBroadcast)},1000);
}

//parent communicator callback function sent to child below
var impcchild = function(childData,fbroadcastPeersBlock,sendOrderTXID,sendTXID,fSetChainStateTX){
  //log("------------------------------------------------------");
  //process.stdout.clearLine();
  //process.stdout.cursorTo(0);
  process.stdout.write(chalk.blue("Incoming data from child: "+chalk.green(childData)));

  if(isJSON(childData) && JSON.parse(childData)["createBlock"]){

    log(chalk.blue("Current prev hash is: "+chalk.green(frankieCoin.getLatestBlock().hash)+"\nIncoming block previous hash is: "+JSON.parse(childData)["createBlock"]["block"]["previousHash"]));

    if((frankieCoin.getLatestBlock().hash == JSON.parse(childData)["createBlock"]["block"]["previousHash"]) && JSON.parse(childData)["createBlock"]["block"]["timestamp"] != "1541437502148"){
      //block from miner is commmitted though internal miner - could chainge this to a direct call


      ///////////////////////PROMIS ASYNC FUNCTION SO I CAN STRUCTURE THE TIMING
      (async () => {
        console.log(chalk.bgRed("we do make it into the function "));
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
                      console.log(chalk.bgRed("BROADCASTING REPLACEMENT ORDER"));
                      console.log(JSON.stringify(replacementOrder));
                      fbroadcastPeersBlock('order',JSON.stringify(replacementOrder));
                      console.log(chalk.bgRed("BROADCASTING REPLACEMENT ORDER"));
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
                      console.log(chalk.bgRed("BROADCASTING REPLACEMENT ORDER"));
                      console.log(JSON.stringify(replacementOrder));
                      fbroadcastPeersBlock('order',JSON.stringify(replacementOrder));
                      console.log(chalk.bgRed("BROADCASTING REPLACEMENT ORDER"));
                    }

                    var ticker = JSON.parse(data[obj])["pairBuy"];
                    var myblocktx = new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker);
                    //does not work this way need tro rethink
                    myblocktx.oxdid = JSON.parse(data[obj])["transactionID"];
                    myblocktx.oxtid = JSON.parse(data[obj])["timestamp"];
                    console.log(JSON.stringify(myblocktx));
                    frankieCoin.createTransaction(myblocktx);

                    //transaction B
                    var addressFrom2 = JSON.parse(data[obj])["fromAddress"];
                    var addressTo2 = JSON.parse(dataSells[objs])["fromAddress"];
                    var amount2 = parseFloat(amount*JSON.parse(dataSells[objs])["price"]);

                    var ticker2 = JSON.parse(dataSells[objs])["pairSell"];
                    var myblocktx2 = new sapphirechain.Transaction(addressFrom2, addressTo2, amount2, ticker2);
                    //does not work this way need tro rethink
                    myblocktx2.oxdid = JSON.parse(dataSells[objs])["transactionID"];
                    myblocktx2.oxtid = JSON.parse(dataSells[objs])["timestamp"];
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

        await console.log(chalk.bgRed("FIRST OFF CAN I DO A TIME OUT HERE AND "+frankieCoin.getLatestBlock().timestamp+" comares to "+JSON.parse(childData)["createBlock"]["block"]["timestamp"]))
        //////////////going to have to make this sequential in a callback or chain


        franks.mpt3(JSON.parse(childData)["address"],JSON.parse(childData)["createBlock"]["block"]);//need to swap fpr next line but test it
        //frankieCoin.addPendingTransactionsToMinedBLock(JSON.parse(childData)["address"],JSON.parse(childData)["createBlock"]["block"]);

        //calculating this 2 times but needed at addBlock for transations to verify properly
        var blockNum = await parseInt(frankieCoin.getLatestBlock()["blockHeight"])
        var riserOffset = await (parseInt(blockNum) % parseInt(frankieCoin.chainRiser));//keep in mind it is plus 1 for chain
        var checkPointBlock = frankieCoin.getBlockFromIndex(parseInt(riserOffset+1));///getCheckpoint
        checkPointBlock = JSON.stringify(checkPointBlock);
        var blockNumHash = JSON.parse(JSON.stringify(frankieCoin.getLatestBlock()))["hash"];
        var thisBlockCheckPointHash = sapphirechain.Hash(blockNumHash+JSON.parse(checkPointBlock)["hash"]);
        //end pre calculation

        BlkDB.addTransactions(JSON.stringify(frankieCoin.getLatestBlock()["transactions"]),frankieCoin.getLatestBlock()["hash"],parseInt(frankieCoin.getLatestBlock()["blockHeight"]),thisBlockCheckPointHash);
        frankieCoin.hashOfThisBlock = sapphirechain.Hash(frankieCoin.hash+BlkDB.getStateTrieRootHash())+":"+frankieCoin.hash+":"+BlkDB.getStateTrieRootHash();
        ////////database update and peers broadcast
        log("[placeholder] mining stats from outside miner");
        //NOTE: there is time to modify the hash of the block before broadcast as opposed to using hashOfthisBlock for stateroot
        log("Outside Miner Mined Block Get latest block: "+frankieCoin.getLatestBlock().nonce.toString()+"and the hash"+frankieCoin.getLatestBlock()["hash"]);
        /////////////////////////////////////////////////////block stored to level
        BlkDB.addBlock(parseInt(frankieCoin.blockHeight),JSON.stringify(frankieCoin.getLatestBlock()),frankieCoin.getLatestBlock()["hash"],"3020",fSetChainStateTX,frankieCoin.chainRiser,thisBlockCheckPointHash);
        BlkDB.addChainParams(globalGenesisHash+":blockHeight",parseInt(frankieCoin.blockHeight));
        BlkDB.addChainState("cs:blockHeight",parseInt(frankieCoin.blockHeight));

        chainState.chainWalkHeight = frankieCoin.blockHeight;
        chainState.chainWalkHash = frankieCoin.getLatestBlock()["hash"];//block 1 hash
        chainState.synchronized = frankieCoin.blockHeight;//when we are synched at a block it gets updated
        chainState.topBlock = frankieCoin.blockHeight;

        //if(frankieCoin.blockHeight > frankieCoin.chainRiser){
          calculateCheckPoints(frankieCoin.blockHeight,'miner','');
        //}
        ///////////////////////////////////////////////////////////peers broadcast
        fbroadcastPeersBlock('block');
        ////////////////////finally post the RPC get work block data for the miner
        rpcserver.postRPCforMiner({block:frankieCoin.getLatestBlock()});
        ///////////////////////////////////////////////////chain state checkpoints
        //now that we are valid we are going to check 3 blocks back to see if it is a candidate for chain state
        console.log("MY MODULUS"+parseInt(frankieCoin.blockHeight - 3) % parseInt(frankieCoin.chainRiser))
        if( parseInt(frankieCoin.blockHeight) > 3 && (parseInt(frankieCoin.blockHeight - 3) % parseInt(frankieCoin.chainRiser)) == 0 ){
          var checkPoint = parseInt(frankieCoin.blockHeight - 3);
          var pongBackBlock = function(blockData){
            console.log("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"]);
            BlkDB.addChainState("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"],JSON.parse(blockData)["hash"]);
            chainState.checkPointHash = "cs:"+checkPoint+":"+JSON.parse(blockData)["hash"];
            //BlkDB.addCheckPoint("cs:"+checkPoint+":"+JSON.parse(blockData)["hash"],JSON.parse(blockData)["hash"],JSON.parse(blockData)["previousHash"],JSON.parse(blockData)["timestamp"],JSON.parse(blockData)["nonce"])//block.previousHash + block.timestamp + block.nonce
          }
          BlkDB.getBlock(parseInt(checkPoint),pongBackBlock);
        }


      })();
      /////////////////////////////////////////////////////ENDING PROMISE RETURN
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
    var actionStep = "received:wait";//RPC reply step counter
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
    console.log("action"+signedPackageTx["action"])

    try{
      var action = signedPackageTx["action"];
      if(action != undefined){
        actionStep = "redirect:datapack"
      }else{
        actionStep = "proceed:ignore"
      }
    }catch{
      ///////////////////////////////////////////////////////relay asap to peers
      actionStep = "proceed:ignore"
      broadcastPeers(signedPackage);
    }

    console.log("action step is "+actionStep)

    try{
      var coinEGEMAddress = signedPackageTx["address"];
    }catch{
      //do nothing right now
    }

    var addressFrom = signedPackageTx["from"];
    var addressTo = signedPackageTx["to"];
    var amount = signedPackageTx["amount"];
    var ticker = signedPackageTx["ticker"];
    var validatedSender = web3.eth.accounts.recover(JSON.parse(childData)["signedTransaction"]["message"],JSON.parse(childData)["signedTransaction"]["signature"]);
    if(validatedSender.toLowerCase() == addressFrom.replace(/['"]+/g, '').toLowerCase()){

      //////////////////////////////////////////if there is an action redirect
      if(action){
        console.log("there is an action of "+action+"on this transaction ");
        //will randomize and track but for now first node also need a variable
        var remoteNodeIndex = frankieCoin.nodes[0].index;
        //need to randomize but for now its okay at 0
        if(action == "deposit"){
          directMessage(remoteNodeIndex+':0:Wallet::'+validatedSender.toLowerCase()+":");//node index:
        }else if(action == "transfer"){
          directMessage(remoteNodeIndex+':0:Transact::'+validatedSender.toLowerCase()+":"+addressTo.toLowerCase()+"|"+coinEGEMAddress);//node index:
        }else if(action == "proof"){
          directMessage(remoteNodeIndex+':0:SignOwner::'+validatedSender.toLowerCase()+":"+coinEGEMAddress);//node index:
        }else if(action == "listlockedunspent"){
          directMessage(remoteNodeIndex+':0:getAllWallets::'+validatedSender.toLowerCase()+":");//node index:
        }
      }
      /////////////////////////////////////////////////////end action redirect

      ///need to alidate that this wallet has the funds to send
      var myblocktx = new sapphirechain.Transaction(addressFrom, addressTo, amount, ticker);
      frankieCoin.createTransaction(myblocktx);
      console.log("This legitimate signed transaction by "+validatedSender+" has been posted");

    }else{
      console.log("validatedSender "+validatedSender.toLowerCase()+" does not equal "+addressFrom.replace(/['"]+/g, '').toLowerCase());
    }
    console.log("my confirmation to return "+"placeholder"+myblocktx.hash);

    if(actionStep.split(":")[1] == "ignore"){
      //now we have a method to get better response data
      sendTXID("nodata:placeholder:"+myblocktx.hash);
    }else if(actionStep.split(":")[1] == "datapack"){
      console.log("in datapack case ...")
      var repeatReply = function(){
        console.log("in repeat reply")
        if(chainState.datapack != ""){
          if(chainState.datapack.split(":")[0] == "DepositAddress"){
            chainState.datapack = chainState.datapack.replace("DepositAddress:","");
            sendTXID("btcAddress:"+chainState.datapack+":"+myblocktx.hash);
          }else if(chainState.datapack.split(":")[0] == "DepositAddressProof"){
            chainState.datapack = chainState.datapack.replace("DepositAddressProof:","");
            sendTXID("btcAddressProof:"+chainState.datapack+":"+myblocktx.hash);
          }else if(chainState.datapack.split(":")[0] == "DepositAddressList"){
            //changed the return data profile to use a pipe beause colon interfered with JSON
            chainState.datapack = chainState.datapack.replace("DepositAddressList:","");
            sendTXID("btcAddressList|"+chainState.datapack+"|"+myblocktx.hash);
          }else{
            sendTXID("error:"+chainState.datapack+":"+myblocktx.hash);
          }

          chainState.datapack = "";
        }else{
          console.log("waiting on data for RPC reply ...");
          setTimeout(function(){repeatReply()},100);
        }
      }
      repeatReply();
    }

    //prepped up using same format as order
    //var peerTx = JSON.parse(childData)["signedTransaction"];
    //peerTx["transactionID"] = myblockorder.transactionID;
    //peerTx["timestamp"] = myblockorder.timestamp;
    //broadcastPeers(JSON.stringify(peerTx));

    if(actionStep.split(":")[0] == "proceed"){
      broadcastPeers(JSON.stringify(JSON.parse(childData)["signedTransaction"]));
    }

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
rpcserver.globalParentCom(impcchild,broadcastPeersBlock,setChainStateTX);
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
