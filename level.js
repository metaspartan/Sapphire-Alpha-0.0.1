var levelup = require('levelup')
var leveldown = require('leveldown')
//web3
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));

// 1) Create our store
var db = levelup(leveldown('./SFRX'))

var putRecord = function(key, val){
  db.put(key, val, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var addChainParams = function(key, value){
  console.log("Chain Parameters Loading as follows key: "+key.toString()+" - version"+ JSON.parse(value)["version"])
  db.put(key, value, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var getChainParams = function(hashKey){
  db.get(hashKey, function (err, value) {
    console.log("Chain Params "+value.toString());
  });
}

var getChainParamsBlockHeight = function(hashKey){
  db.get(hashKey+":blockHeight", function (err, value) {
    console.log("Chain Params "+value.toString());
  });
}

var addBlock = function(blknum,block,callfrom){
  console.log("<<<<<----------------ADDS BLOCK TO LEVEL DB HERE------------>>>>>")
  console.log("called from "+callfrom);
  console.log("inside add block"+block.toString());
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
  console.log("adding block "+blknum+" as "+hexBlockNum);
  putRecord("sfblk:"+hexBlockNum,block)
  //parseInt(hexString, 16);//this is back to number from hex
}

var getBlock = function(blknum,callBack){
  console.log("BLOCK FROM LEVEL DB");
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
    db.get("sfblk:"+hexBlockNum, function (err, value) {
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

var removeBlock = function(blknum){
  console.log("REMOVING BLOCK NUMBER "+blknum+" FROM LEVELDB");
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
  db.del("sfblk:"+hexBlockNum, function(err){
    if(err) return console.log('Ooops!', err) // likely the key was not found
  });
}

var getAllBLocks = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "sfblk"){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })
}

var getBlockchain = function(limit,callback,hashKey){
  db.get(hashKey, function (err, value) {
    console.log("Chain Params "+value.toString());
    //value.toString();
    if(JSON.parse(value.toString())["version"]=="alpha.0.0.1"){
      console.log("The chain params are correct proceeding")
      var returner = [];
      var stream = db.createReadStream();
      stream.on('data',function(data){
        //console.log('key = '+data.key+" value = "+data.value.toString());
        if(data.key.toString().split(":")[0] == "sfblk"){
          console.log("here... "+data.key.toString()+" "+data.value.toString());
          returner.push(data.value.toString());
        }
      });
      stream.on('close',function(){
        console.log("data stream is complete");
        //console.log("inside the return "+JSON.stringify(returner))
        callback(returner);
      });
    }else{
      console.log("you are running the wrong version and need to update "+value.toString());
    }
  })
}

var getBlockchain2 = function(limit,callback,hashKey){

  db.get(hashKey, function (err, value) {
    console.log("Chain Params "+value.toString());
    //value.toString();
    if(JSON.parse(value.toString())["version"]=="alpha.0.0.1"){
      console.log("The chain params are correct proceeding")

      db.get(hashKey+":blockHeight", function (err, value) {

        var chainBlockHeight = (parseInt(value.toString())-parseInt(limit));

          var returner = [];
          var stream = db.createReadStream();
          stream.on('data',function(data){
            //console.log('key = '+data.key+" value = "+data.value.toString());
            if(data.key.toString().split(":")[0] == "sfblk"){
              console.log("here... "+data.key.toString()+" "+data.value.toString());
              returner.push(data.value.toString());
            }
          });
          stream.on('close',function(){
            console.log("data stream is complete");
            //console.log("inside the return "+JSON.stringify(returner))
            callback(returner);
          });

    })

    }else{
      console.log("you are running the wrong version and need to update "+value.toString());
    }
  })
}

var clearDatabase = function(){
  console.log("| Deleting database... level not set up for delete yet just delete the SFRX folder for now        |");
  //levelup(leveldown.destroy('./SFRX',function(){console.log("donada")}));
  //db = levelup(leveldown('./SFRX'));
}

var addTransactions = function(transactions,blockhash,){
  console.log("T R A N S A C T I O N S  B E I N G  A D D E D  H E R E");
  transactions = JSON.parse(JSON.stringify(transactions));
  for(tranx in JSON.parse(transactions)){
    var receipt = JSON.parse(transactions)[tranx];
    //receipts have a key of toAddress:timestamp:receipthash atm
    putRecord("tx:"+receipt["fromAddress"]+":"+receipt["toAddress"]+":"+receipt["ticker"]+":"+receipt["timestamp"]+":"+receipt["hash"]+":"+blockhash,JSON.stringify(receipt));
  }
}

var getTransactions = function(){
  console.log("ALL Transaction Receipts");

  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "tx"){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })

}

var getTransactionReceiptsByAddress = function(address){

  console.log("ALL Transaction Receipts for "+address);

  var stream = db.createKeyStream();
  stream.on('data',function(data){
    if(data.toString().split(":")[1] == address || data.toString().split(":")[2] == address){
      console.log(data.toString());
    }

  })

}

function getAirdropBalanceFromEgem(address,callback,airdrop) {
    //grab latest EGEM BLock
    web3.eth.getBalance(address, 1530000, async function (error, result) {
      if (!error){
        //console.log('Egem:', web3.utils.fromWei(result,'ether')); // Show the ether balance after converting it from Wei
        var responder = await callback(parseFloat(web3.utils.fromWei(result,'ether')*2));
        //console.log("responder equals "+responder);
        //return result;
      }else{
        console.log('Houston we have a promblem: ', error); // Should dump errors here
      }
    });

}

var getBalanceAtAddress = function(address,callback){

    console.log("Total Balance of "+address);

    ///first we call the airdrop
    var airdrop;
    var balance = [];

    //calling the airdrop balance
    var mycallback1 = async function(response){
      //console.log("we have returned"+response);
      airdrop = response;
      //console.log("second check on airdrop" +airdrop);
      return airdrop;
    }

    getAirdropBalanceFromEgem(address,mycallback1);



    var stream = db.createKeyStream();

    stream.on('data',function(data){

      if(data.toString().split(":")[1] == address || data.toString().split(":")[2] == address){
        db.get(data, function (err, value) {


          //console.log("adding or subtracting "+parseFloat(JSON.parse(value)["amount"])+" of "+data.toString().split(":")[3]+" to ");

          /***
          for(x in balance){
            console.log("x "+x+" balance is "+JSON.stringify(balance[x]))
          }
          ***/
          //addrBalance = parseFloat(addrBalance+addrBalance2);


          if(balance[data.toString().split(":")[3]] == null){
              balance[data.toString().split(":")[3]] = 0;
          }

          if(data.toString().split(":")[1] == address){
              balance[data.toString().split(":")[3]] -= parseFloat(JSON.parse(value)["amount"]);
          }

          if(data.toString().split(":")[2] == address){
              balance[data.toString().split(":")[3]] += parseFloat(JSON.parse(value)["amount"]);
          }


        })
      }

    });

    stream.on('close',function(){
      //console.log("streaming has ended and balance is ");
      /***
      for(x in balance){
        console.log(balance[x]);
      }
      ***/
      //callback(addrBalance);

      async function returnTime(){
        if(airdrop){
          //console.log("okay"+balance["SFRX"]+airdrop);
          var existing = parseFloat(balance["SFRX"]);
          //var existing = parseFloat(balance["SFRX"]);//going to have to replace this later
          if(!existing){existing = 0};
          //var orig = await parseFloat(airdrop);
          var orig = await web3.eth.getBalance(address, 1530000);
          var orig = await web3.utils.fromWei(orig,'ether');
          var orig = parseFloat(orig*2);
          console.log("orig = "+orig)
          if(!orig){orig = 0};
          //console.log("okay2"+existing+orig);
          var newbal = parseFloat(existing + orig);
          //console.log("newbal = "+newbal)
          //balance["SFRX"] = newbal;
          //console.log(balance);
          balance["SFRX"]+=parseFloat(orig);
          //return balance;
          callback(balance);
        }else{
          //console.log("not yet")
          setTimeout(function(){returnTime();},700);
        }
      }

      returnTime(airdrop);

    });
    //console.log("balance without airdrop is "+addrBalance);

}

var addOrder = function(orderkey,order){
  //current key action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp
  console.log("we are placing this order "+orderkey+" --> "+order);
  putRecord(orderkey,JSON.stringify(order));
}

var getOrdersBuy = function(callBack){

  console.log("Open BUY Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "BUY"){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });

  stream.on('close',function(){
    callBack(result);
  });

}

var getOrdersBuySorted = function(callBack){

  console.log("Open BUY Orders SORTED leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "BUY"){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });

  stream.on('close',function(){
    //console.log("SORTING N HERE");
    //console.log("results are "+result);
    var resultss = result.sort(function(a,b){
      var x = JSON.parse(a)["price"];
      //console.log("x "+x+a);
      var y = JSON.parse(b)["price"];
      //console.log("y "+y+b)
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0;
    })
    //console.log("POST SORT");
    //console.log("results ss are "+resultss);
    callBack(resultss);
  });

}

//////////////////////////////////////////////////////////////////////first call
var getOrdersPairBuy = function(pair,callback){

  console.log("Open PAIR BUY Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "BUY" && data.toString().split(":")[1] == pair){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });
  //need to test the second callback to match previous set ups from nanosql
  stream.on('close',function(data){
    var resultss = result.sort(function(a,b){
      var x = JSON.parse(a)["price"];
      //console.log("x "+x+a);
      var y = JSON.parse(b)["price"];
      //console.log("y "+y+b)
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0;
    })
    callBack(resultss);
  });

}

var getOrdersSell = function(){

  console.log("Open SELL Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "SELL"){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });

  stream.on('close',function(){
    callBack(result);
  });

}

//////////////////////////////////////////////////////////////////////first call
var getOrdersPairSell = function(pair,callback){

  console.log("Open PAIR SELL Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "SELL" && data.toString().split(":")[1] == pair){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });
  //need to test the second callback to match previous set ups from nanosql
  stream.on('close',function(data){
    var resultss = result.sort(function(a,b){
      var x = JSON.parse(a)["price"];
      //console.log("x "+x+a);
      var y = JSON.parse(b)["price"];
      //console.log("y "+y+b)
      if (x > y) {return -1;}
      if (x < y) {return 1;}
      return 0;
    })
    callback(resultss);
  });

}

var buildTrade = function(obj,callBack){
  console.log("Building transactions from sell orders LEVELDB for "+JSON.stringify(obj));

  var callBackResults = function(resultset){
    callBack(obj,resultset)
  }

  getOrdersPairSell(obj["pairSell"],callBackResults);

  /***
  nSQL("orders").getView('get_order_by_pairSell',{pairSell:obj["pairSell"]})
  .then(function(result) {
      //log(result) //  <- single object array containing the row we inserted.
      callBack(obj,result);
  });
  ***/
}

///////from here down needs editing

/***

var clearDatabase = function(){
  console.log(chalk.yellow("| Deleting database...         |"));
  nSQL("blockchain").query("delete").exec();
}

var clearBlock = function(blocknum){
  nSQL("blockchain").query("delete").where(['blocknum','=',blocknum]).exec();
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
    addChainParams:addChainParams,
    getChainParams:getChainParams,
    getChainParamsBlockHeight:getChainParamsBlockHeight,
    addBlock:addBlock,
    getBlock:getBlock,
    removeBlock:removeBlock,
    getAllBLocks:getAllBLocks,
    getBlockchain:getBlockchain,
    clearDatabase:clearDatabase,
    addTransactions:addTransactions,
    getTransactions:getTransactions,
    getTransactionReceiptsByAddress:getTransactionReceiptsByAddress,
    getBalanceAtAddress:getBalanceAtAddress,
    addOrder:addOrder,
    getOrdersBuy:getOrdersBuy,
    getOrdersBuySorted:getOrdersBuySorted,
    getOrdersPairBuy:getOrdersPairSell,
    getOrdersPairSell:getOrdersPairSell,
    buildTrade:buildTrade,
}
