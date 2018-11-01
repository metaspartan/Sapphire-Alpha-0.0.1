/******************************************************************************/
//
//  EGEM Sapphire Block.js
//  Currently licensed under MIT
//  A copy of this license must be included in all copies
//  Copyright (c) 2018 Frank Triantos aka OSOESE
//
/******************************************************************************/
var BLAKE2s = require("./blake2s.js")
//testing web3
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));
//console colors
const chalk = require('chalk');
const log = console.log;
//files and crypto for hash
const fs = require('fs');
const sha256 = require('crypto-js/sha256');
//adds a link to one module function for database
var addOrder = module.parent.children[6].exports.addOrder;
///////////////////////////////////////when fired this creates the genesis block
var genBlock;
var genesisBLK = function genesisBLK() {
  var prevHash = "0";
  var txtData = "Blake2s Genesis for EtherGem Opal Coin 18 Feb 2018 at 02:18:18 AM";
var filename = "sfrx_airdrop.js";
var sfrxAirdropHash;
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      sfrxAirdropHash = JSON.stringify(data);
      //log(sfrxAirdropHash)
      //sfrxAirdropHash=data.replace(/(\r\n|\n|\r)/gm,"");
      //sfrxAirdropHash = sha256(tbh).toString();
      //log(sfrxAirdropHash.toString());
      log(chalk.cyan("EGEM Block 1530000 2:1 SFRX AIRDROP IN TRANSACTION POOL"));
  });

  var genesisTx = [
    new Transaction(null, "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", 500000, "SPHR"),//oso
    new Transaction(null, "0x5080fb28d8cf96c320e1a2e56a901abb7391b4ce", 500000, "SPHR"),//ridz
    //JSON.stringify(sfrxAirdropHash)
  ];

  var sampleTX = new Transaction(null, "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", 500000, "SPHR");
  log(chalk.blue(JSON.stringify(sampleTX)));

  var datum = new Date(Date.UTC('2018','02','18','02','18','18'));
  var genBlockTimestamp = datum.getTime()/1000;
  var genBlockPreviousHash = "";
  log(chalk.green("Creating genesis block:"));
  //log(powHash);
  try {
    var h = new BLAKE2s(32, decodeUTF8(""));
  } catch (e) {
    log("Error: " + e);
  };

  log(prevHash+genBlockTimestamp+genBlockPreviousHash+txtData);

  h.update(decodeUTF8(prevHash+genBlockTimestamp+genBlockPreviousHash+txtData));

  genBlock = new Block(genBlockTimestamp, genesisTx, [], [], genBlockPreviousHash,"","","",txtData,h.hexDigest());
  //constructor(timestamp, transactions, orders, ommers, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0, difficulty = 2) {

  //this.chain.push(genBlock);

  return h.hexDigest();
}

function decodeUTF8(s) {
  var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
}

var Ommer = class Ommer{
    //we can do an address validation and kick back false
    constructor(timestamp, previousHash, nonce, hash, minerAddress, sponsorAddress){

        log(chalk.bgRed("OMMER IS BEING CREATED ")+this.timestamp+this.previousHash+this.nonce);

        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.nonce = nonce;
        this.hash = hash;
        this.amount = minerAddress;
        this.ticker = sponsorAddress;
    }
}

var Transaction = class Transaction{
    //we can do an address validation and kick back false
    constructor(fromAddress, toAddress, amount, ticker){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.ticker = ticker;
    }
}

//this is code to add DEX orders to the block
var Order = class Order{
    //we can do an address validation and kick back false
    constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID, state=''){
        this.fromAddress = fromAddress;
        this.buyOrSell = buyOrSell;
        this.pairing = pairBuy+pairSell;
        this.pairBuy = pairBuy,
        this.pairSell = pairSell,
        this.amount = amount;
        this.price = price;
        if(state == ""){
          this.state = "open";
        }else{
          this.state = state;
        }
        this.transactionID = transactionID;
        this.originationID = originationID
    }
}

async function getBlockFromEgem(callback) {
  //grab latest EGEM BLock
  var result = await web3.eth.getBlock("latest");
  //log(result);
  callback(result);
  // expected output: "resolved"
}

var currentEgemBlock = 472;
var currentEgemBlockHash = "0x0ed923fa347268f2d7b8e4a1a8d0ce61f810512ddaaec6729e66b004eb61e5e7";
var currentEgemBlockCallBack = function(block) {
  //log("in callback function")
  currentEgemBlock = block["number"];
  currentEgemBlockHash = block["hash"];
}

