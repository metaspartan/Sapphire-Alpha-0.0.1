const fs = require('fs');
const sha256 = require('crypto-js/sha256');
/////////////////////////////////////////////////////////////////welcome message
console.log("EtherGem Sapphire Integrated Subchain with DEX circa 2018");
////////////////////////////////////////////////////////////////////////tag line
console.log("We do not want your money - we want to be your money")
/////////////////////////////////////////////////hash peer.js and soon all files
var fileHash = "";
var filename = "peer.js";
var tbh = "";

var getFiseHash = function(){
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      tbh=data;
      //console.log("output is"+tbh);
      fileHash = sha256(tbh).toString();
      console.log("filehash is"+fileHash);
  });
}
//////////////////////////////////////////////////////////////////end hash files
module.exports = {
  genesisGlobalHash:"This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM",
  said:"nothing",
  fileHash:getFiseHash
}
