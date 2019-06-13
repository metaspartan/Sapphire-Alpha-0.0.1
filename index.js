var Peers = require('./peer.js');

var resetApp = function(){
  console.log("resetting node.js app");
  //process.exit();
  Peers = require('./restart.js');
  console.log("reset node.js app");
  console.log("reset node.js app");
  console.log("reset node.js app");
  setTimeout(function(){Peers = require('./peer.js');},3000)
}

process.on("exit",function(){
  Peers = require('./restart.js');
  console.log("reset node.js app");
  console.log("reset node.js app");
  console.log("reset node.js app");
})

//setTimeout(function(){resetApp()},25000)

const testAddon = require('./build/Release/testaddon.node');
console.log('addon',testAddon);
console.log('hello ', testAddon.hello());
console.log('add ', testAddon.add(5, 10));
module.exports = testAddon;
