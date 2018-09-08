var BLAKE2s = require("./blake2s.js")
//testing web3
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));

var genesisBLK = function genesisBLK() {
  var prevHash = "0";
  var txtData = "Blake2s Genesis for EtherGem Opal Coin 25 Feb 2018";
  var timestamp = Date.now();
  var hash = "";
  console.log("here I am creating genesis block");
  //console.log(powHash);
  try {
    var h = new BLAKE2s(32, decodeUTF8(""));
  } catch (e) {
    console.log("Error: " + e);
  };

  console.log(prevHash+timestamp+hash+txtData);

  h.update(decodeUTF8(prevHash+timestamp+hash+txtData));

  return h.hexDigest();
}

function decodeUTF8(s) {
  var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
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
    constructor(fromAddress, buyOrSell, pairBuy, pairSell, amount, price){
        this.fromAddress = fromAddress;
        this.buyOrSell = buyOrSell;
        this.pairing = pairBuy+pairSell;
        this.pairBuy = pairBuy,
        this.pairSell = pairSell,
        this.amount = amount;
        this.price = price;
        this.state = "open"
    }
}

async function getBlockFromEgem(callback) {
  //grab latest EGEM BLock
  var result = await web3.eth.getBlock("latest");
  //console.log(result);
  callback(result);
  // expected output: "resolved"
}

var currentEgemBlock = 472;
var currentEgemBlockHash = "0x0ed923fa347268f2d7b8e4a1a8d0ce61f810512ddaaec6729e66b004eb61e5e7";
var currentEgemBlockCallBack = function(block) {
  //console.log("in callback function")
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
  console.log(h.hexDigest().toString());
}

