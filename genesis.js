const fs = require('fs');
const sha256 = require('crypto-js/sha256');
const md5File = require('md5-file');
/////////////////////////////////////////////////////////////////welcome message
console.log("EtherGem Sapphire Integrated Subchain with DEX circa 2018");
////////////////////////////////////////////////////////////////////////tag line
console.log("We do not want your money - we want to be your money")
/////////////////////////////////////////////////hash peer.js and soon all files
var fileHash = "";
var filename = "peer.js";
var tbh = "";

const hash = md5File.sync(filename);

var getFiseHash = function(){
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      //tbh=data;
      tbh = data.slice(data.indexOf("const fs ="), data.indexOf("fileHash:getFiseHash"));
      //console.log("output is"+tbh);
      fileHash = sha256(tbh).toString();
      console.log("filehash is "+fileHash);
      console.log("md5 is "+hash);
  });
}
//////////////////////////////////////////////////////////////////end hash files
module.exports = {
  genesisGlobalHash:"This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM",
  said:"nothing",
  fileHash:getFiseHash
}
