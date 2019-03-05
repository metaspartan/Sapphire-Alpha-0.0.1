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
var web3 = new Web3(new Web3.providers.HttpProvider("https://lb.rpc.egem.io"));
//console colors
const chalk = require('chalk');
const log = console.log;
//files and crypto for hash
const fs = require('fs');
const sha256 = require('crypto-js/sha256');
//BlockchainDB reference
var BlkDB;
var setBlockchainDB = function(bkd){
  BlkDB = bkd;
}

var getChainState;
var setChainState = function(chs){
  getChainState = chs;
}
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

  //dev team drops
  var genesisTx = [];//cleared out the genesis tx to put directly in database
    //these transactions are moved to block reward
    //new Transaction(null, "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", 500000, "SFRX"),//oso
    //new Transaction(null, "0x5080fb28d8cf96c320e1a2e56a901abb7391b4ce", 500000, "SFRX"),//ridz
    //pre loaded multicurrency account
    //JSON.stringify(sfrxAirdropHash)
  //];

  //var sampleTX = new Transaction(null, "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", 500000, "SFRX");
  //log(chalk.blue(JSON.stringify(sampleTX)));

  var datum = new Date(Date.UTC('2018','02','18','02','18','18'));
  var genBlockTimestamp = datum.getTime()/1000;
  //var genBlockPreviousHash = "";
  var genBlockPreviousHash = "0000000000000000000000000000000000000000000000000000000000000000";
  log(chalk.green("Creating genesis block:"));
  //log(powHash);
  try {
    var h = new BLAKE2s(32, decodeUTF8(""));
  } catch (e) {
    log("Error: " + e);
  };

  log(prevHash+genBlockTimestamp+genBlockPreviousHash+txtData);

  h.update(decodeUTF8(prevHash+genBlockTimestamp+genBlockPreviousHash+txtData));

  genBlock = new Block(1,genBlockTimestamp, genesisTx, [], [], genBlockPreviousHash,"","","",txtData,h.hexDigest());
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
    //address validation in signed raw tx
    constructor(fromAddress, toAddress, amount, ticker, txTimestamp = Date.now()){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.ticker = ticker;
        this.timestamp = txTimestamp;
        this.hash = Hash(toAddress+amount+ticker+txTimestamp);
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

    constructor(
      blockheight,
      timestamp, transactions, orders, ommers, previousHash = '',
      sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '',
      nonce = 0, difficulty = 4, chainStateHash
    ) {
        log("Block Constructure and hash is "+hash+" timestamp is "+timestamp+" egemBRBlock "+egemBRBlock+" egemBRBLockHash "+egemBRHash);

        if(egemBRHash == ''){
          getBlockFromEgem(currentEgemBlockCallBack);
        }

        this.blockHeight = blockheight;
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
        log("Egem Chain Information : "+egemBRBlock+" "+egemBRHash+" "+currentEgemBlock+" "+currentEgemBlockHash);
        if(egemBRBlock != '')  {
          this.eGEMBackReferenceBlock = egemBRBlock;
          this.egemBackReferenceBlockHash = egemBRHash;
        }else{
          this.eGEMBackReferenceBlock = currentEgemBlock;
          this.egemBackReferenceBlockHash = currentEgemBlockHash;
        }
        //this will be the data tranche for the genesis block
        this.data = data;
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
        this.hashOfThisBlock = '';//Hash(this.hash+BlkDB.getStateTrieRootHash())+":"+this.hash+":"+BlkDB.getStateTrieRootHash();
        if(chainStateHash){
          this.chainStateHash = chainStateHash;
        }else{
          this.chainStateHash = getChainState().currentBlockCheckPointHash;
        }
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

var Blockchain = class Blockchain {

      constructor() {

          this.chain = [this.createGenesisBlock()];
          this.id = 663;
          this.chainRiser = 5;//1 - 100,101-200,etc. blocks in memory
          //adding in the peers connectivity
          this.nodes = [];
          //difficulty adjusts
          this.difficulty = 4;//can be 1 or more later
          this.pendingTransactions = [];
          this.pendingOrders = [];
          //ommers
          this.pendingOmmers = [];
          //need to set the block rewards
          //////calculations in level.js database now but will replicate in here
          this.miningReward = 8;
          this.sponsorReward = 0.5;
          this.devReward = 0.5;
          this.communityDevReward = 0.5;
          this.nodeReward = 0.25;
          this.quarryNodeReward = 0.25;
          //is the chain synched and mine and assist others? when true yes
          this.inSynch = false;
          this.blockHeight = 1;//genesis block
          this.inSynchBlockHeight = 0;
          this.longestPeerBlockHeight = 0;
          //just logging the chain creation
          log(chalk.cyan("Genesis block created!"));
          log(chalk.blue("Chain is: "+chalk.green(JSON.stringify(this.chain))));

      }

      registerNode(id,ip,port){

          if (!this.nodes.includes({"id":id,"info":{"ip":ip,"port":port}})) {

              this.nodes.push({"id":id,"info":{"ip":ip,"port":port,"chainlength":this.chain.length,"maxHeight":this.chain.length,"synchBlock":0}});

              // Implement gossiping to share info on new nodes constantly

              // To complex to implement here

          }

      }

      retrieveNodes(){

        return this.nodes;

      }

      incrementPeerNonce(nodeId,len){

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["chainlength"] = len;
          }
        }

      }

      incrementPeerMaxHeight(nodeId,max){

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["maxHeight"] = max;
          }
        }

      }

      incrementPeerSynch(nodeId,synch){

        for (let i in this.nodes){
          if(this.nodes[i]["id"] == nodeId){
            //this.nodes[i]["info"]["chainlength"] = parseInt(this.nodes[i]["info"]["chainlength"])+1;
            this.nodes[i]["info"]["synchBlock"] = synch;
          }
        }

      }

      createGenesisBlock(){
          log("Generation of Genesis Block "+genesisBLK()+" Processing Complete");
          //genBlock.hash = genesisBLK();
          log(chalk.bgGreen(genBlock.timestamp));
          return genBlock;
          //return new Block(Date.parse("2018-02-18 02:18:18"), [], []);//original block creation
      }

      getBlock(num){
          console.log("chain blockheight "+this.blockHeight);
          console.log("chain riser "+this.chainRiser);
          console.log("block height - riser "+(parseInt(this.blockHeight)-parseInt(this.chainRiser)));
          var offset = (parseInt(this.blockHeight)-parseInt(this.chainRiser));
          var newNum = (parseInt(num)-parseInt(offset));
          return this.chain[parseInt(newNum) - 1];
      }

      getLatestBlock(){
        return this.chain[this.chain.length - 1];
      }

      getBlockFromIndex(index){
        return this.chain[this.chain.length - index];
      }

      getIndexLength(){
        return this.chain.length;
      }

      getOmmersAtBlock(num){
        return this.chain[parseInt(num) - 1]["ommers"];
      }

      getLength(){
        //return this.chain.length;
        console.log("what does this.blockHeight equeal then??? "+parseInt(this.blockHeight));
        if(typeof this.blockHeight === 'undefined' || this.blockHeight === null){//if (typeof variable === 'undefined' || variable === null) {
          console.log("WAS NULL FRANKIECOIN GET LENGTH CALLED"+this.blockHeight);
          return 1;
        }else{
          console.log("FRANKIECOIN GET LENGTH CALLED"+this.blockHeight);
          return this.blockHeight;
        }
      }

      getLengthTwo(){
        console.log("chain length "+this.chain.length);
        console.log("last block "+this.getLatestBlock().block)
      }

      getEntireChain() {
          return JSON.stringify(this.chain);
      }

      ///for mining transactions from internal miner
      minePendingTransactions(miningRewardAddress){
          var blockTimeStamp = Date.now();

          //constructor(timestamp, transactions, orders, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0, difficulty = 2) {
          let block = new Block((parseInt(this.getLength())+1), blockTimeStamp, this.pendingTransactions, this.pendingOrders, this.pendingOmmers, this.getLatestBlock().hash);
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
          log(chalk.yellow("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
          this.chain.push(block);
          this.blockHeight=(parseInt(this.getLength())+1);
          log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
          if(this.chain.length > this.chainRiser){
            this.chain.shift();
          }
          log(chalk.yellow("<===========chain length >>>>"+this.blockHeight+"<<<< chain length============>"));
          //end adding trading mechanism
          this.pendingTransactions = [];
          this.pendingOrders = [];
          this.pendingOmmers = [];
      }

      ///for mining transactions from outside miner
      addPendingTransactionsToMinedBLock(miningRewardAddress, minedBlock){
          //////////////////////////////////////////MINING REWARDS IN DATATABASE
          ////////////////////////////////////////////////////////PENDING ORDERS
          log("PENDING ORDERS ARE WHAT????????????????????????"+JSON.stringify(this.pendingOrders));

          var blockTimeStamp = minedBlock["timestamp"];
          console.log("UGGGGHHHHHHH THE BLOCK HEIGHT IS "+this.blockHeight);

          log("BBBBBBBBBBBBBBBBB block time stamp"+minedBlock["timestamp"]+" LAST BLOCK TIME STAMPING "+this.getLatestBlock().timestamp+"MINED  BLOCK PREV HASH "+minedBlock["previousHash"]+" LAST BLOCK HASH "+this.getLatestBlock().hash);
          var blockTimeDiff = ((blockTimeStamp-this.getLatestBlock().timestamp)/1000)
          //constructor(blockheight, timestamp, transactions, orders, ommers, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0, difficulty = 4) {
          let block = new Block((parseInt(this.getLength())+1),minedBlock["timestamp"], this.pendingTransactions, this.pendingOrders, this.pendingOmmers, minedBlock["previousHash"],minedBlock["sponsor"],minedBlock["miner"],"","",minedBlock["hash"],"",minedBlock["nonce"],minedBlock["difficulty"]);
          /////////////////////////////////////////////////DIFFICULTY ADJUSTMENT
          //block.mineBlock(this.difficulty);
          //block.difficulty = minedBlock["difficulty"];
          if(this.getLatestBlock().difficulty){
            this.difficulty = this.getLatestBlock().difficulty;
          }
          ///DIFFICULTY IS PRETTY MUCH AT 5 UNTIL I FINISH TESTINF
          if(blockTimeDiff < 5){
            //temporary difficulty setting stopped at 6
            if(minedBlock["difficulty"] < 5){
              block.difficulty = parseFloat(block.difficulty+1);
              console.log("BLOCK DIFF "+block.difficulty);
            }
          }else{
            if(minedBlock["difficulty"] > 5){
              block.difficulty = parseFloat(block.difficulty-1);
              console.log("BLOCK DIFF "+block.difficulty);
            }
          }
          log(chalk.bgGreen('Differential is '+blockTimeDiff));
          log('Block successfully added by outside miner '+blockTimeStamp);
          log("BLOCK DIFFICULTY "+block.difficulty);
          /////////////////////////////////////////////END DIFFICULTY ADJUSTMENT

          /////////////////////////////////////////HASH VERIFICATION extra check
          try {
            var h = new BLAKE2s(32, decodeUTF8(""));
          } catch (e) {
            alert("Error: " + e);
          };
          //h.update(decodeUTF8(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + JSON.stringify(block.orders) + block.nonce));
          h.update(decodeUTF8(block.previousHash + block.timestamp + block.nonce));
          log("should match the block hash "+h.hexDigest());
          /////////////////////////////////////END HASH VERIFICATION extra check

          //adding a trading mechanism and if below this chain push it processes same block HINT MOVE IT TWO LINES DOWN
          //this.processTrades();
          log(chalk.green("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
          this.chain.push(block);
          this.blockHeight=(parseInt(this.blockHeight)+1);
          log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
          if(this.chain.length > this.chainRiser){
            this.chain.shift();
          }
          log(chalk.green("<===========chain blockHeight >>>>"+this.blockHeight+"<<<< chain blockHeight============>"));

          //end adding trading mechanism
          this.pendingTransactions = [];
          this.pendingOrders = [];
          this.pendingOmmers = [];
      }

      //ths is the peers adding a block needs to be VALIDATED
      addBlockFromPeers(inBlock,callback,peerId){

          if(inBlock.blockHeight == this.getLatestBlock().blockHeight){//per check for block integrity

            console.log("XYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZ");
            console.log("THIS IS AN UNCLE");
            console.log("RESOLVE BY coding weight on chain and timestamp checks");
            console.log("XYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZ");

          }else{//no per check issue (not an uncle or ay off)

              //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
              var block = new Block(parseInt(inBlock.blockHeight), inBlock.timestamp, inBlock.transactions, inBlock.orders, inBlock.ommers, inBlock.previousHash, inBlock.sponsor, inBlock.miner, inBlock.eGEMBackReferenceBlock, inBlock.data, inBlock.hash, inBlock.egemBackReferenceBlockHash, inBlock.nonce, inBlock.difficulty);
              log(chalk.blue("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
              this.chain.push(block);
              this.blockHeight = inBlock.blockHeight;
              //this.chain.blockHeight += 1;
              log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
              if(this.chain.length > this.chainRiser){
                this.chain.shift();
              }
              log(chalk.blue("<===========chain blockHeight >>>>"+this.blockHeight+"<<<< chain blockHeight============>"));
              //careful I have the ischain valid returining true on all tries

    /*****
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
                var block = new Block(parseInt(inBlock.blockHeight),inBlock.timestamp, inBlock.transactions, inBlock.orders, inBlock.ommers, inBlock.previousHash, inBlock.sponsor, inBlock.miner, inBlock.eGEMBackReferenceBlock, inBlock.data, inBlock.hash, inBlock.egemBackReferenceBlockHash, inBlock.nonce, inBlock.difficulty);
                log(chalk.red("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
                this.chain.push(block);
                this.blockHeight += 1;
                log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
                if(this.chain.length > this.chainRiser){
                  this.chain.shift();
                }
                log(chalk.red("<===========chain blockHeight >>>>"+this.blockHeight+"<<<< chain blockHeight============>"));
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
    ******/
            if(this.isChainValid() == false){
              this.chain.pop();
              log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXX ALERT XXXXXXXXXXXXXXX Block NOT added XXXXXXXXXXXXXXXX ALERT XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
              return false;
            }else{
              log("Block added from peers");
              return true;
            }

        }///end peer check

      }

      //this is the peers adding a block needs to be VALIDATED
      addBlockFromDatabase(dbBlock,msg){

        console.log("adding block from level to memory: "+chalk.green(msg));

        console.log("can we get the database data "+this.getLatestBlock().hash+" compared to "+JSON.parse(dbBlock)["blockHeight"]+" "+JSON.parse(dbBlock)["previousHash"])
        //if all that consensus stuff I am going to add....then
        //here is where I check if two things and I think make them globals
        //1 issync should be YES
        //2 previous hash must match current chain top hash
        if(this.getLatestBlock().hash == JSON.parse(dbBlock)["previousHash"]){
          log("----------------------------------------------------");
          log("yes DB BLOCK prev hash of "+JSON.parse(dbBlock)["previousHash"]+" matches the hash of chain "+this.getLatestBlock().hash);
          log("----------------------------------------------------");
        }else{
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          log("no DB BLOCK prev hash of "+JSON.parse(dbBlock)["previousHash"]+" does not match the hash of chain "+this.getLatestBlock().hash);
          log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        }
        //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
        var block = new Block(parseInt(JSON.parse(dbBlock)["blockHeight"]), JSON.parse(dbBlock)["timestamp"], JSON.parse(dbBlock)["transactions"], JSON.parse(dbBlock)["orders"], JSON.parse(dbBlock)["ommers"], JSON.parse(dbBlock)["previousHash"], JSON.parse(dbBlock)["sponsor"], JSON.parse(dbBlock)["miner"], JSON.parse(dbBlock)["eGEMBackReferenceBlock"], JSON.parse(dbBlock)["data"], JSON.parse(dbBlock)["hash"], JSON.parse(dbBlock)["egemBackReferenceBlockHash"], JSON.parse(dbBlock)["nonce"], JSON.parse(dbBlock)["difficulty"],JSON.parse(dbBlock)["chainStateHash"]);
        log(chalk.green("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
        this.chain.push(block);
        this.blockHeight = JSON.parse(dbBlock)["blockHeight"];
        log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
        if(this.chain.length > this.chainRiser){
          this.chain.shift();
        }
        log(chalk.red("<===========chain blockHeight >>>>"+this.blockHeight+"<<<< chain blockHeight============>"));
        //careful I have the ischain valid returining true on all tries
        if(this.isChainValid() == false){
          this.chain.pop();
          log("Block is not added and will be removed")
        }else{
          log("Block added from DATABASE")
        }
      }

      //this is the peers adding a block needs to be VALIDATED
      addBlockFromDataStream(dbBlock,msg){

        console.log("adding block from level to memory: "+chalk.green(msg));

        var block = new Block(parseInt(JSON.parse(dbBlock)["blockHeight"]), JSON.parse(dbBlock)["timestamp"], JSON.parse(dbBlock)["transactions"], JSON.parse(dbBlock)["orders"], JSON.parse(dbBlock)["ommers"], JSON.parse(dbBlock)["previousHash"], JSON.parse(dbBlock)["sponsor"], JSON.parse(dbBlock)["miner"], JSON.parse(dbBlock)["eGEMBackReferenceBlock"], JSON.parse(dbBlock)["data"], JSON.parse(dbBlock)["hash"], JSON.parse(dbBlock)["egemBackReferenceBlockHash"], JSON.parse(dbBlock)["nonce"], JSON.parse(dbBlock)["difficulty"],JSON.parse(dbBlock)["chainStateHash"]);
        log(chalk.green("<===========chain length >>>>"+this.chain.length+"<<<< chain length============>"));
        this.chain.push(block);
        this.blockHeight = JSON.parse(dbBlock)["blockHeight"];
        log(chalk.yellow("<===========chain riser >>>>"+this.chainRiser+"<<<< chain riser============>"));
        if(this.chain.length > this.chainRiser){
          this.chain.shift();
        }
        log(chalk.red("<===========chain blockHeight >>>>"+this.blockHeight+"<<<< chain blockHeight============>"));
        //careful I have the ischain valid returining true on all tries

      }

      createTransaction(transaction){
          this.pendingTransactions.push(transaction);
      }

      removeTransactions(transactions){
          ///////////removes any transactions in the submitted pool from pending
          var incomingTx = transactions;
          var existingPendingTx = this.pendingTransactions;
          var replacementTx = []
          for(ptx in incomingTx){
            for(etx in existingPendingTx){
              if(incomingTx[ptx]["hash"] == existingPendingTx[etx]["hash"]){
                //do nothing removes this element
              }else{
                replacementTx.push(existingPendingTx[etx]);
              }
            }
          }
          this.pendingTransactions = [];
          this.pendingTransactions = replacementTx;
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

      removeOrders(orders){
          /////////////////removes any orders in the submitted pool from pending
          var incomingOx = orders;
          var existingPendingOx = this.pendingOrders;
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
          this.pendingOrders = [];
          this.pendingOrders = replacementOx;
      }

      addOmmer(ommer){
        this.pendingOmmers.push(ommer);
      }

      getAirdropBalanceFromEgem(address,callback,airdrop) {
          //grab latest EGEM BLock
          web3.eth.getBalance(address, 1530000, async function (error, result) {
          	if (!error){
          		//console.log('Egem:', web3.utils.fromWei(result,'ether')); // Show the ether balance after converting it from Wei
              var responder = await callback(parseFloat(web3.utils.fromWei(result,'ether')*2));
              //console.log("responder equals "+responder);
              //return result;
          	}else{
          		console.log('Houston we have a promblem: ', error); // Should dump errors here
            }
          });

      }

      getBalanceOfAddress(address){

          let balance = [];

          var airdrop;

          //calling the airdrop balance
          var mycallback1 = async function(response){
            //console.log("we have returned"+response);
            airdrop = response;
            //console.log("second check on airdrop" +airdrop);
            return airdrop;
          }

          this.getAirdropBalanceFromEgem(address,mycallback1);

          //setTimeout(async function(){await console.log("my test is "+airdrop);},500);

          //console.log("post timeout "+airdrop);

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

          async function returnTime(){
            if(airdrop){
              //console.log("okay"+balance["SFRX"]+airdrop);
              var existing = parseFloat(balance["SFRX"]);
              if(!existing){existing = 0};
              var orig = parseFloat(airdrop);
              if(!orig){orig = 0};
              //console.log("okay2"+existing+orig);
              var newbal = await parseFloat(existing + orig);
              balance["SFRX"] = newbal;
              console.log(balance);
              return balance;
            }else{
              console.log("not yet")
              setTimeout(function(){returnTime();},700);
            }
          }

          returnTime(airdrop,balance);

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

          var allsellsS = myblock.filter(
            function(myblock){ return ( myblock.buyOrSell=="SELL" ); }
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
            var numSells = 0;

            /*****

            for(var transactions in allsells){
              numSells+=1;
              if(allbuys[ordersofbuy]["pairBuy"] == allsells[transactions]["pairBuy"] && allbuys[ordersofbuy]["pairSell"] == allsells[transactions]["pairSell"]){
                log("99999999999999999 are we transacting? "+allbuys[ordersofbuy]["pairSell"]+allbuys[ordersofbuy]["price"]+" and "+allsells[transactions]["pairSell"]+allsells[transactions]["price"]);
                if(allbuys[ordersofbuy]["price"] >= allsells[transactions]["price"]){
                    if(allbuys[ordersofbuy].amount < allsells[transactions].amount){
                      log("transaction created is "+allsells[transactions]["fromAddress"]+allbuys[ordersofbuy]["fromAddress"]+allbuys[ordersofbuy]["amount"]+allbuys[ordersofbuy]["pairBuy"]);
                      this.createTransaction(new Transaction(allsells[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allbuys[ordersofbuy]["amount"], allbuys[ordersofbuy]["pairBuy"]));
                      this.createTransaction(new Transaction(allbuys[ordersofbuy]["fromAddress"], allsells[transactions]["fromAddress"], parseFloat(allbuys[ordersofbuy]["amount"]*allsells[transactions]["price"]), allbuys[ordersofbuy]["pairSell"]));
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
                      BlkDB.addOrder("ox:SELL"+":"+allsells[transactions]["pairBuy"]+":"+allsells[transactions]["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);

                    }else if(allbuys[ordersofbuy].amount > allsells[transactions].amount){
                      this.createTransaction(new Transaction(allsells[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allsells[transactions]["amount"], allbuys[ordersofbuy]["pairBuy"]));
                      this.createTransaction(new Transaction(allbuys[ordersofbuy]["fromAddress"], allsells[transactions]["fromAddress"], parseFloat(allsells[transactions]["amount"]*allsells[transactions]["price"]), allbuys[ordersofbuy]["pairSell"]));
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
                      BlkDB.addOrder("ox:BUY"+":"+allbuys[ordersofbuy]["pairBuy"]+":"+allbuys[ordersofbuy]["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
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
            ****/

            if(numSells == 0){
              console.log("adding buy order to level db "+"ox:BUY"+":"+allbuys[ordersofbuy]["pairBuy"]+":"+allbuys[ordersofbuy]["pairSell"]+":"+allbuys[ordersofbuy]["transactionID"]+":"+allbuys[ordersofbuy]["timestamp"]+allbuys[ordersofbuy]);
              BlkDB.addOrder("ox:BUY"+":"+allbuys[ordersofbuy]["pairBuy"]+":"+allbuys[ordersofbuy]["pairSell"]+":"+allbuys[ordersofbuy]["transactionID"]+":"+allbuys[ordersofbuy]["timestamp"],allbuys[ordersofbuy]);
            }

          }///end ordersofbuy loop

          for(var ordersofsell in allsellsS){

            var allbuysS = myblock.filter(
              //function(myblock){ return ( myblock.buyOrSell=="SELL" && myblock.pairSell==ordersofbuy["pairSell"]); }
              function(myblock){ return ( myblock.buyOrSell=="BUY" ); }
            );

            log("88888888888888888888 here is the BUYS log"+JSON.stringify(allsells));
            var numBuys = 0;
            /****
            for(var transactions in allbuysS){
              numBuys+=1;
              //if(allbuys[ordersofbuy]["pairBuy"] == allsells[transactions]["pairBuy"] && allbuys[ordersofbuy]["pairSell"] == allsells[transactions]["pairSell"]){
              if(allsellsS[ordersofsell]["pairBuy"] == allbuysS[transactions]["pairBuy"] && allsellsS[ordersofsell]["pairSell"] == allbuysS[transactions]["pairSell"]){
                log("GGGGGGGGGGGGGGGS are we transacting? "+allsellsS[ordersofsell]["pairSell"]+allsellsS[ordersofsell]["price"]+" and "+allbuysS[transactions]["pairSell"]+allbuysS[transactions]["price"]);
                if(allsellsS[ordersofsell]["price"] <= allbuysS[transactions]["price"]){
                    if(allsellsS[ordersofsell].amount < allbuysS[transactions].amount){
                      log("transaction created is "+allbuysS[transactions]["fromAddress"]+allsellsS[ordersofsell]["fromAddress"]+allsellsS[ordersofsell]["amount"]+allsellsS[ordersofsell]["pairBuy"]);
                      this.createTransaction(new Transaction(allbuysS[transactions]["fromAddress"], allsellsS[ordersofsell]["fromAddress"], allsellsS[ordersofsell]["amount"], allsellsS[ordersofsell]["pairBuy"]));
                      this.createTransaction(new Transaction(allsellsS[ordersofsell]["fromAddress"], allbuysS[transactions]["fromAddress"], parseFloat(allsellsS[ordersofsell]["amount"]*allbuysS[transactions]["price"]), allsellsS[ordersofsell]["pairSell"]));
                      var newOrderAmpount = allbuysS[transactions]["amount"]-allsellsS[ordersofsell]["amount"];
                      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
                      //and a new one gets open
                      var replacementOrder = new Order(
                        allbuysS[transactions]["fromAddress"],
                        'SELL',
                        allbuysS[transactions]["pairBuy"],
                        allbuysS[transactions]["pairSell"],
                        newOrderAmpount,
                        allbuysS[transactions]["price"],
                        '',
                        ''
                      );
                      this.createOrder(replacementOrder,allbuysS[transactions]["originationID"]);
                      BlkDB.addOrder("ox:SELL"+":"+allbuysS[transactions]["pairBuy"]+":"+allbuysS[transactions]["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);

                    }else if(allsellsS[ordersofsell].amount > allbuysS[transactions].amount){
                      this.createTransaction(new Transaction(allbuysS[transactions]["fromAddress"], allbuys[ordersofbuy]["fromAddress"], allbuysS[transactions]["amount"], allbuys[ordersofbuy]["pairBuy"]));
                      this.createTransaction(new Transaction(allbuys[ordersofbuy]["fromAddress"], allbuysS[transactions]["fromAddress"], parseFloat(allbuysS[transactions]["amount"]*allbuysS[transactions]["price"]), allbuys[ordersofbuy]["pairSell"]));
                      var newOrderAmpount = allbuys[ordersofbuy]["amount"]-allbuysS[transactions]["amount"];
                      //constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price, transactionID, originationID){
                      var replacementOrder = new Order(
                        allsellsS[ordersofsell]["fromAddress"],
                        'BUY',
                        allsellsS[ordersofsell]["pairBuy"],
                        allsellsS[ordersofsell]["pairSell"],
                        newOrderAmpount,
                        allsellsS[ordersofsell]["price"],
                        '',
                        ''
                      );
                      this.createOrder(replacementOrder,allsellsS[ordersofsell]["originationID"]);
                      BlkDB.addOrder("ox:BUY"+":"+allsellsS[ordersofsell]["pairBuy"]+":"+allsellsS[ordersofsell]["pairSell"]+":"+replacementOrder.transactionID+":"+replacementOrder.timestamp,replacementOrder);
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
            ****/

            if(numBuys == 0){
              console.log("adding sell order to level db "+"ox:SELL"+":"+allsellsS[ordersofsell]["pairBuy"]+":"+allsellsS[ordersofsell]["pairSell"]+":"+allsellsS[ordersofsell]["transactionID"]+":"+allsellsS[ordersofsell]["timestamp"]+allsellsS[ordersofsell]);
              BlkDB.addOrder("ox:SELL"+":"+allsellsS[ordersofsell]["pairBuy"]+":"+allsellsS[ordersofsell]["pairSell"]+":"+allsellsS[ordersofsell]["transactionID"]+":"+allsellsS[ordersofsell]["timestamp"],allsellsS[ordersofsell]);
            }

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
        if(this.isChainValid() && this.getLength() == length){
          //this.chain.inSynch = true;
          log("4444444444444444     CHAIN IS SYNCH at block "+this.getLength()+"    4444444444444444444");
          return true;
        }else{
          log("55555555555555555     CHAIN IS NOT SYNCH at block "+this.getLength()+"     5555555555555555555");
          return false;
        }
      }

      isChainValid() {
        return true;/////////REWORKING THIS FUNCTION FOR POST BLOCK ENTRY CHECKS
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
    setBlockchainDB:setBlockchainDB,
    setChainState:setChainState,
    Hash:Hash
}
