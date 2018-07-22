var BLAKE2s = require("./public/js/blake2s.js")

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
    constructor(fromAddress, buyOrSell, pairing, amount, price){
        this.fromAddress = fromAddress;
        this.buyOrSell = buyOrSell;
        this.pairing = pairing;
        this.amount = amount;
        this.price = price;
        this.state = "open"
    }
}

var Block = class Block {

    constructor(timestamp, transactions, orders, previousHash = '', sponsor, miner, egemBRBlock, data) {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        //adding orders for dex
        this.orders = orders;
        this.hash = this.calculateHash().toString();
        this.nonce = 0;
        //tie this to the main EGEM chain
        this.eGEMBackReferenceBlock = '472';
        this.egemBackReferenceBlockHash = '0x0ed923fa347268f2d7b8e4a1a8d0ce61f810512ddaaec6729e66b004eb61e5e7';
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
      h.update(decodeUTF8(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce));
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
          this.difficulty = 3;//can be 1 or more later
          this.pendingTransactions = [];
          //can add a this.pendingOrders
          this.pendingOrders = [];
          //then also add a this.tradePendingTransactions
          this.miningReward = 100;
          console.log("genesis block created");
          console.log("chain is"+JSON.stringify(this.chain));
      }

      createGenesisBlock() {
          console.log("This is where I can include this: "+genesisBLK()+" in the genesis block... (but its not there yet)");
          return new Block(Date.parse("2017-01-01"), [], "0");
      }

      getLatestBlock() {
          return this.chain[this.chain.length - 1];
      }

      getEntireChain() {
          return JSON.stringify(this.chain);
      }

      minePendingTransactions(miningRewardAddress){
          let block = new Block(Date.now(), this.pendingTransactions, this.pendingOrders, this.getLatestBlock().hash);
          block.mineBlock(this.difficulty);
          console.log('Block successfully mined!');
          this.chain.push(block);
          //adding a trading mechanism
          this.processTrades();
          //end adding trading mechanism
          this.pendingTransactions = [
              new Transaction(null, miningRewardAddress, this.miningReward, "SPHR")
          ];
          this.pendingOrders = [];
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

                  if(balance[trans.ticker] == null && (trans.fromAddress === address || trans.toAddress === address)){
                      balance[trans.ticker] = 0;
                  }

                  if(trans.fromAddress === address){
                      balance[trans.ticker] -= trans.amount;
                  }

                  if(trans.toAddress === address){
                      balance[trans.ticker] += trans.amount;
                  }
              }

          }

          return balance;
      }

      processTrades(){

          let tradeBalance = [];

          for(const block of this.chain){

              for(const orders of block.orders){

                  //for(const pairings of orders.pairings){
                      /*******this was the line I created to set the balance to zero****
                      if(tradeBalance[orders.ticker] == null && (trans.fromAddress === address || trans.toAddress === address)){
                          tradeBalance[orders.ticker] = 0;
                      }
                      ******/
                      console.log("inside trades "+orders.pairing+orders.state+orders.amount+orders.buyOrSell);

                      if(tradeBalance[orders.pairing] == null){
                        tradeBalance[orders.pairing] = 0;
                        console.log("tb["+orders.pairing+"]"+tradeBalance[orders.pairing]);
                      }

                      if(orders.buyOrSell == "BUY" && orders.state == "open"){
                          tradeBalance[orders.pairing] -= parseInt(orders.amount);
                          console.log("tb["+orders.pairing+"]"+tradeBalance[orders.pairing]);
                      }

                      if(orders.buyOrSell == "SELL" && orders.state == "open"){
                          tradeBalance[orders.pairing] += parseInt(orders.amount);
                          console.log("tb["+orders.pairing+"]"+tradeBalance[orders.pairing]);
                      }

                      //console.log(tradeBalance.toString());

                  //}

              }

          }

          return tradeBalance;

      }

      isChainValid() {
          for (let i = 1; i < this.chain.length; i++){
              const currentBlock = this.chain[i];
              const previousBlock = this.chain[i - 1];
              if (currentBlock.hash !== currentBlock.calculateHash()) {
                  return false;
              }
              if (currentBlock.previousHash !== previousBlock.hash) {
                  return false;
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
    Blockchain:Blockchain
}
