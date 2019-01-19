var BLAKE2s = require("./blake2s.js")
var levelup = require('levelup')
var leveldown = require('leveldown')
var fs = require('fs')
//web3
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));

function decodeUTF8(s) {
  var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
  for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
}

var Hash = function(inputs) {
  try {
    var h = new BLAKE2s(32, decodeUTF8(""));
  } catch (e) {
    console.log("Error: " + e);
  };
  h.update(decodeUTF8(inputs));
  var thishash = h.hexDigest().toString();
  console.log(thishash);
  return thishash;
}

var Transaction = class Transaction{
    //address validation in signed raw tx
    constructor(fromAddress, toAddress, amount, ticker, txTimestamp){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.ticker = ticker;
        this.timestamp = txTimestamp;
        this.hash = Hash(toAddress+amount+ticker+txTimestamp);
    }
}

// 1) Create our store
var db = levelup(leveldown('./SFRX'))

var refresh = function(cb,blockNum,cbChainGrab,globalGenesisHash){
  //not working correctluy at the moment


  db = levelup(leveldown('./SFRX'));

  db.close();

  db.open();

  setTimeout(function(){

    cb(blockNum,cbChainGrab,globalGenesisHash);

  },3000);

}

var closeDB = function(){

  db.close();

}

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

var addChainState = function(key,val){
  console.log("chain state of "+key.toString()+" and value "+val.toString());
  db.put(key, val, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var getChainStateParam = function(state,cb){
  db.get("cs:"+state, function (err, value) {
    if(value){
      console.log("Chain State Param: "+state+" = "+value.toString());
      cb(value.toString());
    }else{
      cb(0);
    }
  });
}

var addNode = function(key, value){
  console.log("Adding Node as follows key: "+key.toString()+" - value:"+ value.toString())
  //node:id:
  db.put(key, value, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var getNodes = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "node"){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })
}

var addBlock = function(blknum,block,callfrom){
  console.log("<<<<<----------------ADDS BLOCK TO LEVEL DB HERE------------>>>>>")
  console.log("called from "+callfrom);
  //console.log("inside add block"+block.toString());//verbose
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
  console.log("adding block "+blknum+" as "+hexBlockNum);
  putRecord("sfblk:"+hexBlockNum,block)
  //parseInt(hexString, 16);//this is back to number from hex
  console.log("<<<<<----------------BLOCK REWARDS LEVEL DB HERE------------>>>>>")
  //console.log("block: "+JSON.stringify(block));

  var calcBlockReward;
  if(parseInt(blknum) < 7500001){calcBlockReward=9}//ERA1
  else if(parseInt(blknum) < 15000001){calcBlockReward=4.5}//ERA2
  else if(parseInt(blknum) < 21500001){calcBlockReward=2.25}//ERA3
  else if(parseInt(blknum) < 30000001){calcBlockReward=1.125}//ERA4
  else if(parseInt(blknum) < 37500001){calcBlockReward=0.625}//ERA5
  else if(parseInt(blknum) < 45000001){calcBlockReward=0.3125}//ERA6
  else if(parseInt(blknum) > 45000000){calcBlockReward=0.15625}//ERA7

  var calcMiningReward = parseFloat(calcBlockReward*0.8633);//miner
  var calcDevReward = parseFloat(calcBlockReward*0.0513);//coredev
  var calcCMDevReward = parseFloat(calcBlockReward*0.0454);//community dev
  var calcSponsorReward = parseFloat(calcBlockReward*0.01);//sponsor
  var calcBigNodeReward = parseFloat(calcBlockReward*0.02);//big node sapphire
  var calcEGEMT1NodeReward = 0.005;//egem node
  var calcEGEMT2NodeReward = 0.005;//egem big bit node

  if(parseInt(blknum) == 1){//permines
    ///////////////////////////////////////////////////////////////////CORE DEVS
    var osoTx = new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx));
    var ridzTx = new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx));
    var jalTx = new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx));
    var tbatesTx = new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx));
    var beastTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx));
    ////////////////////////////////////////////////////////////////EARLY SUPPORT
    /***
    var sehidTx = new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", "250000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx));
    var galimbaTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", "250000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx));
    var wookieTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", "250000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx));
    var buzzTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", "250000", "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx));
    ***/
    ////////////////////////////////////////////////////////////TESTING ACCOUNTS
    var osoTxEGEM = new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "100000", "EGEM", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:EGEM:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxEGEM));
    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 100000, "EGEM"),//EGEM
    var osoTxBTC = new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "3", "BTC", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:BTC:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxBTC));
    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 3, "BTC"),//BTC
    var osoTxETH = new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "10", "ETH", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:ETH:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxETH));
    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 10, "ETH"),//ETH
    var osoTxXBI = new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "1000", "XBI", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:XBI:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxXBI));
    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 1000, "XBI"),//XBI
  }else{//perblock rewards from block 2 until
    var osoTx = new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx));
    var ridzTx = new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx));
    var jalTx = new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx));
    var tbatesTx = new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx));
    var beastTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx));
    //miner
    var minerTx = new Transaction("sapphire", JSON.parse(block)["miner"], calcMiningReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:"+JSON.parse(block)["miner"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(minerTx));
      //sponsor
    var sponsorTx = new Transaction("sapphire", JSON.parse(block)["sponsor"], calcSponsorReward, "SFRX", JSON.parse(block)["timestamp"]);
    putRecord("tx:sapphire:"+JSON.parse(block)["sponsor"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(sponsorTx));
    //community DEVS
    //sapphire Node T2 SUPER NODE
    //EGEM node T1
    //EGEM node T2
  }

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

var getBlockStream = function(blknum,callBack){

      console.log("Providing a block stream to a synching peer")
      var returner = [];
      var stream = db.createReadStream();
      stream.on('data',function(data){
        //console.log('key = '+data.key+" value = "+data.value.toString());
        if(data.key.toString().split(":")[0] == "sfblk"){
          //console.log("here... "+data.key.toString()+" "+data.value.toString());
          //candidate for progress bar widget
          console.log("here... "+data.key.toString());
          returner.push(data.value.toString());
        }
      });

      stream.on('close',function(){
        console.log("data stream is complete");
        //var wrappedStream = {"pongBlockStream":returner};
        //console.log("inside the return "+JSON.stringify(returner))
        callBack(returner);
      });

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
          //console.log("here... "+data.key.toString()+" "+data.value.toString());
          //candidate for progress bar widget
          console.log("here... "+data.key.toString());
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

var getBlockRange = function(blockHeight,riser,callback){


    var chainBlockHeight=blockHeight;
    chainBlockHeight-=riser;

      console.log("riser: "+riser+" blockHeight: "+blockHeight+" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))
      var returner = [];
      var stream = db.createReadStream();
      stream.on('data',function(data){
        //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
        //console.log('key = '+data.key+" value = "+data.value.toString());
        if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight))){//possible another block enters the db s no upper limit
          //console.log("here... "+data.key.toString()+" "+data.value.toString());
          returner.push(data.value.toString());
        }
      });
      stream.on('close',function(){
        console.log("Block range data stream is complete");
        //console.log("inside the return "+JSON.stringify(returner))
        callback(returner);
      });

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

var getBalanceAtAddress = function(address,callback){

    console.log("Total Balance of "+address);

    var balance = [];

    var stream = db.createKeyStream();

    stream.on('data',function(data){

      if(data.toString().split(":")[1] == address || data.toString().split(":")[2] == address){
        db.get(data, function (err, value) {


          console.log("adding or subtracting "+parseFloat(JSON.parse(value)["amount"])+" of "+data.toString().split(":")[3]+" to ");

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
              console.log("deduct "+parseFloat(JSON.parse(value)["amount"]));
              balance[data.toString().split(":")[3]] -= parseFloat(JSON.parse(value)["amount"]);
          }

          if(data.toString().split(":")[2] == address){
              console.log("addit "+parseFloat(JSON.parse(value)["amount"]));
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

          //console.log("okay"+balance["SFRX"]+airdrop);
          if(typeof balance["SFRX"] === 'undefined' || balance["SFRX"] === null){
            balance["SFRX"]=0;
            var existing = parseFloat(balance["SFRX"]);
            console.log("i am in here"+balance["SFRX"]);
          }else{
            var existing = parseFloat(balance["SFRX"]);
            console.log("i am in else here"+balance["SFRX"]);
          }


          //var existing = parseFloat(balance["SFRX"]);//going to have to replace this later
          if(!existing){existing = 0};
          //var orig = await parseFloat(airdrop);
          var orig = await web3.eth.getBalance(address, 1530000)
          orig = web3.utils.fromWei(orig,'ether');
          //var orig = await web3.utils.fromWei(orig,'ether');
          //var orig = parseFloat(orig*2);
          console.log("orig = "+orig)
          if(!orig){orig = 0};
          console.log("okay2"+existing+orig);
          var newbal = 0;
          newbal+=parseFloat(existing);
          newbal+=parseFloat(orig);
          //console.log("newbal = "+newbal)
          //balance["SFRX"] = newbal;
          console.log(balance["SFRX"]);
          balance["SFRX"]=parseFloat(newbal);
          //return balance;
          callback(balance);

      }

      returnTime();

    });
    //console.log("balance without airdrop is "+addrBalance);

}

var addOrder = function(orderkey,order){
  //current key action+":"+pairBuy+":"+pairSell+":"+myblockorder.transactionID+":"+myblockorder.timestamp
  console.log("we are placing this order "+orderkey+" --> "+order);
  putRecord(orderkey,JSON.stringify(order));
}

//remove orders by transactionID and timestamp
var clearOrderById = function(transactionID,timestamp){

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[4] == transactionID && data.toString().split(":")[5] == timestamp){
      db.del(data).then(function(){console.log("deleting this order "+transactionID,timestamp);});
    }

  });


}

