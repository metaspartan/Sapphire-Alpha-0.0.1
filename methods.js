'use strict';

let db = require('./db');
const chalk = require('chalk');
const log = console.log;

var callerEvent;
var balanceEvent;
var orderRPCComm;
var txRPCComm;
var parentComEvent = function(cbOrderEvent,cbBalanceEvent,orderCallback,transactionCallback){
  //sets the callerEvent with the function from parent
  //console.log("parent com even called in methods js "+cbBalanceEvent);
  callerEvent = cbOrderEvent;
  balanceEvent = cbBalanceEvent;
  orderRPCComm = orderCallback;
  txRPCComm = transactionCallback;
}

//going to replace data to rpc database for getwork from an rpc call
var postRPCforMiner = function(blockObj){
  //console.log("block data for miner arrived at methods and available for getwork and equals "+JSON.stringify(blockObj))
  console.log(chalk.yellow.bgBlue("block data for miner arrived at methods and available for getwork")); 
      return new Promise((resolve) => {
          if (typeof (blockObj) !== 'object') {
              throw new Error('was expecting an object!');
          }
          // you would usually do some validations here
          // and check for required fields

          //going to delete all first
          resolve(db.blocks.unsetAll());

          // attach an id the save to db
          let _blockObj = JSON.parse(JSON.stringify(blockObj));
          _blockObj.id = (Math.random() * 10000000) | 0;
          resolve(db.blocks.save(blockObj));
      });
}



