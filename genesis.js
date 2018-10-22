const fs = require('fs');
const sha256 = require('crypto-js/sha256');
const chalk = require('chalk');
/////////////////////////////////////////////////////////////////welcome message
console.log(" ");
console.log(chalk.green("EtherGem Sapphire Integrated Subchain with DEX circa 2018"));
console.log(" ");
////////////////////////////////////////////////////////////////////////tag line
console.log(chalk.green("We do not want your money - we want to be your money"));
console.log(" ");
/////////////////////////////////////////////////hash peer.js and soon all files
var fileHash = "";
var filename = "peer.js";
var tbh = "";

var getFiseHash = function(){
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      tbh=data.replace(/(\r\n|\n|\r)/gm,"");
      fileHash = sha256(tbh).toString();
      console.log(chalk.cyan("Filehash is: "+ chalk.green(fileHash)));
  });
}
//////////////////////////////////////////////////////////////////end hash files
module.exports = {
  genesisGlobalHash:"This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM",
  said:"nothing",
  fileHash:getFiseHash
}
