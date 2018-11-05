var sapphirechain = require("./block.js");
var BLAKE2s = require("./blake2s.js");
const chalk = require('chalk');
const log = console.log;

//let frankieCoin = new sapphirechain.Blockchain();
let ctr = 0;

var msg = "genesis message"
var length = 32;
var key = "ax8906hg4c";
var myDigestVar = "";
var difc = 0;

var Miner = class Miner {
  constructor(msg, length, key, address, sponsor, chain){
    this.msg = msg,
    this.length = 32,
    this.key = key,
    this.address = address,
    this.sponsor = sponsor,
    this.chain = chain
  }

  decodeUTF8(s) {
    var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;
  }

  getBalanceOfAddress(addr){
    var getBalance = this.chain.getBalanceOfAddress(addr);
    //log('\nMiners Function Balance of '+addr+' is', getBalance);
    return getBalance;
  }

  mpt2(){
    this.chain.minePendingTransactions(this.address);
  }

  mpt3(minerAddress,minedBlock){
    log(minerAddress+" aha this is my mined block "+JSON.stringify(minedBlock))
    this.chain.addPendingTransactionsToMinedBLock(minerAddress,minedBlock);
  }

  calculateDigest(word,diff,pass){
    // Get message converting to Unix line breaks.
    //log("calculating"+word+"diff"+diff+"pass"+pass);
    if(word){
      msg = word;
    }else{
      this.msg;
    }
    if(diff){
      difc = diff;
    }
    ctr = ctr+1;
    //log("in function"+ctr);
    try {
      var h = new BLAKE2s(length, this.decodeUTF8(key));
    } catch (e) {
      log("Error: " + e);
    }
    h.update(this.decodeUTF8(msg));
    myDigestVar = h.hexDigest();
    //log(myDigestVar.substring(0,2));
    if(myDigestVar.substring(0,2) == "00" && difc == 0){
      log("miner hashed in "+ctr+" passes");

      //io().emit("chat message", "miner hashed in "+ctr+" passes");
      //add a block
      this.chain.minePendingTransactions(this.address);
      //io().emit("broadcast message", JSON.stringify(frankieCoin.getLatestBlock()));
      log("\nThe block is now at: "+JSON.stringify(this.chain.getLatestBlock()));
      log('\nwhere I call it in Miner the Balance of '+this.address+' is', this.chain.getBalanceOfAddress(this.address));

      //log('\nBalance of address1 is', frankieCoin.getBalanceOfAddress('address1'));

      //log('\nBalance of 0x5c4ae12c853012d355b5ee36a6cb8285708760e6 is', this.chain.getBalanceOfAddress('0x5c4ae12c853012d355b5ee36a6cb8285708760e6'));
      //log('\nBalance of '+sponsor+' is', frankieCoin.getBalanceOfAddress(sponsor));
      //log("processed trades SPHR EGEM = "+this.chain.processTrades()["SPHREGEM"]);
      //log("processed trades SPHR XSH = "+this.chain.processTrades()["SPHRXSH"]);

      log("entire chain: "+this.chain.getEntireChain());
    }else if(myDigestVar.substring(0,2) == "00" && difc >0){
      log("miner hashed in "+ctr+" passes and we are doing a difficulty run now");
    }else{
      var tempit = msg;
      //log(tempit);
      tempit = tempit.substring(0,(tempit.length-ctr.toString().length))+ctr;
      msg = tempit;
      //log(tempit);
      //log(tempit.substring(0,(tempit.length-ctr.toString().length)));
      if (ctr%250 == 0){log(ctr);}
      if(ctr % 2000 != 0){
        this.calculateDigest();
      }
    }
    if(difc > 0){
      difc--;
      log("difficulty level"+difc);
      this.calculateDigest("difficulty level"+difc);
    }
  }
}

module.exports = {
    Miner:Miner
}
