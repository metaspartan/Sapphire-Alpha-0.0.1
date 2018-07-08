var sapphirechain = require("./block.js")
var BLAKE2s = require("./public/js/blake2s.js")
var Miner = require("./miner.js")

let frankieCoin = new sapphirechain.Blockchain();
let ctr = 0;

var msg = "genesis message"
var length = 32;
var key = "ax8906hg4c";
var myDigestVar = "";
//var miner = "0x0666bf13ab1902de7dee4f8193c819118d7e21a6";

//here is the miner name we need to make this a variable that comes into this coee
var franks = new Miner.Miner("first try", 32, "tryanewkey", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "0x5c4ae12c853012d355b5ee36a6cb8285708760e6")
//spits out the latest block
console.log("get latest block: "+frankieCoin.getLatestBlock().nonce.toString());
//spits out the entire chain
console.log("entire chain: "+frankieCoin.getEntireChain());
//this is calling the mining algo without a message TBD might need to grab one from a peer internally
franks.calculateDigest("first try",10);
//I dont have a need to pass transactions but its kind of cool
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 20));
//calls mining algo with a message
franks.calculateDigest("second try",10);
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 14));
franks.calculateDigest("third try",10);
frankieCoin.createTransaction(new sapphirechain.Transaction('0x0666bf13ab1902de7dee4f8193c819118d7e21a6', '0x5c4ae12c853012d355b5ee36a6cb8285708760e6', 35));