var getOrdersBuy = function(callBack){

  console.log("Open BUY Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "BUY"){
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

    if(data.toString().split(":")[1] == "BUY"){
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
var getOrdersPairBuy = function(pairBuy,pairSell,callback){

  console.log("Open PAIR BUY Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "BUY" && data.toString().split(":")[2] == pairBuy && data.toString().split(":")[3] == pairSell){
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
    callback(resultss);
  });

}

var getOrdersSell = function(){

  console.log("Open SELL Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "SELL"){
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
var getOrdersPairSell = function(pairBuy,pairSell,callback){

  console.log("Open PAIR SELL Orders leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "SELL" && data.toString().split(":")[2] == pairBuy && data.toString().split(":")[3] == pairSell){
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

var getAll = function(){

      var stream = db.createReadStream();
      stream.on('data',function(data){
        //console.log('key = '+data.key+" value = "+data.value.toString());

          //console.log("here... "+data.key.toString()+" "+data.value.toString());
          //candidate for progress bar widget
          console.log("key... "+data.key.toString()+".....value "+data.value.toString());


      });
      stream.on('close',function(){
        console.log("data stream is complete");

      });


}

var dumpDatCopy = function(cb,peer){

  var db2 = levelup(leveldown('./SFRX2'))

  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log('key = '+data.key+" value = "+data.value.toString());

      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      //candidate for progress bar widget
      console.log("key... "+data.key.toString()+".....value "+data.value.toString());

      db2.put(data.key, data.value, function (err) {
        if (err) return console.log('Ooops!', err) // some kind of I/O error
      })


  });
  stream.on('close',function(){

    console.log("Dat Copy data stream is complete");

    db2.close();

    //cb(peer)
    //cb(peer);
    setTimeout(function(){cb(peer)},1000);

  });

}


var dumpToJsonFIle = function(cb,peer){

  var jsonSynch = []
  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log('key = '+data.key+" value = "+data.value.toString());

      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      //candidate for progress bar widget
      console.log("key... "+data.key.toString()+".....value "+data.value.toString());

      var thisRowKey = data.key.toString();
      var thisRowValue = data.value.toString();
      var thisRow = {[thisRowKey]:thisRowValue};

      jsonSynch.push(thisRow);


  });

  stream.on('close',function(){

    console.log("Dat Copy data stream is complete");

    //db2.close();
    if (!fs.existsSync("./SYNC")){
        fs.mkdirSync("./SYNC");
    }

    fs.writeFile("./SYNC/SFRX.json", JSON.stringify(jsonSynch), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("JSON synch File has been created");
    });

    setTimeout(function(){cb(peer)},1000);

  });

}

var dumpToJsonFIleRange = function(cb,peer,start){

  var chainBlockHeight=start;
  var jsonSynch = []

  console.log(" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))

  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
    //console.log('key = '+data.key+" value = "+data.value.toString());
    if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight))){//possible another block enters the db s no upper limit
      //console.log("here... "+data.key.toString()+" "+data.value.toString());

      console.log("key... "+data.key.toString()+".....value "+data.value.toString());

      var thisRowKey = data.key.toString();
      var thisRowValue = data.value.toString();
      var thisRow = {[thisRowKey]:thisRowValue};

      jsonSynch.push(thisRow);

    }
  });


  stream.on('close',function(){

    console.log("Dat Copy data stream is complete");

    //db2.close();
    if (!fs.existsSync("./SYNC")){
        fs.mkdirSync("./SYNC");
    }

    fs.writeFile("./SYNC/SFRX.json", JSON.stringify(jsonSynch), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("JSON synch File has been created");
    });

    setTimeout(function(){cb(peer)},1000);

  });

}