let methods = {
    createUser: {
        description: `creates a new user, and returns the details of the new user`,
        params: ['user:the user object'],
        returns: ['user'],
        exec(userObj) {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // attach an id the save to db
                let _userObj = JSON.parse(JSON.stringify(userObj));
                _userObj.id = (Math.random() * 10000000) | 0;
                resolve(db.users.save(userObj));
            });
        }
    },

    fetchUser: {
        description: `fetches the user of the given id`,
        params: ['id:the id of the user were looking for'],
        returns: ['user'],
        exec(userObj) {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.users.fetch(userObj.id) || {});
            });
        }
    },

     fetchAllUsers: {
        description: `fetches the entire list of users`,
        params: [],
        returns: ['userscollection'],
        exec() {
            return new Promise((resolve) => {
                // fetch
                resolve(db.users.fetchAll() || {});
            });
        }
    },

    createTask: {
        description: `creates a new user, and returns the details of the new user`,
        params: ['task:the task object'],
        returns: ['task'],
        exec(taskObj) {
            return new Promise((resolve) => {

                // you would usually do some validations here
                // and check for required fields

                // create a task object, then save it to db
                // attach an id the save to db
                let task = {
                    userId: taskObj.userId,
                    taskContent: taskObj.taskContent,
                    expiry: taskObj.expiry
                };

                resolve(db.tasks.save(task));
            });
        }
    },

    createMiner: {
        description: `creates a miner, and returns the details of the new user`,
        params: ['miner:the user object'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // attach an id the save to db
                let _minerObj = JSON.parse(JSON.stringify(minerObj));
                _minerObj.id = (Math.random() * 10000000) | 0;
                resolve(db.miners.save(minerObj));
            });
        }
    },

    fetchMiner: {
        description: `fetches the miner of the given id`,
        params: ['id:the id of the user were looking for'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.miners.fetch(minerObj.id) || {});
            });
        }
    },

    fetchMinerByKey: {
        description: `fetches the miner of the given id`,
        params: ['address:the address of the user were looking for'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.miners.fetchKey(minerObj.address.toString()) || {});
                //resolve(db.miners.fetch(minerObj.id) || {});
            });
        }
    },

    getWorkForMiner: {
      description: `fetches the work for miner of the given address`,
      params: ['address:the address of the miner'],
      returns: ['work'],
      exec() {
          return new Promise((resolve) => {
              // fetch
              resolve(db.blocks.fetchAll() || {});
              //resolve(db.work.fetchAll() || {});
          });
      }
    },

     fetchAllMiners: {
        description: `fetches the entire list of miners`,
        params: [],
        returns: ['minerscollection'],
        exec() {
            return new Promise((resolve) => {
                // fetch
                resolve(db.miners.fetchAll() || {});
            });
        }
    },

    fetchAllBlocks: {
       description: `fetches the entire list of blocks`,
       params: [],
       returns: ['blockscollection'],
       exec() {
           return new Promise((resolve) => {
               // fetch
               resolve(db.blocks.fetchAll() || {});
           });
       }
   },

   getBalance: {
     description: `retrieves balance at address provided`,
     params: ['address'],
     returns: ['balance'],
     exec(addr) {
       var localAddr = JSON.parse(JSON.stringify(addr))["address"];
       return new Promise((resolve) => {
         var cbTally = function(balances){


             console.log("calling in methods this address balance is ");

             console.log(chalk.green("------------------------"));
             for(var x in balances){
               console.log(chalk.yellow(x+": ")+balances[x]);

             }
             let balancereturn = [];
             Object.keys(balances).forEach(key => {
               var item = {[key]:balances [key]};
               balancereturn.push(item);
             });
             console.log(chalk.green("------------------------"));


           console.log("balance function in methods.js get called back with this balance for SFRX "+balances["SFRX"]);
           resolve({balancereturn} || {});
         }
         balanceEvent(localAddr,cbTally);
       });
     }
   },

   balance: {
     description: `balance return object`,
     params: ['balance:the balance object'],
     returns: ['balance'],
     exec(blockObj) {
         return new Promise((resolve) => {
             if (typeof (blockObj) !== 'object') {
                 throw new Error('was expecting an object!');
             }
             // you would usually do some validations here
             // and check for required fields

             //going to delete all first
             resolve(db.balances.unsetAll());

             // attach an id the save to db
             let _blockObj = JSON.parse(JSON.stringify(blockObj));
             _blockObj.id = (Math.random() * 10000000) | 0;
             resolve(db.balances.save(blockObj));
         });
     }
   },

   getOrderBook: {
     description: 'buy sell order book for ticker',
     params: ['balance:the balance object'],
     returns: ['balance'],
     exec(blockObj) {
         return new Promise((resolve) => {
             if (typeof (blockObj) !== 'object') {
                 throw new Error('was expecting an object!');
             }
             // you would usually do some validations here
             // and check for required fields

             //can I return a function?
             log("called the order book");
             let _blockObj = JSON.parse(JSON.stringify(blockObj));
             log("called the order book"+_blockObj);
             resolve(callerEvent(_blockObj));
         });
     }
   },
   //signedOrder({"message":"{\"order\":{\"fromAddress\":\"0x7357589f8e367c2C31F51242fB77B350A11830F3\",\"buyOrSell\":\"BUY\",\"pairBuy\":\"EGEM\",\"pairSell\":\"SPHR\",\"amount\":\"1\",\"price\":2}}","signature":"0x78d89cc55dcf41f1f12000fc344ebd13498b052e5941f6fdcbe386eb615c888d22d9fba968ef89082f7c1bcbafe91e8fe2e1552c7e236768b8857d7dc5b9775f1c"})
   signedOrder: {
     description: 'signed orders placed on dex',
     params: ['signedOrder:the signed order object'],
     returns: ['confirnmation'],
     exec(orderObj) {
       var signedOrder = JSON.parse(JSON.stringify(orderObj))["message"];
       console.log("first pass "+signedOrder)
       var signedOrder = JSON.parse(signedOrder)["order"];
       console.log("second pass "+signedOrder)
       return new Promise((resolve) => {
         var cbOrderConfirmation = function(orderTransactionID){


             console.log("calling in methods this order transaction id "+orderTransactionID);



           console.log("order function in methods.js get called back with this confirmation ");
          resolve({orderTransactionID} || {});
         }
         orderRPCComm(cbOrderConfirmation);
        // balanceEvent(localAddr,cbTally);
       });
     }
   },
   //signedTransaction({"message":"{\"send\":{\"from\":\"0x7357589f8e367c2C31F51242fB77B350A11830F3\",\"to\":\"0x2025ed239a8dec4de0034a252d5c5e385b73fcd0\",\"amount\":2.0087,\"ticker\":\"SFRX\"}}","signature":"0x4f96d0fc8e2983d00c62b7dffb242f66145df02c7e15cec7e991859b04af7b751f78f144df4dd8923404a9c56628c166d722e76cdf2e06cb460272d1a9ded73f1c"})
   signedTransaction: {
     description: 'signed transactions placed on dex',
     params: ['signedTransaction:the signed tx object'],
     returns: ['confirnmation'],
     exec(transactionObj) {
       var signedTX = JSON.parse(JSON.stringify(transactionObj))["message"];
       console.log("first pass "+signedTX)
       var signedOrder = JSON.parse(signedTX)["order"];
       console.log("second pass "+signedTX)
       return new Promise((resolve) => {
         var cbTXConfirmation = function(transactionID){


             console.log("calling in methods this transaction transaction id "+transactionID);



           console.log("signed transaction function in methods.js get called back with this confirmation ");
          resolve({transactionID} || {});
         }
         txRPCComm(cbTXConfirmation);
        // balanceEvent(localAddr,cbTally);
       });
     }
   },
   //transaction:{"from":"0x0666bf13ab1902de7dee4f8193c819118d7e21a6","to":"0x7c4a4cbb0b9e8bd0792fc5ba2bc9660f1fcbfd85","amount":1375.002,"ticker":"SFRX"}}
   transaction: {
     description: '',
     params: ['signature:egem signed transaction','txhash:the sapphire chain','transaction:transaction object'],
     returns: ['transactionHash'],
   },
   exec(transactionObj) {
     return new Promise((resolve) => {
         if (typeof (transactionObj) !== 'object') {
             throw new Error('was expecting an object!');
         }
         // you would usually do some validations here
         // and check for required fields

         //can I return a function?
         log("incoming signed transaction");
         let _transactionObj = JSON.parse(JSON.stringify(transactionObj));
         log("submitting signed transaction"+_transactionObj);
         //peer.js.impcMethods( is the inevitable called function
         resolve(callerEvent(_transactionObj));
     });
   },

   parentComEvent:parentComEvent,
   postRPCforMiner:postRPCforMiner
};

//module.exports = methods;

module.exports = methods