var Hash = function(inputs) {
  try {
    var h = new BLAKE2s(32, decodeUTF8(""));
  } catch (e) {
    alert("Error: " + e);
  };
  h.update(decodeUTF8(inputs));
  var thishash = h.hexDigest().toString();
  log(thishash);
  return thishash;
}

var Block = class Block {

    constructor(timestamp, transactions, orders, ommers, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0, difficulty = 2) {

        log("Block Constructure and hash is "+hash+" timestamp is "+timestamp+" egemBRBlock "+egemBRBlock+" egemBRBLockHash "+egemBRHash);

        if(egemBRHash == ''){
          getBlockFromEgem(currentEgemBlockCallBack);
        }

        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        //adding orders for dex
        this.orders = orders;
        //ommers
        this.ommers = ommers;
        //this is if mined or peer pushed block and PROBABBLY NEEDS so be much more secure
        //if(hash){
        if(hash)  {
          this.hash = hash
        }else{
          this.hash = this.calculateHash().toString();
        }

        if(nonce != 0){
          this.nonce = nonce;
        }else{
          this.nonce = 0;
        }
        //tie this to the main EGEM chain
        log("constructor again : "+egemBRBlock+" "+egemBRHash+" "+currentEgemBlock+" "+currentEgemBlockHash);
        if(egemBRBlock != '')  {
          this.eGEMBackReferenceBlock = egemBRBlock;
          this.egemBackReferenceBlockHash = egemBRHash;
        }else{
          this.eGEMBackReferenceBlock = currentEgemBlock;
          this.egemBackReferenceBlockHash = currentEgemBlockHash;
        }
        //this will be the data tranche for the genesis block
        this.data = '';
        //sponsor and miner are entagled
        this.sponsor = sponsor;//osoese contract address
        this.miner = miner;//osoese original wallet
        //logic gates to be executed or broadcast format TBD
        this.hardwareTx = '';
        //processing on logic gates to be executed or broadcast format TBD
        this.softwareTx = '';
        //where the next new logic is secured
        this.targetBlock = '';
        this.targetBlockDataHash = '';//not sure I need this unless using it to place a hash in advance
        //this is a quick config of the entaglement and processing
        this.allConfig = '';
        this.allConfigHash = '';
        //total Hash for sequencing
        this.hashOfThisBlock = '';
        this.difficulty = difficulty;
      }

    calculateHash() {
      try {
        var h = new BLAKE2s(32, decodeUTF8(""));
      } catch (e) {
        alert("Error: " + e);
      };
      //h.update(decodeUTF8(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + JSON.stringify(this.orders) + this.nonce));
      h.update(decodeUTF8(this.previousHash + this.timestamp + this.nonce));
      return h.hexDigest();
        //return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            if(this.nonce%1500 == 0){
              log("BLOCK NOT MINED: " + this.nonce);
            }

            this.hash = this.calculateHash();
        }
        log("BLOCK MINED: " + this.hash);
    }

}

