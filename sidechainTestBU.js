const log = console.log;
var sapphirechain = require("./block.js")
var BLAKE2s = require("./public/js/blake2s.js")

let frankieCoin = new sapphirechain.Blockchain();
let ctr = 0;

var msg = "genesis message"
var length = 32;
var key = "ax8906hg4c";
var myDigestVar = "";
var miner = "0x0666bf13ab1902de7dee4f8193c819118d7e21a6";

var Miner = class Miner {
  constructor(msg, length, key, address, sponsor){
    this.msg = msg,
    this.length = 32,
    this.key = key,
    this.address = address,
    this.sponsor = sponsor
  }

  decodeUTF8(s) {
    var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;
  }

  calculateDigest(word){
    // Get message converting to Unix line breaks.
    if(word){
      msg = word;
    }else{
      this.msg;
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
    log(myDigestVar.substring(0,2));
    if(myDigestVar.substring(0,2) == "00"){
      log("miner hashed in "+ctr+" passes");

      //io().emit("chat message", "miner hashed in "+ctr+" passes");
      //add a block
      frankieCoin.minePendingTransactions(miner);
      //io().emit("broadcast message", JSON.stringify(frankieCoin.getLatestBlock()));
      log("\nThe block is now at: "+JSON.stringify(frankieCoin.getLatestBlock()));
      log('\nBalance of '+miner+' is', frankieCoin.getBalanceOfAddress(miner));

      //log('\nBalance of address1 is', frankieCoin.getBalanceOfAddress('address1'));

      log('\nBalance of 0x5c4ae12c853012d355b5ee36a6cb8285708760e6 is', frankieCoin.getBalanceOfAddress('0x5c4ae12c853012d355b5ee36a6cb8285708760e6'));
      //log('\nBalance of '+sponsor+' is', frankieCoin.getBalanceOfAddress(sponsor));
      log("entire chain: "+frankieCoin.getEntireChain());
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
  }
}

/***
function decodeUTF8(s) {
  var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
}

function calculateDigest(word) {
  // Get message converting to Unix line breaks.
  if(word){
    msg = word;
  }
  ctr = ctr+1;
  //log("in function"+ctr);
  try {
    var h = new BLAKE2s(length, decodeUTF8(key));
  } catch (e) {
    log("Error: " + e);
  }
  h.update(decodeUTF8(msg));
  myDigestVar = h.hexDigest();
  log(myDigestVar.substring(0,2));
  if(myDigestVar.substring(0,2) == "00"){
    log("miner hashed in "+ctr+" passes");

    //io().emit("chat message", "miner hashed in "+ctr+" passes");
    //add a block
    frankieCoin.minePendingTransactions(miner);
    //io().emit("broadcast message", JSON.stringify(frankieCoin.getLatestBlock()));
    log("\nThe block is now at: "+JSON.stringify(frankieCoin.getLatestBlock()));
    log('\nBalance of '+miner+' is', frankieCoin.getBalanceOfAddress(miner));

    //log('\nBalance of address1 is', frankieCoin.getBalanceOfAddress('address1'));

    log('\nBalance of 0x5c4ae12c853012d355b5ee36a6cb8285708760e6 is', frankieCoin.getBalanceOfAddress('0x5c4ae12c853012d355b5ee36a6cb8285708760e6'));

    log("entire chain: "+frankieCoin.getEntireChain());
  }else{
    var tempit = msg;
    //log(tempit);
    tempit = tempit.substring(0,(tempit.length-ctr.toString().length))+ctr;
    msg = tempit;
    //log(tempit);
    //log(tempit.substring(0,(tempit.length-ctr.toString().length)));
    if (ctr%250 == 0){log(ctr);}
    if(ctr % 2000 != 0){
      calculateDigest();
    }
  }
}
***/

//here is the miner name we need to make this a variable that comes into this coee
var franks = new Miner("first try", 32, "tryanewkey", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "0x5c4ae12c853012d355b5ee36a6cb8285708760e6")
//spits out the latest block
log("get latest block: "+frankieCoin.getLatestBlock().nonce.toString());
spits out the entire chain
log("entire chain: "+frankieCoin.getEntireChain());
//this is calling the mining algo without a message TBD might need to grab one from a peer internally
franks.calculateDigest();
//I dont have a need to pass transactions but its kind of cool
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 20));
//calls mining algo with a message
franks.calculateDigest("second try");
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 14));
franks.calculateDigest("third try");
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 35));