var importFromJSONFile = function(cb,blockNum,cbChainGrab,chainRiser){

  var content = require('./SYNC/SFRX.json');

  //console.log(Object.keys(content))

  for(row in content){
    console.log("key is "+Object.keys(content[row])+"value is "+Object.values(content[row]));
    var rowKey = Object.keys(content[row]);
    var rowValue = Object.values(content[row]);
    db.put(rowKey, rowValue, function (err) {
      if (err) return console.log('Ooops!', err) // some kind of I/O error
    })
  }

  cb(blockNum,cbChainGrab,chainRiser);

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
    getAll:getAll,
    refresh:refresh,
    closeDB:closeDB,
    dumpDatCopy:dumpDatCopy,
    dumpToJsonFIle:dumpToJsonFIle,
    dumpToJsonFIleRange:dumpToJsonFIleRange,
    importFromJSONFile:importFromJSONFile,
    addChainParams:addChainParams,
    getChainParams:getChainParams,
    getChainParamsBlockHeight:getChainParamsBlockHeight,
    addChainState:addChainState,
    getChainStateParam:getChainStateParam,
    addNode:addNode,
    getNodes:getNodes,
    addBlock:addBlock,
    getBlock:getBlock,
    removeBlock:removeBlock,
    getAllBLocks:getAllBLocks,
    getBlockchain:getBlockchain,
    getBlockStream:getBlockStream,
    getBlockRange:getBlockRange,
    clearDatabase:clearDatabase,
    addTransactions:addTransactions,
    getTransactions:getTransactions,
    getTransactionReceiptsByAddress:getTransactionReceiptsByAddress,
    getBalanceAtAddress:getBalanceAtAddress,
    addOrder:addOrder,
    getOrdersBuy:getOrdersBuy,
    getOrdersBuySorted:getOrdersBuySorted,
    getOrdersPairBuy:getOrdersPairBuy,
    getOrdersPairSell:getOrdersPairSell,
    buildTrade:buildTrade,
}
