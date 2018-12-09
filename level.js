var levelup = require('levelup')
var leveldown = require('leveldown')

// 1) Create our store
var db = levelup(leveldown('./SFRX'))

var putRecord = function(key, val){
  db.put(key, val, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var addBlock = function(blknum,block){
  console.log("<<<<<----------------ADDS BLOCK TO LEVEL DB HERE------------>>>>>")
  console.log(JSON.stringify(block));
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
  console.log(hexBlockNum);
  putRecord(hexBlockNum,block)
  //parseInt(hexString, 16);//this is back to number from hex
}

var getBlock = function(blknum,callBack){
  console.log("BLOCK FROM LEVEL DB");
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
    db.get(hexBlockNum, function (err, value) {
      return new Promise((resolve) => {
        if (err) return console.log('Ooops!', err) // likely the key was not found

        // Ta da!
        console.log(hexBlockNum+": " + value)
        console.log("previousHash: "+JSON.parse(value)["previousHash"])
        resolve(value);
        callBack(value);
      })
    })
}

///////from here down needs editing

/***

var addGenBlock = function(block){
  log(JSON.stringify(block));
  //orders.connect().then(function(result) {
      // DB ready to use.
      nSQL("blockchain").doAction('add_genblock', block
      ).then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var clearDatabase = function(){
  console.log(chalk.yellow("| Deleting database...         |"));
  nSQL("blockchain").query("delete").exec();
}

var clearBlock = function(blocknum){
  nSQL("blockchain").query("delete").where(['blocknum','=',blocknum]).exec();
}

var getBlockchain = function(limit,callBack){
  log("ENTIRE BLOCKCHAIN");
      if(limit){
        log(" LIMITED by "+limit);
      }
      // DB ready to use.
      nSQL("blockchain").getView('get_blockchain')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}



var getLatestBlock = function(){
  log(chalk.blue("LATEST BLOCK"));
      // DB ready to use.
      nSQL("blockchain").getView('get_latest_block')
      .then(function(result) {
          log(chalk.green(JSON.stringify(result))) //  <- single object array containing the row we inserted.
          //callBack(result);
      });

}

var clearOrderById = function(id){
  nSQL("orders").query("delete").where(["id","=",id]).exec()
}

var clearOrderDatabase = function(){
  console.log(chalk.yellow("| Deleting all orders...       |"));
  nSQL("orders").query("delete").exec();
}


var addOrder = function(order){
  log("okay at least we are trying to add this order in db"+JSON.stringify(order));
  //orders.connect().then(function(result) {
      // DB ready to use.
      log("we are placing this order "+order);

      nSQL("orders").doAction('add_new_order',order
      ).then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var ordersToBuy = [];

var getOrdersBuy = function(callBack){
  log("Open BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_buy')
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairBuy = function(pair,callback){
  log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairBuy',{pairBuy:pair})
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //log(result);
      });

}
////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairSell = function(pair,callback){
  log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairSell',{pairSell:pair})
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //log(result);
      });

}

var buildTrade = function(obj,callBack){
  log("Building transactions from sell orders for "+JSON.stringify(obj));
  nSQL("orders").getView('get_order_by_pairSell',{pairSell:obj["pairSell"]})
  .then(function(result) {
      //log(result) //  <- single object array containing the row we inserted.
      callBack(obj,result);
  });
}

var getOrdersSell = function(){
  log("Open SELL Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_sell')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

var getAllOrders = function(){
  log("ALL Open Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

var addTransactions = function(transactions,blockhash){
  console.log("T R A N S A C T I O N S  B E I N G  A D D E D  H E R E");
  console.log(transactions+transactions.length);
  console.log(blockhash);
  transactions = JSON.parse(JSON.stringify(transactions));
  for(tranx in JSON.parse(transactions)){

    console.log("inside loop"+tranx+JSON.parse(transactions)[tranx]);

    var receipt = JSON.parse(transactions)[tranx];
    var myreceipt = {
      "sfrxreceipt":
      {"id":null,
      "address":receipt["toAddress"],
      "fromAddress":receipt["fromAddress"],
      "ticker":receipt["ticker"],
      "amount":receipt["amount"],
      "timestamp":receipt["timestamp"],
      "transactionID":receipt["hash"],//to be added
      "blockHash":blockhash
    }};
    log("Inserting Tranactions"+myreceipt.toString());
        // DB ready to use.
    nSQL("sfrxreceipts").doAction('add_new_receipt',myreceipt
    ).then(function(result) {
        log(result) //  <- single object array containing the row we inserted.
    });

  }

  log("here are my receipts: "+JSON.stringify(getAllTransactionReceipts()));

}

var getAllTransactionReceipts = function(){
  log("ALL Transaction Receipts");
      // DB ready to use.
      nSQL("sfrxreceipts").getView('list_all_receipts')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

var getTransactionReceiptsByAddress = function(address){
  log("ALL Transaction Receipts");
      // DB ready to use.
      nSQL("sfrxreceipts").getView('list_all_receipts_address',{address:address})
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

var getBalanceByAddress = function(address){
  log("ALL Transaction Receipts");
      // DB ready to use.
      nSQL("sfrxreceipts").getView('get_balance_at_address',{address:address})
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
          var bal = 0;
          for(amt in result){
            bal+=parseFloat(result[amt]["amount"]);
          }
          log("final balance is "+bal);
      });

}

var clearTransactionDatabase = function(){
  console.log(chalk.yellow("| Deleting all transactions... |"));
  nSQL("sfrxreceipts").query("delete").exec();
}
***/

module.exports = {
    addBlock:addBlock,
    getBlock:getBlock,
}
