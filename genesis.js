const fs = require('fs');
const sha256 = require('crypto-js/sha256');
const chalk = require('chalk');
const log = console.log;
/////////////////////////////////////////////////////////////////welcome message
log(" ");
log(chalk.green("EtherGem Sapphire Integrated Subchain with DEX circa 2018"));
log(" ");
////////////////////////////////////////////////////////////////////////tag line
log(chalk.green("We do not want your money - we want to be your money"));
log(" ");
/////////////////////////////////////////////////hash peer.js and soon all files
var fileHash = "";
var filename = "peer.js";
var tbh = "";

var getFiseHash = function(){
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      tbh=data.replace(/(\r\n|\n|\r)/gm,"");
      fileHash = sha256(tbh).toString();
      log(chalk.cyan("Filehash is: "+ chalk.green(fileHash)));
  });
}
//////////////////////////////////////////////////////////////////end hash files
module.exports = {
  genesisGlobalHash:"This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM",
  said:"nothing",
  fileHash:getFiseHash
}