var Blockchain = class Blockchain{
      constructor() {
          this.chain = [this.createGenesisBlock()];
          //adding in the peers connectivity
          this.nodes = [];
          //difficulty adjusts
          this.difficulty = 4;//can be 1 or more later
          this.pendingTransactions = [];
          this.pendingOrders = [];
          //ommers
          this.pendingOmmers = [];
          //need to set the block rewards
          this.miningReward = 8;
          this.sponsorReward = 0.5;
          this.devReward = 0.5;
          this.communityDevReward = 0.5;
          this.nodeReward = 0.25;
          this.quarryNodeReward = 0.25;
          //is the chain synched and mine and assist others? when true yes
          this.inSynch = false;
          this.inSynchBlockHeight = 0;
          this.longestPeerBlockHeight = 0;
          //just logging the chain creation
          log(chalk.cyan("Genesis block created!"));
          log(chalk.blue("Chain is: "+chalk.green(JSON.stringify(this.chain))));
      }

      registerNode(id,ip,port) {

          if (!this.nodes.includes({"id":id,"info":{"ip":ip,"port":port}})) {

              this.nodes.push({"id":id,"info":{"ip":ip,"port":port,"chainlength":this.chain.length,"maxHeight":this.chain.length,"synchBlock":0}});

              // Implement gossiping to share info on new nodes constantly

              // To complex to implement here

          }

      }

      retrieveNodes() {

        return this.nodes;

      }

      incrementPeerNonce(nodeId,len) {

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["chainlength"] = len;
          }
        }

      }

      incrementPeerMaxHeight(nodeId,max) {

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["maxHeight"] = max;
          }
        }

      }

      incrementPeerSynch(nodeId,synch) {

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["synchBlock"] = synch;
          }
        }

      }

      createGenesisBlock() {
          log("Generation of Genesis Block "+genesisBLK()+" Processing Complete");
          //genBlock.hash = genesisBLK();
          log(chalk.bgGreen(genBlock.timestamp));
          return genBlock;
          //return new Block(Date.parse("2018-02-18 02:18:18"), [], []);//original block creation
      }

      getBlock(num) {
          return this.chain[parseInt(num) - 1];
      }

      getLatestBlock() {
          return this.chain[this.chain.length - 1];
      }

      getOmmersAtBlock(num) {
          return this.chain[parseInt(num) - 1]["ommers"];
      }

      getLength(){
        return this.chain.length;
      }

      getEntireChain() {
          return JSON.stringify(this.chain);
      }

      ///for mining transactions from internal miner
      minePendingTransactions(miningRewardAddress){
          var blockTimeStamp = Date.now();

          //constructor(timestamp, transactions, orders, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0, difficulty = 2) {
          let block = new Block(blockTimeStamp, this.pendingTransactions, this.pendingOrders, this.pendingOmmers, this.getLatestBlock().hash);
          //not sure we do this here yet might be removed
          //block.difficulty = this.difficulty;
          if(this.getLatestBlock().difficulty){
            this.difficulty = this.getLatestBlock().difficulty;
          }

          block.mineBlock(this.difficulty);
          log('Block successfully mined! '+blockTimeStamp);
          log('Previous Block Timestamp was '+this.getLatestBlock().timestamp);
          var blockTimeDiff = ((blockTimeStamp-this.getLatestBlock().timestamp)/1000)
          if(blockTimeDiff < 4){//if less than 6 seconds lets bump up the difficulty **temporarily 4
            //temporarilty keping difficulty below 5 for testing
            if(this.difficulty < 5){
              log("DIFFICULTY: "+this.difficulty)
              block.difficulty = parseFloat(this.difficulty+1);
            }
          }else{
            block.difficulty = parseFloat(this.difficulty-1);
          }
          log(chalk.bgGreen('Differential is '+blockTimeDiff));
          ////extra check
          try {
            var h = new BLAKE2s(32, decodeUTF8(""));
          } catch (e) {
            alert("Error: " + e);
          };
          //h.update(decodeUTF8(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + JSON.stringify(block.orders) + block.nonce));
          h.update(decodeUTF8(block.previousHash + block.timestamp + block.nonce));
          log("should match the block hash "+h.hexDigest());
          ////extra check

          //adding a trading mechanism and if below this chain push it processes same block HINT MOVE IT TWO LINES DOWN
          //this.processTrades();
          this.chain.push(block);

          //end adding trading mechanism
          this.pendingTransactions = [
              new Transaction(null, miningRewardAddress, this.miningReward, "SPHR")
          ];
          this.pendingOrders = [];
          this.pendingOmmers = [];
      }

      ///for mining transactions from outside miner
      addPendingTransactionsToMinedBLock(miningRewardAddress, minedBlock){

          //need to add the mining reward HERE
          var minedReward = new Transaction(null, minedBlock["miner"], this.miningReward, "SPHR");
          this.createTransaction(minedReward);

          var blockTimeStamp = minedBlock["timestamp"];
          log("BBBBBBBBBBBBBBBBB block time stamp"+minedBlock["timestamp"]+" LAST BLOCK TIME STAMPING "+this.getLatestBlock().timestamp+"MINED  BLOCK PREV HASH "+minedBlock["previousHash"]+" LAST BLOCK HASH "+this.getLatestBlock().hash);
          var blockTimeDiff = ((blockTimeStamp-this.getLatestBlock().timestamp)/1000)
          let block = new Block(minedBlock["timestamp"], this.pendingTransactions, this.pendingOrders, this.pendingOmmers, minedBlock["previousHash"],this.sponsor,miningRewardAddress,"","",minedBlock["hash"],"",minedBlock["nonce"],minedBlock["difficulty"]);
          //constructor(timestamp, transactions, orders, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0) {
          //block.mineBlock(this.difficulty);
          block.difficulty = minedBlock["difficulty"];

          if(blockTimeDiff < 4){
            //temporary difficulty setting stopped at 6
            if(minedBlock["difficulty"] < 5){
              block.difficulty = parseFloat(block.difficulty+1);
            }
          }else{
            block.difficulty = parseFloat(block.difficulty-1);
          }
          log(chalk.bgGreen('Differential is '+blockTimeDiff));
          log('Block successfully added by outside miner '+blockTimeStamp);
          ////extra check
          try {
            var h = new BLAKE2s(32, decodeUTF8(""));
          } catch (e) {
            alert("Error: " + e);
          };
          //h.update(decodeUTF8(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + JSON.stringify(block.orders) + block.nonce));
          h.update(decodeUTF8(block.previousHash + block.timestamp + block.nonce));
          log("should match the block hash "+h.hexDigest());
          ////extra check

          //adding a trading mechanism and if below this chain push it processes same block HINT MOVE IT TWO LINES DOWN
          //this.processTrades();
          this.chain.push(block);

          //end adding trading mechanism
          this.pendingTransactions = [
              new Transaction(null, miningRewardAddress, this.miningReward, "SPHR")
          ];
          this.pendingOrders = [];
          this.pendingOmmers = [];
      }

      //th8s is the peers adding a block needs to be VALIDATED
      addBlockFromPeers(inBlock,callback,peerId){
        //if all that consensus stuff I am going to add....then
        //here is where I check if two things and I think make them globals
        //1 issync should be YES
        //2 previous hash must match current chain top hash
        if(this.getLatestBlock().hash == inBlock.previousHash){
          log("----------------------------------------------------");
          log("yes inblock prev hash of "+inBlock.previousHash+" matches the hash of chain "+this.getLatestBlock().hash);
          log("----------------------------------------------------");

          //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
          var block = new Block(inBlock.timestamp, inBlock.transactions, inBlock.orders, inBlock.ommers, inBlock.previousHash, inBlock.sponsor, inBlock.miner, inBlock.eGEMBackReferenceBlock, inBlock.data, inBlock.hash, inBlock.egemBackReferenceBlockHash, inBlock.nonce, inBlock.difficulty);
          this.chain.push(block);
          //careful I have the ischain valid returining true on all tries

        }else if(this.chain[this.chain.length - 2].hash == inBlock.previousHash && this.getLatestBlock().previousHash == inBlock.previousHash){//uncle block
          log(chalk.bgRed("uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"));
          log("UNCLE previous hash matches"+inBlock.previousHash+" current prev hash "+this.getLatestBlock().previousHash);
          log(chalk.bgRed("uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"));
          //since this is an UNCLE we need to check the timestamp to see who won ....
          if(this.getLatestBlock().timestamp < inBlock.timestamp){
            //proceed to not add a block and just log an ommer
            log(chalk.bgRed("ADDING OMMER TO CHAIN peer block is OMMER chain block REMAINS "+inBlock.timestamp+" PREV HASH "+inBlock.previousHash));
            var tmpOmmer = new Ommer(inBlock.timestamp,inBlock.previousHash,inBlock.nonce,inBlock.hash,inBlock.miner,inBlock.sponsor)
            this.addOmmer(tmpOmmer);
            //and return the last block to the sending peer...
            callback({"uncle":{"blockNumber":parseInt(this.chain.length-1),"block":inBlock}},peerId);
          }else if(this.getLatestBlock().timestamp >= inBlock.timestamp){
            //proceed to add the block and remove the latest block log as ommer and return the last block as ommer
            var returnBlock = this.getLatestBlock();
            log(chalk.bgRed("ADDING OMMER TO CHAIN peer block is VALID and OVER WRITES chain block "+inBlock.timestamp+" PREV HASH "+inBlock.previousHash));
            var tmpOmmer = new Ommer(returnBlock.timestamp,returnBlock.previousHash,returnBlock.nonce,returnBlock.hash,returnBlock.miner,returnBlock.sponsor);
            this.addOmmer(tmpOmmer);
            callback({"uncle":{"blockNumber":parseInt(this.chain.length),"block":returnBlock}},peerId);
            this.chain.pop()
            var block = new Block(inBlock.timestamp, inBlock.transactions, inBlock.orders, inBlock.ommers, inBlock.previousHash, inBlock.sponsor, inBlock.miner, inBlock.eGEMBackReferenceBlock, inBlock.data, inBlock.hash, inBlock.egemBackReferenceBlockHash, inBlock.nonce, inBlock.difficulty);
            this.chain.push(block);
          }else{
            log.chalk.bgRed("NO TIMESTAMPS so KILLING THE BLOCK");
            this.chain.pop();
          }
          //need to return a message that returns the uncle info and uncle block reward to sending peer

        }else{
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          log("no inblock prev hash of "+inBlock.previousHash+" does not match the hash of chain "+this.getLatestBlock().hash);
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          //this case represents a problem because it is just a bad block
          //this.chain.pop();
        }

        if(this.isChainValid() == false){
          this.chain.pop();
          log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ALERT XXXXXXXXXXXXXXX Block NOT added XXXXXXXXXXXXXXXX ALERT XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
          return false;
        }else{
          log("Block added from peers");
          return true;
        }
      }

      //th8s is the peers adding a block needs to be VALIDATED
      addBlockFromDatabase(dbBlock){
        //if all that consensus stuff I am going to add....then
        //here is where I check if two things and I think make them globals
        //1 issync should be YES
        //2 previous hash must match current chain top hash
        if(this.getLatestBlock().hash == dbBlock.previousHash){
          log("----------------------------------------------------");
          log("yes DB BLOCK prev hash of "+dbBlock.previousHash+" matches the hash of chain "+this.getLatestBlock().hash);
          log("----------------------------------------------------");
        }else{
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          log("no DB BLOCK prev hash of "+dbBlock.previousHash+" does not match the hash of chain "+this.getLatestBlock().hash);
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        }
        //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
        var block = new Block(dbBlock.timestamp, dbBlock.transactions, dbBlock.orders, dbBlock.ommers, dbBlock.previousHash, dbBlock.sponsor, dbBlock.miner, dbBlock.eGEMBackReferenceBlock, dbBlock.data, dbBlock.hash, dbBlock.egemBackReferenceBlockHash, dbBlock.nonce, dbBlock.difficulty);
        this.chain.push(block);
        //careful I have the ischain valid returining true on all tries
        if(this.isChainValid() == false){
          this.chain.pop();
          log("Block is not added and will be removed")
        }else{
          log("Block added from DATABASE")
        }
      }

      createTransaction(transaction){
          this.pendingTransactions.push(transaction);
      }

      createOrder(order,originationID = ''){
          order["timestamp"] = Date.now();
          order["transactionID"] = Hash(order["fromAddress"]+order["pairBuy"]+order["timestamp"]);
          //need to create a transaction ID and return it
          if(originationID != ''){
            order["originationID"] = originationID;
          }else{
            order["originationID"] = order["transactionID"];
          }
          log("Order just placed is "+JSON.stringify(order));
          this.pendingOrders.push(order);
      }

      addOmmer(ommer){
        this.pendingOmmers.push(ommer);
      }

      getBalanceOfAddress(address){

          let balance = [];

          //let balance = 0;
          for(const block of this.chain){

              for(const trans of block.transactions){

                  if(balance[trans.ticker] == null && (trans.fromAddress == address || trans.toAddress == address)){
                      balance[trans.ticker] = 0;
                  }

                  if(trans.fromAddress == address){
                      balance[trans.ticker] -= trans.amount;
                  }

                  if(trans.toAddress == address){
                      balance[trans.ticker] += trans.amount;
                  }
              }

          }

          return balance;
      }

      processTrades(){

          let tradeBalance = [];//will become the tradewallet for now is testing of trade interactions
          let tradeOrders = [];
          var myblock = this.getLatestBlock().orders;
          log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
          log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
          log(JSON.stringify(myblock));


          var allbuys = myblock.filter(
            function(myblock){ return ( myblock.buyOrSell=="BUY" ); }
          );

          /***
          for (odr in myblock){
            getOrdersFromBlockBuy(myblock,myblock[odr]["pairBuy"],myCallbackBuy,this);//myCallbackBuyMiner
          }
          ***/

          //log("here is the BUYS log"+JSON.stringify(allbuys));
          log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
          log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");

          /***
          var allbuys = allbuys1.filter(
            function(allbuys1){ return ( allbuys1.status=="OPEN" ); }
          );
          ***/

          ////////////////////////////////////////////////////////BUYS AND SELLS
          for(var ordersofbuy in allbuys){

            var allsells = myblock.filter(
              //function(myblock){ return ( myblock.buyOrSell=="SELL" && myblock.pairSell==ordersofbuy["pairSell"]); }
              function(myblock){ return ( myblock.buyOrSell=="SELL" ); }
            );

            log("88888888888888888888 here is the SELLS log"+JSON.stringify(allsells));
            for(var transactions in allsells){
              if(allbuys[ordersofbuy]["pairBuy"] == allsells[transactions]["pairBuy"] && allbuys[ordersofbuy]["pairSell"] == allsells[transactions]["pairSell"]){
                log("99999999999999999 are we transacting? "+allbuys[ordersofbuy]["pairSell"]+allbuys[ordersofbuy]["price"]+" and "+allsells[transactions]["pairSell"]+allsells[transactions]["price"]);
                if(allbuys[ordersofbuy]["price"] >= allsells[transactions]["price"]){
                    if(allbuys[ordersofbuy].amount < allsells[transactions].amount){
                      log("transaction created is "+allsells[transactions]["fromAddress"]+allbuys[ordersofbuy]["fromAddress"]+allbuys[ordersofbuy]["amount"]+allbuys[ordersofbuy]["pairBuy"]);
                      this.createTransaction(new Transaction(allsells[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allbuys[ordersofbuy]["amount"], allbuys[ordersofbuy]["pairBuy"]));
                      var newOrderAmpount = allsells[transactions]["amount"]-allbuys[ordersofbuy]["amount"];
                      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
                      //and a new one gets open
                      var replacementOrder = new Order(
                        allsells[transactions]["fromAddress"],
                        'SELL',
                        allsells[transactions]["pairBuy"],
                        allsells[transactions]["pairSell"],
                        newOrderAmpount,
                        allsells[transactions]["price"],
                        '',
                        ''
                      );
                      this.createOrder(replacementOrder,allsells[transactions]["originationID"]);
                      addOrder({order:replacementOrder});
                      /*****
                      //one order gets closed
                      this.createOrder(
                        new Order(
                          allbuys[ordersofbuy]["fromAddress"],
                          allbuys[ordersofbuy]["buyOrSell"],
                          allbuys[ordersofbuy]["pairBuy"],
                          allbuys[ordersofbuy]["pairSell"],
                          allbuys[ordersofbuy]["amount"],
                          allbuys[ordersofbuy]["price"],
                          allbuys[ordersofbuy]["transactionID"],//may want to get the txidof of closing order here
                          allbuys[ordersofbuy]["originationID"],
                          "closed"
                        ),allbuys[ordersofbuy]["originationID"]
                      );
                      //one gets partisl
                      this.createOrder(
                        new Order(
                          allsells[transactions]["fromAddress"],
                          allsells[transactions]["buyOrSell"],
                          allsells[transactions]["pairBuy"],
                          allsells[transactions]["pairSell"],
                          allsells[transactions]["amount"],
                          allsells[transactions]["price"],
                          allsells[transactions]["transactionID"],//may want to get the txidof of closing order here
                          allsells[transactions]["originationID"],
                          "partial"
                        ),allbuys[ordersofbuy]["originationID"]
                      );
                      //ending buy < sell
                      *****/
                    }else if(allbuys[ordersofbuy].amount > allsells[transactions].amount){
                      this.createTransaction(new Transaction(allsells[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allsells[transactions]["amount"], allbuys[ordersofbuy]["pairBuy"]));
                      var newOrderAmpount = allbuys[ordersofbuy]["amount"]-allsells[transactions]["amount"];
                      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
                      var replacementOrder = new Order(
                        allbuys[ordersofbuy]["fromAddress"],
                        'BUY',
                        allbuys[ordersofbuy]["pairBuy"],
                        allbuys[ordersofbuy]["pairSell"],
                        newOrderAmpount,
                        allbuys[ordersofbuy]["price"],
                        '',
                        ''
                      );
                      this.createOrder(replacementOrder,allbuys[ordersofbuy]["originationID"]);
                      addOrder({order:replacementOrder});
                      //one order gets closed
                      //one gets partisl
                      //and a new one gets open
                    }else{
                      log("&&&&&&&&&& EXACT MATCH &&&&&&&&&&&&&");
                      //this.createTransaction(new Transaction(allsells[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allsells[transactions]["amount"], allbuys[ordersofbuy].pairBuy));
                      //close two orders
                    }
                  }
              }


            }//end transactions in allsells loop
          }///end ordersofbuy loop
          ////////////////////////////////////////////////////////BUYS AND SELLS

          log("here is the BUYS log"+JSON.stringify(allbuys));


          /****

          //for(const block of this.chain){

              var block = this.getLatestBlock();
              for(const orders of block.orders){
                log("this is inside the loop");
                log(JSON.stringify(orders));

                      log("inside trades "+orders.pairBuy+orders.state+orders.amount+orders.buyOrSell);

                      if(tradeBalance[orders.pairBuy] == null){
                        tradeBalance[orders.pairBuy] = 0;
                        log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairing]);
                      }

                      if(tradeOrders[orders.pairBuy] == null){
                        tradeOrders[orders.pairBuy] = [];
                      }

                      tradeOrders[orders.pairBuy]["state"] = orders.state;
                      tradeOrders[orders.pairBuy]["buyOrSell"] = orders.buyOrSell;
                      tradeOrders[orders.pairBuy]["amount"] = orders.amount;
                      tradeOrders[orders.pairBuy]["price"] = orders.price
                      tradeOrders[orders.pairBuy]["fromAddress"] = orders.fromAddress;

                      if(tradeOrders[orders.pairBuy]["buyOrSell"] == "BUY"){
                        for(const ordersTX of block.orders){
                          log("about to transact if "+ordersTX.buyOrSell+" = SELL and "+ordersTX.state+" = open and "+ordersTX.pairBuy+ " = "+orders.pairBuy);
                          if(ordersTX.buyOrSell == "SELL" && ordersTX.state == "open" && ordersTX.pairBuy == orders.pairBuy){
                            log("**************OUTER SELL CONDITION MET***************");
                            log("price"+ordersTX.price+" "+tradeOrders[orders.pairBuy]["price"]);
                            log("amount"+ordersTX.amount+" "+tradeOrders[orders.pairBuy]["amount"]);
                            if(ordersTX.price <= tradeOrders[orders.pairBuy]["price"]){//this will transact or we move to next higher order price
                              log("***CREATE ORDER*****this is where I would transact some of "+orders.pairBuy+" and change the status to closed or partial");
                              //craft the trade transaction
                              var amounttoBuyTx = ordersTX.amount;
                              var amountToSellOrder = tradeOrders[orders.pairBuy]["amount"];
                              var statusOrderSupply = "open";
                              var statusOrderDemand = "open";
                              var originationID = '';
                              //if amount being bought is less than the supply
                              if(tradeOrders[orders.pairBuy]["amount"] < ordersTX.amount){
                                //new supply for sell is edited for updated order
                                amountToSellOrder = ordersTX.amount - tradeOrders[orders.pairBuy]["amount"];
                                //this transaction is whats being bought
                                amounttoBuyTx = tradeOrders[orders.pairBuy]["amount"];
                                //and the buy order will be closed
                                statusOrderDemand = "closed";
                                //meanwhile the sell order is partial
                                statusOrderSupply = "partial";
                                //originationID goes with supply
                                originationID = ordersTX.transactionID;
                              //else if the amount being bought is greater than the supply
                              }else if(ordersTX.amount < tradeOrders[orders.pairBuy]["amount"]){
                                //amount to sell is now 0
                                amountToSellOrder = 0;
                                //amount being bought is the supply
                                amounttoBuyTx = ordersTX.amount;
                                //buy order is partial will be updated
                                statusOrderDemand = "partial";
                                //and the sell order will be closed
                                statusOrderSupply = "closed";
                                //originationID goes with demand
                                originationID = tradeOrders[orders.pairBuy]["transactionID"]
                              //finally if the two oders are equal
                              }else if(ordersTX.amount == tradeOrders[orders.pairBuy]["amount"]){
                                amountToSellOrder = tradeOrders[orders.pairBuy]["amount"];
                                amounttoBuyTx = ordersTX.amount;
                                //in this case there will not be a new order placed so both orders will be closed
                              //}else if(ordersTX.amount > tradeOrders[orders.pairBuy]["amount"]){//already done up top case 1
                              }else{
                                log("IS THIS AN ERROR BECAUSE NO BUY OR SELL ORDERS MATCHED")
                              }
                              //creates the trade transaction
                              this.createTransaction(new Transaction(ordersTX.fromAddress, tradeOrders[orders.pairBuy]["fromAddress"], tradeOrders[orders.pairBuy]["amount"], orders.pairBuy));
                              log(ordersTX.fromAddress+tradeOrders[orders.pairBuy]["fromAddress"]+tradeOrders[orders.pairBuy]["amount"]+orders.pairBuy);
                              //update the trade order
                              //need a variable for partial or filled
                              log("about to create order and origID is"+originationID);
                              this.createOrder(
                                new Order(
                                  tradeOrders[orders.pairBuy]["fromAddress"],
                                  'BUY',
                                  orders.pairing,
                                  (tradeOrders[orders.pairBuy]["amount"]-ordersTX.amount),
                                  tradeOrders[orders.pairBuy]["price"]
                                ),
                                originationID
                              );
                            }
                          }
                        }
                      }

                      //this is incorrect information
                      if(tradeOrders[orders.pairBuy]["fromAddress"]){
                        log('in trading Balance of '+tradeOrders[orders.pairBuy]["fromAddress"]+' is'+this.getBalanceOfAddress(tradeOrders[orders.pairBuy]["fromAddress"]));
                      }

                      if(orders.buyOrSell == "BUY" && orders.state == "open"){
                          tradeBalance[orders.pairBuy] -= parseInt(orders.amount);
                          log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairBuy]);
                      }

                      if(orders.buyOrSell == "SELL" && orders.state == "open"){
                          tradeBalance[orders.pairBuy] += parseInt(orders.amount);
                          log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairBuy]);
                      }



              }

          //}

          log("output of pending orders "+JSON.stringify(tradeOrders)+"tradebalance"+JSON.stringify(tradeBalance));

          return tradeBalance;

          ***/

      }

      isChainSynch(length) {
        if(this.isChainValid() && this.chain.length == length){
          //this.chain.inSynch = true;
          log("4444444444444444     CHAIN IS SYNCH at block "+this.chain.length+"    4444444444444444444");
          return true;
        }else{
          log("55555555555555555     CHAIN IS NOT SYNCH at block "+this.chain.length+"     5555555555555555555");
          return false;
        }
      }

      isChainValid() {
          for (let i = 1; i < this.chain.length; i++){
              //log("current block "+JSON.stringify(this.chain[i]))
              //log("current block "+JSON.stringify(this.getBlock(i+1)));
              const currentBlock = this.chain[i];
              if (this.chain[i].hash !== this.chain[i].calculateHash()) {
                  log("would be returning false here: cb hash "+this.chain[i].hash+" calcHash "+this.getBlock(i+1).calculateHash());
                  log("previoushash"+this.getBlock(i+1).previousHash+"timestamp"+this.getBlock(i+1).timestamp+"nonce"+this.getBlock(i+1).nonce);
                  log("double check calc is same"+this.getBlock(i+1).calculateHash());
                  ///triple check
                  try {
                    var h = new BLAKE2s(32, decodeUTF8(""));
                  } catch (e) {
                    alert("Error: " + e);
                  };
                  //h.update(decodeUTF8(this.chain[i+1].previousHash + this.chain[i+1].timestamp + JSON.stringify(this.chain[i+1].transactions) + JSON.stringify(this.chain[i+1].orders) + this.chain[i+1].nonce));
                  h.update(decodeUTF8(this.getBlock(i+1).previousHash + this.getBlock(i+1).timestamp + this.getBlock(i+1).nonce));
                  log(h.hexDigest());
                  return false;
              }else{
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(chalk.green('Block Valid: ')+i+chalk.green(' Hash: ') + chalk.yellow(this.chain[i].hash));
              }
              const previousBlock = this.chain[i - 1];
              if (this.chain[i].previousHash !== this.chain[i-1].hash) {
                  log("would be returning false here: cb prevhash "+currentBlock.previousHash+" prev block hash "+previousBlock.hash);
                  return false;
              }
          }

          return true;
      }

      /////////functions for pulling blocks and processingTrades
      /////////end functons calling blocks and processingTrades

}

module.exports = {
    genesisBLK:genesisBLK,
    Ommer:Ommer,
    Transaction:Transaction,
    Order:Order,
    Block:Block,
    Blockchain:Blockchain,
    Hash,Hash
}