var Block = class Block {

    constructor(timestamp, transactions, orders, previousHash = '', sponsor, miner, egemBRBlock = '', data, hash, egemBRHash = '', nonce = 0) {

        console.log("Block Constructure and hash is "+hash+" timestamp is "+timestamp+" egemBRBlock "+egemBRBlock+" egemBRBLockHash "+egemBRHash);

        if(egemBRHash == ''){
          getBlockFromEgem(currentEgemBlockCallBack);
        }


        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        //adding orders for dex
        this.orders = orders;
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
        console.log("constructor again : "+egemBRBlock+" "+egemBRHash+" "+currentEgemBlock+" "+currentEgemBlockHash);
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
        this.sponsor = '0x2025ed239a8dec4de0034a252d5c5e385b73fcd0';//osoese contract address
        this.miner = '0x0666bf13ab1902de7dee4f8193c819118d7e21a6';//osoese original wallet
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
      }

    calculateHash() {
      try {
        var h = new BLAKE2s(32, decodeUTF8(""));
      } catch (e) {
        alert("Error: " + e);
      };
      h.update(decodeUTF8(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + JSON.stringify(this.orders) + this.nonce));
      //h.update(decodeUTF8(this.previousHash + this.timestamp + this.nonce));
      return h.hexDigest();
        //return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }



    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            if(this.nonce%1500 == 0){
              console.log("BLOCK NOT MINED: " + this.nonce);
            }

            this.hash = this.calculateHash();
        }
        console.log("BLOCK MINED: " + this.hash);
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
          //can add a this.pendingOrders
          this.pendingOrders = [];
          //then also add a this.tradePendingTransactions
          this.miningReward = 100;
          console.log("genesis block created");
          console.log("chain is"+JSON.stringify(this.chain));
      }

      registerNode(id,ip,port) {

          if (!this.nodes.includes({"id":id,"info":{"ip":ip,"port":port}})) {

              this.nodes.push({"id":id,"info":{"ip":ip,"port":port,"chainlength":this.chain.length}});

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

      createGenesisBlock() {
          console.log("This is where I can include this: "+genesisBLK()+" in the genesis block... (but its not there yet)");
          return new Block(Date.parse("2017-01-01"), [], []);
      }

      getBlock(num) {
          return this.chain[parseInt(num) - 1];
      }

      getLatestBlock() {
          return this.chain[this.chain.length - 1];
      }

      getLength(){
        return this.chain.length;
      }

      getEntireChain() {
          return JSON.stringify(this.chain);
      }

      minePendingTransactions(miningRewardAddress){
          var blockTimeStamp = Date.now();

          let block = new Block(blockTimeStamp, this.pendingTransactions, this.pendingOrders, this.getLatestBlock().hash);
          block.mineBlock(this.difficulty);
          console.log('Block successfully mined! '+blockTimeStamp);
          ////extra check
          try {
            var h = new BLAKE2s(32, decodeUTF8(""));
          } catch (e) {
            alert("Error: " + e);
          };
          h.update(decodeUTF8(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + JSON.stringify(block.orders) + block.nonce));
          //h.update(decodeUTF8(block.previousHash + block.timestamp + block.nonce));
          console.log("should match the block hash "+h.hexDigest());
          ////extra check

          //adding a trading mechanism and if below this chain push it processes same block HINT MOVE IT TWO LINES DOWN
          this.processTrades();
          this.chain.push(block);

          //end adding trading mechanism
          this.pendingTransactions = [
              new Transaction(null, miningRewardAddress, this.miningReward, "SPHR")
          ];
          this.pendingOrders = [];
      }

      //th8s is the peers adding a block needs to be VALIDATED
      addBlockFromPeers(inBlock){
        //if all that consensus stuff I am going to add....then
        //here is where I check if two things and I think make them globals
        //1 issync should be YES
        //2 previous hash must match current chain top hash
        if(this.getLatestBlock().hash == inBlock.previousHash){
          console.log("----------------------------------------------------");
          console.log("yes inblock prev hash of "+inBlock.previousHash+" matches the hash of chain "+this.getLatestBlock().hash);
          console.log("----------------------------------------------------");

          //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
          var block = new Block(inBlock.timestamp, inBlock.transactions, inBlock.orders, inBlock.previousHash, inBlock.sponsor, inBlock.miner, inBlock.eGEMBackReferenceBlock, inBlock.data, inBlock.hash, inBlock.egemBackReferenceBlockHash, inBlock.nonce);
          this.chain.push(block);
          //careful I have the ischain valid returining true on all tries

        }else{
          console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          console.log("no inblock prev hash of "+inBlock.previousHash+" does not match the hash of chain "+this.getLatestBlock().hash);
          console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        }

        if(this.isChainValid() == false){
          this.chain.pop();
          console.log("Block is not added and will be removed");
          return false;
        }else{
          console.log("Block added from peers");
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
          console.log("----------------------------------------------------");
          console.log("yes DB BLOCK prev hash of "+dbBlock.previousHash+" matches the hash of chain "+this.getLatestBlock().hash);
          console.log("----------------------------------------------------");
        }else{
          console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
          console.log("no DB BLOCK prev hash of "+dbBlock.previousHash+" does not match the hash of chain "+this.getLatestBlock().hash);
          console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        }
        //passing in the hash because it is from the peer but really it should hash to same thing so verifiy thiis step int he future
        var block = new Block(dbBlock.timestamp, dbBlock.transactions, dbBlock.orders, dbBlock.previousHash, dbBlock.sponsor, dbBlock.miner, dbBlock.eGEMBackReferenceBlock, dbBlock.data, dbBlock.hash, dbBlock.egemBackReferenceBlockHash, dbBlock.nonce);
        this.chain.push(block);
        //careful I have the ischain valid returining true on all tries
        if(this.isChainValid() == false){
          this.chain.pop();
          console.log("Block is not added and will be removed")
        }else{
          console.log("Block added from DATABASE")
        }
      }

      createTransaction(transaction){
          this.pendingTransactions.push(transaction);
      }

      createOrder(order){
          this.pendingOrders.push(order);
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

          //for(const block of this.chain){
              var block = this.getLatestBlock();
              for(const orders of block.orders){


                      console.log("inside trades "+orders.pairBuy+orders.state+orders.amount+orders.buyOrSell);

                      if(tradeBalance[orders.pairBuy] == null){
                        tradeBalance[orders.pairBuy] = 0;
                        console.log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairing]);
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
                          console.log("about to transact if "+ordersTX.buyOrSell+" = SELL and "+ordersTX.state+" = open and "+ordersTX.pairBuy+ " = "+orders.pairBuy);
                          if(ordersTX.buyOrSell == "SELL" && ordersTX.state == "open" && ordersTX.pairBuy == orders.pairBuy){
                            console.log("**************OUTER SELL CONDITION MET***************");
                            console.log("price"+ordersTX.price+" "+tradeOrders[orders.pairBuy]["price"]);
                            console.log("amount"+ordersTX.amount+" "+tradeOrders[orders.pairBuy]["amount"]);
                            if(ordersTX.price <= tradeOrders[orders.pairBuy]["price"] && ordersTX.amount <= tradeOrders[orders.pairBuy]["amount"]){
                              console.log("***CREATE ORDER*****this is where I would transact some of "+orders.pairBuy+" and change the status to closed or partial");
                              //craft the trade transaction
                              var amounttoBuyTx = ordersTX.amount;
                              var amountToSellOrder = tradeOrders[orders.pairBuy]["amount"];
                              var statusOrderSupply = "open";
                              var statusOrderDemand = "open";
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
                                //finally if the two oders are equal
                              }else if(ordersTX.amount == tradeOrders[orders.pairBuy]["amount"]){
                                amountToSellOrder = tradeOrders[orders.pairBuy]["amount"];
                                amounttoBuyTx = ordersTX.amount;
                              }else{

                              }
                              //creates the trade transaction
                              this.createTransaction(new Transaction(ordersTX.fromAddress, tradeOrders[orders.pairBuy]["fromAddress"], tradeOrders[orders.pairBuy]["amount"], orders.pairBuy));
                              //update the trade order
                              //need a variable for partial or filled
                              this.createOrder(new Order(tradeOrders[orders.pairBuy]["fromAddress"],'BUY',orders.pairing,(tradeOrders[orders.pairBuy]["amount"]-ordersTX.amount,tradeOrders[orders.pairBuy]["price"])));
                            }
                          }
                        }
                      }

                      //this is incorrect information
                      if(tradeOrders[orders.pairBuy]["fromAddress"]){
                        console.log('in trading Balance of '+tradeOrders[orders.pairBuy]["fromAddress"]+' is'+this.getBalanceOfAddress(tradeOrders[orders.pairBuy]["fromAddress"]));
                      }

                      if(orders.buyOrSell == "BUY" && orders.state == "open"){
                          tradeBalance[orders.pairBuy] -= parseInt(orders.amount);
                          console.log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairBuy]);
                      }

                      if(orders.buyOrSell == "SELL" && orders.state == "open"){
                          tradeBalance[orders.pairBuy] += parseInt(orders.amount);
                          console.log("tb["+orders.pairBuy+"]"+tradeBalance[orders.pairBuy]);
                      }



              }

          //}

          console.log("output of pending orders "+JSON.stringify(tradeOrders)+"tradebalance"+JSON.stringify(tradeBalance));

          return tradeBalance;

      }

      isChainValid() {
          for (let i = 1; i < this.chain.length; i++){
              console.log("current block "+JSON.stringify(this.chain[i]))
              console.log("current block "+JSON.stringify(this.getBlock(i+1)));
              const currentBlock = this.chain[i];
              if (this.chain[i].hash !== this.chain[i].calculateHash()) {
                  console.log("would be returning false here: cb hash "+this.chain[i].hash+" calcHash "+this.getBlock(i+1).calculateHash());
                  console.log("previoushash"+this.getBlock(i+1).previousHash+"timestamp"+this.getBlock(i+1).timestamp+"nonce"+this.getBlock(i+1).nonce);
                  console.log("double check calc is same"+this.getBlock(i+1).calculateHash());
                  ///triple check
                  try {
                    var h = new BLAKE2s(32, decodeUTF8(""));
                  } catch (e) {
                    alert("Error: " + e);
                  };
                  h.update(decodeUTF8(this.chain[i+1].previousHash + this.chain[i+1].timestamp + JSON.stringify(this.chain[i+1].transactions) + JSON.stringify(this.chain[i+1].orders) + this.chain[i+1].nonce));
                  //h.update(decodeUTF8(this.getBlock(i+1).previousHash + this.getBlock(i+1).timestamp + this.getBlock(i+1).nonce));
                  console.log(h.hexDigest());
                  //return false;
              }else{
                console.log("8888888888888888WE FIX IT**************");
              }
              const previousBlock = this.chain[i - 1];
              if (this.chain[i].previousHash !== this.chain[i-1].hash) {
                  console.log("would be returning false here: cb prevhash "+currentBlock.previousHash+" prev block hash "+previousBlock.hash);
                  //return false;
              }
          }

          return true;
      }
  }

module.exports = {
    genesisBLK:genesisBLK,
    Transaction:Transaction,
    Order:Order,
    Block:Block,
    Blockchain:Blockchain,
    Hash,Hash
}
