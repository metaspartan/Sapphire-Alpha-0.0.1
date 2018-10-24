const fs = require('fs');
const sha256 = require('crypto-js/sha256');
const chalk = require('chalk');
const log = console.log;
/////////////////////////////////////////////////////////////////welcome message
log(" ");
log(chalk.blue("-------------------------------------------------------------------------------"));
log(chalk.blue("                      _                       "));
log(chalk.red("EtherGem       "+chalk.blue("      / \\      We dont't ")));
log(chalk.red("Sapphire       "+chalk.blue("     / ^ \\      want your money!")));
log(chalk.red("Integrated       "+chalk.blue("  / / \\ \\       We want to ")));
log(chalk.red("Subchain       "+chalk.blue("   / /   \\ \\       be your money!")));
log(chalk.red("DEX       "+chalk.blue("        \\ \\   / /    ")));
log(chalk.red("        "+chalk.blue("           \\ \\_/ /         Thank you for using sapphire.")));
log(chalk.green("           "+chalk.blue("         -----      ")));
log(chalk.red("               https://"+ chalk.blue("egem.io")));
log(chalk.blue("-------------------------------------------------------------------------------"));
log(" ");
/////////////////////////////////////////////////hash peer.js and soon all files
var fileHash = "";
var filename = "peer.js";
var tbh = "";

var getFileHash = function(){
  fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
      tbh=data.replace(/(\r\n|\n|\r)/gm,"");
      fileHash = sha256(tbh).toString();
      log(fileHash);
      log(chalk.cyan("Filehash is: "+ chalk.green(fileHash)));
  });
}
//////////////////////////////////////////////////////////////////end hash files
module.exports = {
  genesisGlobalHash:"This is the Genesis GLobal Hash for the EtherGem Sapphire Integrated Subchain TeamEGEM",
  said:"nothing",
  fileHash:getFileHash
}
