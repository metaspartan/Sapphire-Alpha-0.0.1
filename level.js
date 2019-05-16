var BLAKE2s = require("./blake2s.js")
var levelup = require('levelup')
var leveldown = require('leveldown')
var fs = require('fs')
const chalk = require('chalk');
//web3
var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://lb.rpc.egem.io"));

var Trie = require('merkle-patricia-tree');

//quite possibly we should set this in peer.js or block.js and pass it in
var transactionRiser = 100;

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
  //console.log(thishash);
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
var db = levelup(leveldown('./SFRX'));
var statedb = levelup(leveldown('./SFRX/STATE'));
trie = new Trie(db);

var refresh = function(cb,blockNum,cbChainGrab,globalGenesisHash){
  //not working correctluy at the moment


  db = levelup(leveldown('./SFRX'));
  statedb = levelup(leveldown('./SFRX/STATE'));

  db.close();
  statedb.close();

  db.open();
  statedb.open();

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
  console.log("Chain Parameters Loading as follows key: "+key.toString()+" - version"+ value)
  db.put(key, value, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var getChainParams = function(hashKey){
  db.get(hashKey, function (err, value) {
    console.log("Chain Params "+value.toString());
  });
}

var getChainParamStream = function(hashKey){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == hashKey){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })
}

var getChainParamsBlockHeight = function(hashKey){
  db.get(hashKey+":blockHeight", function (err, value) {
    console.log("Chain Params "+value.toString());
  });
}

var getChainParamsByName = function(hashKey,paramName,cb){
  db.get(hashKey+":"+paramName, function (err, value) {
    if(err){
      console.log("err: "+err);
      cb("notfound");
    }else{
      console.log("Chain Param "+paramName+": "+value.toString());
      cb(value.toString());
    }
  });
}

var addChainState = function(key,val){
  //console.log("chain state of "+key.toString()+" and value "+val.toString());
  db.put(key, val, function (err) {
    if (err) return console.log('Ooops!', err) // some kind of I/O error
  })
}

var addCheckPoint = function(key,hash,previousHash,timestamp,nonce){
  //console.log("chain state of "+key.toString()+" and hash "+hash.toString()+" previousHash "+previousHash+" timestamp "+timestamp+" nonce "+nonce);
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

var getTopChainStateCheckPoint = async function(blockNum,chainRiser){
  return new Promise(async function(resolve,reject){
    var riserOffset = (parseInt(blockNum) % parseInt(chainRiser));//keep in mind it is plus 1 for chain
    var checkPointBlockNum = parseInt(blockNum - riserOffset);
    console.log("got me a checkpoint of "+checkPointBlockNum);
    var stream = db.createReadStream();
    stream.on('data',function(data){
      if(data.key.toString().split(":")[0] == "cs" && data.key.toString().split(":")[1] == checkPointBlockNum){
        console.log('key = '+data.key+" value = "+data.value.toString());
        resolve(data.value.toString());
      }
    })
  })
}

var getChainStateCheckPoint = function(blockNum,hash,cb){
  db.get("cs:"+blockNum+":"+hash, function(err, value){
    if(value){
      return true;
    }else{
      return false;
    }
  })
}

var getCheckPoints = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "cs"){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })
}

var addNode = function(key, value){
  return new Promise(function(resolve, reject) {
    db.put(key, value, function (err) {
      if (err){
        reject(console.log('Add node failed!', err));
      }else{
        //resolve(console.log("added node "+key));
      } // some kind of I/O error
    })
  });
}

var getNodes = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "node"){
      console.log('key = '+data.key+" value = "+data.value.toString());
    }
  })
}

var getNodeById =   function(nodeId){
  return new Promise(function(resolve, reject) {
    var stream = db.createReadStream();
    //console.log("in the node storage....");

    var nodeRecords = [];

    stream.on('data',function(data){
      //console.log('outside the if key = '+data.key+" value = "+data.value.toString());
      if(data.key.toString().split(":")[0] == "node" && data.key.toString().split(":")[1] == nodeId){
        //console.log("get node by id");
        //console.log('key = '+data.key+" value = "+data.value.toString());
        var thisRec = {[data.key.toString()]:data.value.toString()}
        nodeRecords.push(JSON.stringify(thisRec))
      }
    })

    stream.on('end',function(){
      resolve(nodeRecords)
    })

  })
}

var addUpdateSafe = function(safeKey,peerSafeJSON){
  db.get("safe:"+safeKey, function (err, value) {
    if(err){
      console.log("in the error "+safeKey)
      db.put("safe:"+safeKey,peerSafeJSON)
    }else{
      console.log("in the normal "+safeKey)
      db.put("safe:"+safeKey,peerSafeJSON)
    }
  })
}

var deleteSafe = function(safeKey){
  db.del(safeKey).then(function(){console.log("deleting this order "+safeKey);});
}


var getPeerSafe = function(safeKey,cb){
  db.get("safe:"+safeKey, function (err, value) {
    if(err){
      cb('nodata');
    }else{
      cb(value);
    }
  })
}

var getPeerSafeAccounts = function(safeKey,cb){
  var stream = db.createReadStream();
  var listLockedUnspents = [];
  console.log("why arent we showing "+safeKey);
  stream.on('data',function(data){
    //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
    //console.log('key = '+data.key+" value = "+data.value.toString());
    if(data.key.toString().includes(safeKey)){//possible another block enters the db s no upper limit
      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      console.log("key: "+data.key.toString()+" value: "+data.value.toString());
      var thisSafeAccount = data.value.toString()
      listLockedUnspents.push(thisSafeAccount);
    }
  });

  stream.on('close',function(){
    cb(listLockedUnspents);
  });

}

var getAllPeerSafes = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
    //console.log('key = '+data.key+" value = "+data.value.toString());
    if(data.key.toString().split(":")[0] == "safe"){//possible another block enters the db s no upper limit
      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      console.log("key: "+data.key.toString()+" value: "+data.value.toString());
    }
  });
}

var addBlock = async function(blknum,block,blkhash,callfrom,cbSetChainStateTX,chainRiser,blkCheckPointHash,checkPointHash){
  console.log("<<<<<----------------ADDS BLOCK TO LEVEL DB HERE------------>>>>>")
  console.log("called from "+callfrom);
  //console.log("inside add block"+block.toString());//verbose
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
  console.log(chalk.black.bgCyan("adding block "+blknum+" as "+hexBlockNum));
  putRecord("sfblk:"+hexBlockNum,block)
  putRecord("hshblk:"+blkhash,blocknum)
  //parseInt(hexString, 16);//this is back to number from hex
  //console.log("<<<<<----------------BLOCK REWARDS LEVEL DB HERE------------>>>>>")
/////////////////////////////////////////////////////////CALCULATE BLOCK REWARDS
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
////////////////////////////////////////////////////////////////////////PRE MINE

  var blockNumHash = blkhash;
  var txConfirmation;
  var txIndex = 0;

  var thisBlockCheckPointHash = Hash(blkCheckPointHash+checkPointHash);

  if(parseInt(blknum) == 1){//premines
    ///////////////////////////////////////////////////////////////////CORE DEVS
    var osoTx = await new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      //var addTransaction = async function(transactionKey,transaction,blockNum,blkChainStateHash,txIndex){
      txConfirmation = await addTransaction("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x0666bf13ab1902de7dee4f8193c819118d7e21a6","SFRX",parseFloat(750000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })
    //whqt I had for PMT tht I removed for now - in the git updates removed 4-5-2019 for each
    /****
    trie.get("0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX", function (err, value) {
      //console.log("grabbing balance of from address");
      var adjustedValue = 0;
      if(value){
        //console.log("which is "+value.toString()+" trie root is "+trie.root.toString('hex'));
        adjustedValue = parseFloat(value.toString());
      }else{
        adjustedValue = 0;
      }
      parseFloat(adjustedValue = adjustedValue + parseFloat(750000)).toFixed(8);
      trie.put("0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX", adjustedValue.toString(), function () {
        trie.get("0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX", function (err, value) {
          //if(value) console.log(value.toString()+" trie root is "+trie.root.toString('hex'))
          db.get(new Buffer.from(trie.root.toString('hex'), 'hex'), {
            encoding: 'binary'
          }, function (err, value) {
            //console.log(value+" "+value.toString('hex'));
          });
        });
      });
    });
    ****/
    var ridzTx = await new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xc393659c2918a64cdfb44d463de9c747aa4ce3f7","SFRX",parseFloat(750000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })


    var jalTx = await new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xA54EE4A7ab23068529b7Fec588Ec3959E384a816","SFRX",parseFloat(750000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var tbatesTx = await new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x5a911396491C3b4ddA38fF14c39B9aBc2B970170","SFRX",parseFloat(750000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var beastTx = await new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", "750000", "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103","SFRX",parseFloat(750000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })
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
    var osoTxEGEM = await new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "100000", "EGEM", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:EGEM:"+JSON.parse(block)["timestamp"]+":"+osoTxEGEM.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:EGEM:"+JSON.parse(block)["timestamp"]+":"+osoTxEGEM.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxEGEM),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x7357589f8e367c2C31F51242fB77B350A11830F3","EGEM",parseFloat(100000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var osoTxBTC = await new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "3", "BTC", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:BTC:"+JSON.parse(block)["timestamp"]+":"+osoTxBTC.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:BTC:"+JSON.parse(block)["timestamp"]+":"+osoTxBTC.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxBTC),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x7357589f8e367c2C31F51242fB77B350A11830F3","BTC",parseFloat(3),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 3, "BTC"),//BTC
    var osoTxETH = await new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "10", "ETH", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:ETH:"+JSON.parse(block)["timestamp"]+":"+osoTxETH.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:ETH:"+JSON.parse(block)["timestamp"]+":"+osoTxETH.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxETH),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x7357589f8e367c2C31F51242fB77B350A11830F3","ETH",parseFloat(10),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    //new Transaction(null, "0x7357589f8e367c2C31F51242fB77B350A11830F3", 10, "ETH"),//ETH
    var osoTxXBI = await new Transaction("sapphire", "0x7357589f8e367c2C31F51242fB77B350A11830F3", "1000", "XBI", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:XBI:"+JSON.parse(block)["timestamp"]+":"+osoTxXBI.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x7357589f8e367c2C31F51242fB77B350A11830F3:XBI:"+JSON.parse(block)["timestamp"]+":"+osoTxXBI.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTxXBI),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x7357589f8e367c2C31F51242fB77B350A11830F3","XBI",parseFloat(1000),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

  }else{//perblock rewards from block 2 until
    ///////////////////////////////////////////////////////////////////CORE DEVS
    var osoTx = await new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x0666bf13ab1902de7dee4f8193c819118d7e21a6","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var ridzTx = await new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xc393659c2918a64cdfb44d463de9c747aa4ce3f7","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var jalTx = await new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xA54EE4A7ab23068529b7Fec588Ec3959E384a816","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var tbatesTx = await new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0x5a911396491C3b4ddA38fF14c39B9aBc2B970170","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    var beastTx = await new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord("0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    //miner
    var minerTx = await new Transaction("sapphire", JSON.parse(block)["miner"], calcMiningReward, "SFRX", JSON.parse(block)["timestamp"]);
    await db.get("tx:sapphire:"+JSON.parse(block)["miner"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["miner"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(minerTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord(JSON.parse(block)["miner"],"SFRX",parseFloat(calcMiningReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    //sponsor
    var sponsorTx = await new Transaction("sapphire", JSON.parse(block)["sponsor"], calcSponsorReward, "SFRX", JSON.parse(block)["timestamp"]);
    db.get("tx:sapphire:"+JSON.parse(block)["sponsor"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
      //we skip the intry
    }).catch(async function(){
      txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["sponsor"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(sponsorTx),blocknum,thisBlockCheckPointHash,txIndex);
      addAllBalanceRecord(JSON.parse(block)["sponsor"],"SFRX",parseFloat(calcMiningReward).toFixed(8),txConfirmation,blocknum,txIndex);
      txIndex++;
    })

    //community DEVS
    //sapphire Node T2 SUPER NODE
    //EGEM node T1
    //EGEM node T2

  }

  Promise.resolve(()=>{
    var cbGetChainStateTXHeight = function(value){
      if(parseInt(value + 1) == blocknum){
        cbSetChainStateTX(blocknum,txConfirmation);
      }
    }
    getChainStateParam("transactionHeight");
  });



}

var getBlock = function(blknum,callBack){
  //console.log("BLOCK FROM LEVEL DB");
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);
    db.get("sfblk:"+hexBlockNum, function (err, value) {
      return new Promise((resolve) => {
        if (err){
          callBack(blknum+":"+err);
          return;
        } // likely the key was not found

        // Ta da!
        //console.log(hexBlockNum+": " + value)
        //console.log("previousHash: "+JSON.parse(value)["previousHash"])
        resolve(value);
        callBack(value);
      })
    })
}

var getBlockByHash = function(blockHash){
  return new Promise((resolve)=> {
    db.get("hshblk:"+blockHash,async function (err, value) {
      if (err) return console.log('Ooops!', err) // likely the key was not found

      // Ta da!
      console.log("hshblk:"+blockHash+": " + value)
      resolve(value);
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
          //console.log("here... "+data.key.toString());
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

var getAllBLocksByHash = function(){
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "hshblk"){
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

      //console.log("riser: "+riser+" blockHeight: "+blockHeight+" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))
      var returner = [];
      var stream = db.createReadStream();
      stream.on('data',function(data){
        //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
        //if(data.key.toString().split(":")[0] == "sfblk"){
        //  console.log('key = '+data.key+" value = "+data.value.toString());
        //}

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


///////////////////////this function validates a range of blocks for chain symch
var blockRangeValidate = function(blockHeight,riser,callback,blockHash,chainRiser,calledFrom){

      console.log("BLOCKHEIGHT: "+blockHeight);
      console.log("RISER: "+riser);
      console.log("CALLED FROM "+calledFrom)

      var stream = db.createReadStream();
      var dataStream = [];
      var currentBlockToValidate = blockHeight;
      var currentBlockHash = blockHash;

      stream.on('data',function(data){
        dataStream.push(data)
      });

      stream.on('close',function(){

        for(var dataItem in dataStream){
          var thisDataItem = dataStream[dataItem];
          if((thisDataItem.key.toString().split(":")[0] == "sfblk") && (parseInt(parseInt(thisDataItem.key.toString().split(":")[1],16).toString(10)) == parseInt(currentBlockToValidate)) && (parseInt(currentBlockToValidate) <= parseInt(riser)) ){


            //console.log("top "+currentBlockToValidate+" current hash "+currentBlockHash);
            //console.log("second "+parseInt(parseInt(thisDataItem.key.toString().split(":")[1],16).toString(10)));
            //console.log("why below 10 "+thisDataItem.key.toString());

            /////perform the validation

            var isValidBlock = thisDataItem.value.toString();

            //going to validate chaeckpoints
            console.log("passing thru this conditon "+currentBlockToValidate+" "+chainRiser+" "+(currentBlockToValidate%chainRiser == 0))
            if(currentBlockToValidate%chainRiser == 0){
              console.log("now we need this to be true "+currentBlockToValidate+" "+parseInt(currentBlockToValidate-chainRiser)+" "+parseInt(currentBlockToValidate-chainRiser)+" "+(parseInt(currentBlockToValidate-chainRiser)>0 && parseInt(currentBlockToValidate-chainRiser)>chainRiser))
              if(parseInt(currentBlockToValidate-chainRiser) > 0 && parseInt(currentBlockToValidate-chainRiser) >= chainRiser){
                var targetCheckPoint = parseInt(currentBlockToValidate-chainRiser);
                var riserAgo = dataStream[dataItem-chainRiser].value.toString();
                //console.log(" YES THIS IS MY CHECK cs:"+parseInt(currentBlockToValidate-chainRiser)+":"+JSON.parse(riserAgo)["hash"]);
                db.get("cs:"+parseInt(currentBlockToValidate-chainRiser)+":"+JSON.parse(riserAgo)["hash"],function (err, value) {
                  if(err){
                    callback(false,parseInt(JSON.parse(currentBlockToValidate-chainRiser)["blockHeight"]-1),"");
                  }else{
                    //console.log("--------------------------------------------------");
                    //console.log("Checkpoint Value Existed and is: "+value.toString());
                    //console.log("--------------------------------------------------");
                  }
                });

              }
            }

            //console.log("is this one und "+JSON.parse(isValidBlock)["timestamp"]);
            var newBlockHash = Hash(currentBlockHash+JSON.parse(isValidBlock)["timestamp"]+JSON.parse(isValidBlock)["nonce"]);//this.previousHash + this.timestamp + this.nonce
            console.log("comparing "+JSON.parse(isValidBlock)["hash"]+" to "+newBlockHash);
            if(JSON.parse(isValidBlock)["hash"] == newBlockHash){

              //I can set a flag here to load transactions from the block

              //set the state validated height
              callback(true,parseInt(JSON.parse(isValidBlock)["blockHeight"]),JSON.parse(isValidBlock)["hash"]);

            }else{
              callback(false,parseInt(JSON.parse(isValidBlock)["blockHeight"]-1),"");
            }
            currentBlockHash = JSON.parse(isValidBlock)["hash"];
            //console.log("VALIDATING BLOCK PREV HASH and NUMBER "+JSON.parse(isValidBlock)["blockHeight"]+JSON.parse(isValidBlock)["previousHash"]+JSON.parse(isValidBlock)["hash"]);
            //console.log("here... "+thisDataItem.key.toString()+" "+thisDataItem.value.toString());
            ///end perform the validation

            currentBlockToValidate++;
          }
        }
        if(currentBlockToValidate == blockHeight){
          //console.log("ping it "+currentBlockToValidate);
          callback(false,parseInt(currentBlockToValidate-1),"");
        }
        console.log(chalk.black.bgCyan("Block range validator data stream is complete at ")+chalk.bgMagenta(blockHeight));

        /***
        if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight))){//possible another block enters the db s no upper limit

          var isValidBlock = data.value.toString();
          var newBlockHash = Hash(currentBlockHash+JSON.parse(isValidBlock)["timestamp"]+JSON.parse(isValidBlock)["nonce"]);//this.previousHash + this.timestamp + this.nonce
          console.log("comparing "+JSON.parse(isValidBlock)["hash"]+" to "+newBlockHash);
          if(JSON.parse(isValidBlock)["hash"] == newBlockHash){
            //set the state validated height
            callback(true,parseInt(JSON.parse(isValidBlock)["blockHeight"]));
          }else{
            callback(false,parseInt(JSON.parse(isValidBlock)["blockHeight"]-1));
          }
          currentBlockHash = JSON.parse(isValidBlock)["hash"];
          console.log("VALIDATING BLOCK PREV HASH and NUMBER "+JSON.parse(isValidBlock)["blockHeight"]+JSON.parse(isValidBlock)["previousHash"]+JSON.parse(isValidBlock)["hash"]);
          console.log("here... "+data.key.toString()+" "+data.value.toString());

        }
        ***/

      });

}
//////////////////////////////////////////////////////////end blockRangeValidate

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

//////////////////////////////////the conglamorate transation with storage nonce
var addTransaction = async function(transactionKey,transaction,blockNum,blkChainStateHash,txIndex){
  return new Promise(async function(resolve) {
    var confirmationHash = await Hash(txIndex+transaction["hash"]+blockNum+blkChainStateHash);
    transaction.confirmationHash = await confirmationHash;
    db.put(transactionKey, transaction).then(async function(){
      await db.get(transactionKey).then(function(value){
        var txConfirmationHash = JSON.parse(value)["hash"];
        console.log("add transaction txConfirmationHash "+txConfirmationHash)
        resolve(txConfirmationHash);
      }).catch(console.log)
    }).catch(console.log);
  })
}

var addTransactions = async function(transactions,blockhash,blocknum,blkChainStateHash,cbTransactionState = console.log){

    //console.log("T R A N S A C T I O N S  B E I N G  A D D E D  H E R E");
    transactions = JSON.parse(JSON.stringify(transactions));

    var txIndex = 0;
    var txConfirmation;

    for(tranx in JSON.parse(transactions)){
      var receipt = JSON.parse(transactions)[tranx];

      //receipts have a key of toAddress:timestamp:receipthash atm
      txConfirmation = await addTransaction("tx:"+receipt["fromAddress"].toLowerCase()+":"+receipt["toAddress"].toLowerCase()+":"+receipt["ticker"]+":"+receipt["timestamp"]+":"+receipt["hash"]+":"+blockhash,JSON.stringify(receipt),blocknum,blkChainStateHash,txIndex);
      //need to accumulate the balances and add or subtract to PMT

      addAllBalanceRecord(receipt["toAddress"],receipt["ticker"],parseFloat(receipt["amount"]).toFixed(8),txConfirmation,blocknum,txIndex);

      addAllBalanceRecord(receipt["fromAddress"],receipt["ticker"],parseFloat(receipt["amount"]*-1).toFixed(8),txConfirmation,blocknum,txIndex);
      //2) get the trie root hash and return for hasing into the block

      txIndex++;

    }

    console.log("TRANSACTION PROMISE RESOLVE SHOULD BE HERE ");
    cbTransactionState(blocknum+":"+txIndex+":"+txConfirmation);
    console.log("PROMISE RESOLVE HAPPENED NEXT IS RETURN ");


}


/////IF THE TRANSACTIONS ARE NOT PRSENT IN THE STREAD WE ARE GOING TO ADD THEM AND VALIDATE
var addTransactionsFromStream = async function(transactions,blockhash,blknum,block,cbUpdateChainStateTX,blkChainStateHash){

  var hexBlockNum = ("000000000000000" + blknum.toString(16)).substr(-16);

  console.log(transactions+" <--"+typeof(transactions))

  for(var key in transactions) {
    if(transactions.hasOwnProperty(key)){
      console.log("this is where has own key "+JSON.stringify(transactions));
      if(transactions.length > 0){
        //do nothing
      }else{
        transactions = [];
      }
    }else{
      transactions = JSON.parse(JSON.stringify(transactions));
      console.log("this is where it is parsed "+transactions);
    }
  }

  console.log(chalk.bgCyan.black("WOOOT ADDING TRANSACITONS ON VALIDATE WOOT "+transactions+ " blockhash " +blockhash+ " blknum " +blknum+" blkChainStateHash: "+blkChainStateHash))

  var txIndex = 0;
  var txConfirmation;

  /////////////////////////////////////////////////////////CALCULATE BLOCK REWARDS
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
  ////////////////////////////////////////////////////////////////////////PRE MINE

  ////////////////////////////////////////////////////////////////NATIVE REWARDS
  //core devs
  var osoTx = new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord("0x0666bf13ab1902de7dee4f8193c819118d7e21a6","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  var ridzTx = new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord("0xc393659c2918a64cdfb44d463de9c747aa4ce3f7","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  var jalTx = new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord("0xA54EE4A7ab23068529b7Fec588Ec3959E384a816","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  var tbatesTx = new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord("0x5a911396491C3b4ddA38fF14c39B9aBc2B970170","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  var beastTx = new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord("0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  //miner
  var minerTx = new Transaction("sapphire", JSON.parse(block)["miner"], calcMiningReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["miner"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(minerTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord(JSON.parse(block)["miner"],"SFRX",parseFloat(calcMiningReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  //sponsor
  var sponsorTx = new Transaction("sapphire", JSON.parse(block)["sponsor"], calcSponsorReward, "SFRX", JSON.parse(block)["timestamp"]);
  txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["sponsor"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(sponsorTx),blknum,blkChainStateHash,txIndex);
  addAllBalanceRecord(JSON.parse(block)["sponsor"],"SFRX",parseFloat(calcMiningReward).toFixed(8),txConfirmation,blknum,txIndex);
  txIndex++
  ////////////////////////////////////////////////////////////END NATIVE REWARDS

  ////////////////////////////////////////////////////////now block TXs in order
  console.log("WHAT IS TRANSACTIONS LENGTH ???? "+transactions.length)
  console.log()
  if(transactions.length > 0){
    for(tranx in transactions){

      console.log("in the transactions loop ")

      var receipt = transactions[tranx];
      //receipts have a key of toAddress:timestamp:receipthash atm
      txConfirmation = await addTransaction("tx:"+receipt["fromAddress"].toLowerCase()+":"+receipt["toAddress"].toLowerCase()+":"+receipt["ticker"]+":"+receipt["timestamp"]+":"+receipt["hash"]+":"+blockhash,JSON.stringify(receipt),blknum,blkChainStateHash,txIndex);
      //need to accumulate the balances and add or subtract to PMT

      addAllBalanceRecord(receipt["toAddress"],receipt["ticker"],parseFloat(receipt["amount"]).toFixed(8),txConfirmation,blknum,txIndex);

      addAllBalanceRecord(receipt["fromAddress"],receipt["ticker"],parseFloat(receipt["amount"]*-1).toFixed(8),txConfirmation,blknum,txIndex);
      //2) get the trie root hash and return for hasing into the block

      txIndex++
    }
  }
  /////////////////////////////////////////////////////////////////end block txs

  //will eventualy add a flag for if this is update or not or not
  cbUpdateChainStateTX(blknum,txConfirmation);

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

////////////////////////////////////////////////////////////////ALL BALANCE TREE
var addAllBalanceRecord = async function(address,ticker,amount,confirmation,blocknum,index){

  //I need some nonces on an address
  var setTxAddressNonce = function(fundsin,thisAddy,thisTicker,thisBlocknum,value){

    var allBalanceNonceStorage = [];
    //get the total at the last nonce
    db.get("abnc:"+thisAddy.toLowerCase()+":"+ticker).then(async function(nonces){
      //console.log("current nonce values are "+nonces+" and type of "+typeof(nonces))
      //console.log("current nonce values 0 are "+nonces[0]+" and type of "+typeof(nonces[0]))
      //console.log("what type is avs above "+typeof(allBalanceNonceStorage))
      allBalanceNonceStorage = [];
      //console.log("what type is avs below "+typeof(allBalanceNonceStorage))
      var currentTopEntry;
      for(var item in JSON.parse(nonces)){
        //console.log("nonces item "+item+" is "+JSON.stringify(JSON.parse(nonces)[item]));
        var thisEntry = JSON.parse(nonces)[item];
        allBalanceNonceStorage[item] = thisEntry;
        currentTopEntry = thisEntry;
        //console.log("adding them "+parseFloat(currentTopEntry.balance)+" then "+parseFloat(fundsin)+" the add "+parseFloat(parseFloat(currentTopEntry.balance)+parseFloat(fundsin)).toFixed(8))
      }
      //console.log(" and the length is "+allBalanceNonceStorage.length)
      //thisAddy,thisTicker,thisBlocknum,value.toString()
      var nextNonce = {address:thisAddy,ticker:thisTicker,amount:fundsin,blockHeight:thisBlocknum,prevBalance:currentTopEntry.balance,balance:parseFloat(parseFloat(currentTopEntry.balance)+parseFloat(fundsin)).toFixed(8)};
      allBalanceNonceStorage.push(nextNonce);
      //console.log(allBalanceNonceStorage+" and length is "+allBalanceNonceStorage.length)
      if(allBalanceNonceStorage.length > 4){//limiting my storage to 4 records
        allBalanceNonceStorage.shift();
      }
      //console.log("after update nonce values are "+allBalanceNonceStorage)
      db.put("abnc:"+thisAddy.toLowerCase()+":"+ticker,JSON.stringify(allBalanceNonceStorage))
    }).catch(function(err){//did not exist and so we make it 0
      console.log("well the error is this "+err)
      allBalanceNonceStorage = [];
      var nextNonce = {address:thisAddy,ticker:thisTicker,amount:fundsin,blockHeight:thisBlocknum,prevBalance:0,balance:parseFloat(fundsin)};
      allBalanceNonceStorage.push(nextNonce);
      //console.log("nothing existed so new record nonce values are "+allBalanceNonceStorage)
      //thisAddy,thisTicker,thisBlocknum,value.toString()
      db.put("abnc:"+thisAddy.toLowerCase()+":"+ticker,JSON.stringify(allBalanceNonceStorage))
    })

  }

  return new Promise((resolve)=> {
    //var currentBalance = 0;
    db.get("abal:"+address.toLowerCase()+":"+ticker).then(async function(value){
      var localBalanceJSON = await value.toString();
      var localBalance = await parseFloat(JSON.parse(localBalanceJSON)["balance"]);
      console.log("cool no error "+JSON.parse(localBalance)["balance"]+" and more things "+JSON.parse(localBalanceJSON)["hash"])
      var currentBalance = parseFloat(amount)+localBalance;
      updatedBalanceJSON = JSON.stringify({"balance":currentBalance,"hash":confirmation,"blockHeight":blocknum,"index":index});
      db.put("abal:"+address.toLowerCase()+":"+ticker,updatedBalanceJSON).then(async function(){
        await db.get("abal:"+address.toLowerCase()+":"+ticker, function (err, value) {
          if(err){
            return console.log('Ooops!', err) // likely the key was not found
          }else{
            //check blockheight and make a last checkhash total?

              setTxAddressNonce(amount,address.toLowerCase(),ticker,blocknum,value)

            console.log("abal:"+address.toLowerCase()+":"+ticker+": " + value)
            resolve(value)
          }
        })
      }).catch(resolve(console.log));
    }).catch(async function(error){
      console.log("why is there an error ? "+address+ticker+amount+error);
      //currentBalance = 0;
      var currentBalance = parseFloat(amount);
      updatedBalanceJSON = JSON.stringify({"balance":currentBalance,"hash":confirmation,"blockHeight":blocknum,"index":index});
      db.put("abal:"+address.toLowerCase()+":"+ticker,updatedBalanceJSON).then(async function(){
        await db.get("abal:"+address.toLowerCase()+":"+ticker, function (err, value) {
          if(err){
            return console.log('Ooops!', err) // likely the key was not found
          }else{
            //check blockheight and make a last checkhash total?
            console.log("abal:"+address.toLowerCase()+":"+ticker+": " + value)
            resolve(value)
          }
        })
      }).catch(resolve(console.log));
    });
    //log(chalk.yellow("event replay through rpc server [this message for dev]"));
  })

  /*****
  await db.get("abal:"+address+":"+ticker,async function(err,value){
    if(err){
      console.log("why is there an error ?");
      currentBalance = 0;
      currentBalance = parseFloat(amount);
      await putRecord("abal:"+address+":"+ticker,currentBalance);
    }else{
      console.log("cool no error "+parseFloat(value.toString()))
      currentBalance = parseFloat(amount)+parseFloat(value.toString());
      await putRecord("abal:"+address+":"+ticker,currentBalance);
    }
    //currentBalance+=parseFloat(amount).toFixed(8);
    console.log(chalk.bgMagenta("adding"));
    console.log(chalk.bgCyan("abal:"+address+":"+ticker+" ----> "+currentBalance));
  })
  *****/
}

var getBalanceAtAddressAllBalance = function(address,callback){
  console.log("Balances for Address "+address+" in ALL BALANCE: ");
  var allBalances = []
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "abal" && data.key.toString().split(":")[1].toLowerCase() == address.toLowerCase()){
      //balances from new all balance tree
      console.log('key = '+data.key+" value = "+data.value.toString());
      allBalances.push(parseFloat(JSON.parse(data.value.toString())["balance"]));
    }
  })
  stream.on("close",function(data){
    callback(allBalances);
  })
}

var getBalanceAtAddressABTrie = async function(address,ticker,abBlockHeight,callback){
  db.get("abal:"+address.toLowerCase()+":"+ticker).then(async function(value){
    var localBalanceJSON = await value.toString();
    var localBalance = await parseFloat(JSON.parse(localBalanceJSON)["balance"]);
    callback(localBalance)
  })
}

var getAddressNonce = function(address,ticker){
  console.log("get Address Nonce: ")
  var stream = db.createReadStream();

  stream.on('data',function(data){

    if(data.key.toString().split(":")[0] == "abnc" && data.key.toString().split(":")[1].toLowerCase() == address.toLowerCase()){
      console.log("this is the nonce records for "+address+" tocker "+ticker);
      console.log("key "+data.key.toString());
      console.log("value "+data.value.toString());
    }

  });
}
////////////////////////////////////////////////////////////END ALL BALANCE TREE

var getBalanceAtAddressFromTrie = function(address,callback){

  //trie.get("0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX", function (err, value) {
  //  console.log("grabbing balance of from address");

  trie.createReadStream()
  .on('data', function (data) {
    if(data.key.toString().split(":")[0] == address){
      var yo = JSON.stringify(data["key"]);
      var ho = JSON.stringify(data["value"]);
      var yo1 = Buffer.from(JSON.parse(yo).data);
      var ho1 = Buffer.from(JSON.parse(ho).data);
      console.log("key: "+yo1+" "+yo1.toString());
      console.log("value: "+ho1+" "+ho1.toString());
    }
  })
  .on('end', function() {
    //console.log('End. Trie Root is '+trie.root.toString('hex'))
  })
}

var getEverythingFromTrie = function(address,callback){
  trie.createReadStream()
  .on('data', function (data) {

      var yo = JSON.stringify(data["key"]);
      var ho = JSON.stringify(data["value"]);
      var yo1 = Buffer.from(JSON.parse(yo).data);
      var ho1 = Buffer.from(JSON.parse(ho).data);
      console.log("key: "+yo1+" "+yo1.toString());
      console.log("value: "+ho1+" "+ho1.toString());

  })
  .on('end', function() {
    console.log('End. Trie Root is '+trie.root.toString('hex'))
  })
}

var getBalanceAtAddress = function(address,callback){

    console.log("Total Balance of "+address);

    var balance = [];

    var stream = db.createKeyStream();

    stream.on('data',function(data){

      if(data.toString().split(":")[0] == "tx" && (data.toString().split(":")[1].toLowerCase() == address.toLowerCase() || data.toString().split(":")[2].toLowerCase() == address.toLowerCase())){
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

          if(data.toString().split(":")[1].toLowerCase() == address.toLowerCase()){
              console.log("deduct "+parseFloat(JSON.parse(value)["amount"]));
              balance[data.toString().split(":")[3]] -= parseFloat(JSON.parse(value)["amount"]);
          }

          if(data.toString().split(":")[2].toLowerCase() == address.toLowerCase()){
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
          console.log("okay2"+parseFloat(existing+orig));
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

    //if(data.toString().split(":")[4] == transactionID && data.toString().split(":")[5] == timestamp){
    if(data.toString().split(":")[4] == transactionID){
      putRecord("fox:"+transactionID,data);
      putRecord("tfox:"+transactionID,data);
      db.del(data).then(function(){console.log("deleting this order "+transactionID,timestamp);});
    }

  });


}

var callDeletedOrders = function(callBack){
  var deletableOrders= [];
  var stream = db.createReadStream();
  stream.on('data',function(data){
    if(data.key.toString().split(":")[0] == "tfox"){
      console.log('key = '+data.key+" value = "+data.value.toString());
      var deleteThisOrder = {"oxdid":data.key.toString().split(":")[1],"tsdid":data.value.toString()}
      deletableOrders.push(deleteThisOrder);
      db.del(data).then(function(){console.log("cleared tfox order "+data.key.toString().split(":")[0]);});
    }
  })
  stream.on("close",function(data){
    callBack(deletableOrders);
  })
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

var getOrdersSellSorted = function(callBack){

  console.log("Open SELL Orders SORTED leveldb");
  var result = [];

  var stream = db.createKeyStream();

  stream.on('data',function(data){

    if(data.toString().split(":")[1] == "SELL"){
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
      if (x > y) {return -1;}
      if (x < y) {return 1;}
      return 0;
    })
    //console.log("POST SORT");
    //console.log("results ss are "+resultss);
    callBack(resultss);
  });

}

var getOrdersPairBuyAndSell = function(pairBuy,pairSell,callback){

  console.log("Open PAIR BUY Orders leveldb");
  var result = [];
  var result2 = []

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
    var resultBuys = result.sort(function(a,b){
      var x = JSON.parse(a)["price"];
      //console.log("x "+x+a);
      var y = JSON.parse(b)["price"];
      //console.log("y "+y+b)
      if (x > y) {return -1;}
      if (x < y) {return 1;}
      return 0;
    })

    var stream2 = db.createKeyStream();

    stream2.on('data',function(data){

      if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "SELL" && data.toString().split(":")[2] == pairBuy && data.toString().split(":")[3] == pairSell){
        db.get(data, function (err, value) {
          console.log("value"+value);
          result2.push(value.toString());
        })
      }

    });
    //need to test the second callback to match previous set ups from nanosql
    stream2.on('close',function(data){
      var resultSells = result2.sort(function(a,b){
        var x = JSON.parse(a)["price"];
        //console.log("x "+x+a);
        var y = JSON.parse(b)["price"];
        //console.log("y "+y+b)
        if (x < y) {return -1;}
        if (x > y) {return 1;}
        return 0;
      })
      callback(resultBuys,resultSells);
    });

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

    if(data.toString().split(":")[0] == "ox" && data.toString().split(":")[1] == "SELL" && data.toString().split(":")[2] == pairBuy && data.toString().split(":")[3] == pairSell){
      db.get(data, function (err, value) {
        console.log("value"+value);
        result.push(value.toString());
      })
    }

  });

  stream.on('close',function(){
    var resultss = result.sort(function(a,b){
      var x = JSON.parse(a)["price"];
      //console.log("x "+x+a);
      var y = JSON.parse(b)["price"];
      //console.log("y "+y+b)
      if (x < y) {return -1;}
      if (x > y) {return 1;}
      return 0
    })
    callBack(resultss);
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
      if (x < y) {return -1;}
      if (x > y) {return 1;}
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

  getOrdersPairSell(obj["pairBuy"],obj["pairSell"],callBackResults);

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

var dumpToJsonFIleRange = function(cb,peer,start,end){

  var chainBlockHeight=start;
  var chainRiser=end;
  var jsonSynch = []

  console.log(" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))

  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
    //console.log('key = '+data.key+" value = "+data.value.toString());
    if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight)) && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) < parseInt(chainBlockHeight+end))){//possible another block enters the db s no upper limit
      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      //console.log("key... "+data.key.toString()+"  --> value "+data.value.toString());

      var thisRowKey = data.key.toString();
      var thisRowValue = data.value.toString();
      var thisRow = {[thisRowKey]:thisRowValue};

      jsonSynch.push(thisRow);

    }else if(data.key.toString().split(":")[0] == "tx"){
      //console.log("key... "+data.key.toString()+".....value "+data.value.toString());
      if(JSON.parse(data.value.toString())["timsetamp"] != 1521339498){
        var thisRowKey = data.key.toString();
        var thisRowValue = data.value.toString();
        var thisRow = {[thisRowKey]:thisRowValue};
        console.log("export tx key... "+data.key.toString()+".....value "+data.value.toString());
        jsonSynch.push(thisRow);
      }

    }else if(data.key.toString().split(":")[0] == "ox"){
      //console.log("key... "+data.key.toString()+".....value "+data.value.toString());

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


    var rowKey = Object.keys(content[row]);
    var rowValue = Object.values(content[row]);
    db.put(rowKey, rowValue, function (err) {
      if (err) return console.log('Ooops!', err) // some kind of I/O error
    })

    if(Object.keys(content[row]).toString().split(":")[0] != "tx"){
      //console.log("key is "+Object.keys(content[row])+"value is "+Object.values(content[row]));
    }else{
      //console.log("TRANSACTION and key is "+Object.keys(content[row])+"value is "+Object.values(content[row]));
      ///////////////////adding to trie
      ///////////////////WILL PROBABLY HAVE TO STORE THESE AND SORT BY TIMESTAMP
      //console.log("THIS SHOULD BE THE AMOUNT "+parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]));
      /////going to have to check decremenets also
      if(Object.keys(content[row]).toString().split(":")[4] != "1521339498"){//genesis hash
        trie.get(Object.keys(content[row]).toString().split(":")[2]+":"+Object.keys(content[row]).toString().split(":")[3], function (err, value) {
          //console.log("grabbing balance of from address ADD "+Object.keys(content[row]).toString().split(":")[2]+":"+Object.keys(content[row]).toString().split(":")[3]);
          var adjustedValue;
          if(value){
            //console.log("which is "+value.toString()+" trie root is "+trie.root.toString('hex'));
            adjustedValue = parseFloat(value.toString()).toFixed(8);
          }else{
            adjustedValue = parseFloat(0);
          }
          adjustedValue += parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]).toFixed(8);
          trie.put(Object.keys(content[row]).toString().split(":")[2]+":"+Object.keys(content[row]).toString().split(":")[3], adjustedValue, function () {
            trie.get(Object.keys(content[row]).toString().split(":")[2]+":"+Object.keys(content[row]).toString().split(":")[3], function (err, value) {
              if(value) //console.log(value.toString()+" trie root is "+trie.root.toString('hex'))
              db.get(new Buffer.from(trie.root.toString('hex'), 'hex'), {
                encoding: 'binary'
              }, function (err, value) {
                //console.log(value+" "+value.toString('hex'));
              });
            });
          });
        });
        ///////the debit side
        trie.get(Object.keys(content[row]).toString().split(":")[1]+":"+Object.keys(content[row]).toString().split(":")[3], function (err, value) {
          //console.log("grabbing balance of from address MINUS "+Object.keys(content[row]).toString().split(":")[1]+":"+Object.keys(content[row]).toString().split(":")[3]);
          var adjustedValue;
          if(value){
            //console.log("which is "+value.toString()+" trie root is "+trie.root.toString('hex'));
            adjustedValue = parseFloat(value.toString()).toFixed(8);
          }else{
            adjustedValue = parseFloat(0);
          }
          adjustedValue -= parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]).toFixed(8);
          trie.put(Object.keys(content[row]).toString().split(":")[1]+":"+Object.keys(content[row]).toString().split(":")[3], adjustedValue, function () {
            trie.get(Object.keys(content[row]).toString().split(":")[1]+":"+Object.keys(content[row]).toString().split(":")[3], function (err, value) {
              if(value) //console.log(value.toString()+" trie root is "+trie.root.toString('hex'))
              db.get(new Buffer.from(trie.root.toString('hex'), 'hex'), {
                encoding: 'binary'
              }, function (err, value) {
                //console.log(value+" "+value.toString('hex'));
              });
            });
          });
        });
      }
      //////////////end ADDING to trie
    }

  }

  cb(blockNum,cbChainGrab,chainRiser);

}

var dumpToStreamFIleRange = function(cb,peer,start,end){

  var chainBlockHeight=start;
  var chainRiser=end;
  var jsonSynch = []

  console.log(" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))

  var stream = db.createReadStream();
  stream.on('data',function(data){
    //console.log("block: "+parseInt(data.key.toString().split(":")[1],16).toString(10)+" hexBlockNum: "+parseInt(chainBlockHeight))
    //console.log('key = '+data.key+" value = "+data.value.toString());
    if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight)) && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) <= parseInt(chainBlockHeight+end))){//possible another block enters the db s no upper limit
      //console.log("here... "+data.key.toString()+" "+data.value.toString());
      //console.log("key... "+data.key.toString()+"  --> value "+data.value.toString());

      var thisRowKey = data.key.toString();
      var thisRowValue = data.value.toString();
      var thisRow = {[thisRowKey]:thisRowValue};

      jsonSynch.push(thisRow);

    }else if(data.key.toString().split(":")[0] == "tx"){
      //console.log("key... "+data.key.toString()+".....value "+data.value.toString());
      if(JSON.parse(data.value.toString())["timsetamp"] != 1521339498){
        var thisRowKey = data.key.toString();
        var thisRowValue = data.value.toString();
        var thisRow = {[thisRowKey]:thisRowValue};
        //console.log("export tx key... "+data.key.toString()+".....value "+data.value.toString());
        jsonSynch.push(thisRow);
      }

    }else if(data.key.toString().split(":")[0] == "ox"){
      //console.log("key... "+data.key.toString()+".....value "+data.value.toString());

      var thisRowKey = data.key.toString();
      var thisRowValue = data.value.toString();
      var thisRow = {[thisRowKey]:thisRowValue};

      jsonSynch.push(thisRow);

    }
  });


  stream.on('close',function(){

    console.log("Dat Copy data stream is complete");
    for(thisRowKey in jsonSynch){

    }
    cb(JSON.stringify(jsonSynch),peer)

  });

}

////////////////////////////////////////////////////////////PROMISE STYLE STREAM
var dumpToStreamBlockRange = function(cb,peer,start,end){

  return new Promise(async function(resolve, reject) {

    var chainBlockHeight=start;
    var chainRiser=end;
    var jsonSynch = []

    console.log(" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))

    var startTimeStamp;
    var endTimeStamp;

    var getTimeStamps = async function(){
      var timeStartFunction = function(blkStart){
        startTimeStamp = JSON.parse(blkStart)["timestamp"];
      }
      getBlock(parseInt(chainBlockHeight),timeStartFunction);
      var timeEndFunction = function(blkEnd){
        endTimeStamp = JSON.parse(blkEnd)["timestamp"];
      }
      getBlock(parseInt(chainBlockHeight+end),timeEndFunction);
    }

    await getTimeStamps();

    console.log(startTimeStamp+" "+endTimeStamp)

    var stream = db.createReadStream();

    stream.on('data',function(data){

      if(data.key.toString().split(":")[0] == "sfblk" && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) > parseInt(chainBlockHeight)) && (parseInt(parseInt(data.key.toString().split(":")[1],16).toString(10)) <= parseInt(chainBlockHeight+end))){//possible another block enters the db s no upper limit

        var thisRowKey = data.key.toString();
        var thisRowValue = data.value.toString();
        var thisRow = {[thisRowKey]:thisRowValue};

        jsonSynch.push(thisRow);

      /***
      }else if(data.key.toString().split(":")[0] == "tx" && data.key.toString().split(":")[4] >= startTimeStamp && data.key.toString().split(":")[4] <= endTimeStamp){
        //console.log("key... "+data.key.toString()+".....value "+data.value.toString());
        if(JSON.parse(data.value.toString())["timsetamp"] != 1521339498){
          var thisRowKey = data.key.toString();
          var thisRowValue = data.value.toString();
          var thisRow = {[thisRowKey]:thisRowValue};
          console.log("export tx key... "+data.key.toString()+".....value "+data.value.toString());
          jsonSynch.push(thisRow);
        }
      ***/

      }else if(data.key.toString().split(":")[0] == "ox"){
        //console.log("key... "+data.key.toString()+".....value "+data.value.toString());

        var thisRowKey = data.key.toString();
        var thisRowValue = data.value.toString();
        var thisRow = {[thisRowKey]:thisRowValue};

        jsonSynch.push(thisRow);

      }

    });


    stream.on('close',function(){

      console.log("The Block Sync Data Stream is Complete to "+end+" with "+jsonSynch.length+" records");
      for(thisRowKey in jsonSynch){

      }
      //cb(JSON.stringify(jsonSynch),peer)
      resolve(JSON.stringify(jsonSynch))

    });


  });



}
////////////////////////////////////////////////////////END PROMISE STYLE STREAM

var dumpToStreamTXOXRange = function(cb,peer,start,end){

  console.log(chalk.bgRed("TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS "))
  console.log(chalk.bgRed("TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS "))
  console.log(chalk.bgRed("TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS "))

  return new Promise(async function(resolve, reject) {

    var chainBlockHeight=start;
    var chainRiser=end;
    var jsonSynch = []

    console.log(" chainBlockHeight: "+chainBlockHeight+" hexBlockNum: "+parseInt(chainBlockHeight,16))

    var startTimeStamp;
    var endTimeStamp;

    var getTimeStamps = async function(){
      var timeStartFunction = function(blkStart){
        startTimeStamp = JSON.parse(blkStart)["timestamp"];
      }
      getBlock(parseInt(chainBlockHeight),timeStartFunction);
      var timeEndFunction = function(blkEnd){
        endTimeStamp = JSON.parse(blkEnd)["timestamp"];
      }
      getBlock(parseInt(chainBlockHeight+end),timeEndFunction);
    }

    await getTimeStamps();

    console.log(startTimeStamp+" "+endTimeStamp)

    var stream = db.createReadStream();

    console.log("TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS TRANSACTION TRANSACTIONS ")

    stream.on('data',function(data){

      if(data.key.toString().split(":")[0] == "tx" && data.key.toString().split(":")[4] >= startTimeStamp && data.key.toString().split(":")[4] <= endTimeStamp){
        //console.log("key... "+data.key.toString()+".....value "+data.value.toString());
        if(JSON.parse(data.value.toString())["timsetamp"] != 1521339498){
          var thisRowKey = data.key.toString();
          var thisRowValue = data.value.toString();
          var thisRow = {[thisRowKey]:thisRowValue};
          console.log("export tx key... "+data.key.toString()+".....value "+data.value.toString());
          jsonSynch.push(thisRow);
        }

      }else if(data.key.toString().split(":")[0] == "ox"){
        //console.log("key... "+data.key.toString()+".....value "+data.value.toString());

        var thisRowKey = data.key.toString();
        var thisRowValue = data.value.toString();
        var thisRow = {[thisRowKey]:thisRowValue};

        jsonSynch.push(thisRow);

      }

    });


    stream.on('close',function(){

      console.log("The Block Sync Data Stream is Complete to "+end+" with "+jsonSynch.length+" records");
      for(thisRowKey in jsonSynch){

      }
      //cb(JSON.stringify(jsonSynch),peer)
      resolve(JSON.stringify(jsonSynch))

    });


  });



}
////////////////////////////////////////////////////END PROMISE STREAM TX and OX

var importFromJSONStream = async function(cb,blockNum,cbChainGrab,chainRiser,incontent,cbAbal){

  console.log(chalk.blue("-----------------------"))
  console.log(chalk.blue("import from json stream"))
  console.log(chalk.blue("import from json stream"))
  console.log(chalk.blue("import from json stream"))
  console.log(chalk.blue("-----------------------"))

  try {
      var content = JSON.parse(JSON.stringify(incontent));
      content = JSON.parse(content);
      //console.log(content);
  } catch (e) {
      console.log(chalk.bgRed(e+" WHAT?? <-----------"))
      //return false;
  }

  console.log("IMPORT FROM JSON STREAM ...")
  console.log(chalk.bgCyan("IMPORTING ..."))
  console.log(chalk.bgRed("IMPORTING ..."))
  console.log(chalk.bgRed("IMPORTING ..."))
  console.log(chalk.bgRed("IMPORTING ..."))
  //console.log("WHATTTTTTTTT IS MY CONNNNNNETTTTTEEEEENNNNNTTTTT "+Object.keys(content));


    for(row in content){

      var rowKey = Object.keys(content[row]);
      var rowValue = Object.values(content[row]);
      if(rowKey.toString().split(":")[0] == "sfblk"){
        //console.log("I AM INSIDE THE inserts KEY "+rowKey+" VALUE "+rowValue);
      }

      db.put(rowKey, rowValue, function (err) {
        if (err) return console.log('Ooops!', err) // some kind of I/O error
      })

      if(Object.keys(content[row]).toString().split(":")[0] != "tx"){
        //console.log("key is "+Object.keys(content[row])+"value is "+Object.values(content[row]));
          if(Object.keys(content[row]).toString().split(":")[0] == "sfblk"){
            putRecord("hshblk:"+JSON.parse(Object.values(content[row]).toString())["hash"],JSON.parse(Object.values(content[row]).toString())["blockHeight"])
          }
      }

    }

    for(row in content){
      if(Object.keys(content[row]).toString().split(":")[0] == "tx"){
        //console.log("TRANSACTION and key is "+Object.keys(content[row])+"value is "+Object.values(content[row]));
        ///////////////////adding to trie
        ///////////////////WILL PROBABLY HAVE TO STORE THESE AND SORT BY TIMESTAMP
        //console.log("THIS SHOULD BE THE AMOUNT "+parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]));
        /////going to have to check decremenets also



        if(Object.keys(content[row]).toString().split(":")[4] != "1521339498"){//genesis hash

          var balTicker = Object.keys(content[row]).toString().split(":")[3];
          var balAddressTo = Object.keys(content[row]).toString().split(":")[2];
          var balAddressFrom = Object.keys(content[row]).toString().split(":")[1];
          var balAmount = parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]).toFixed(8);
          var balBlockHash =  Object.keys(content[row]).toString().split(":")[6];

          await getBlockByHash(balBlockHash).then(async function(blknum){
            console.log(chalk.bgRed("ADDY ALL BAL ----> "+" adding to "+Object.keys(content[row]).toString().split(":")[2]+" amt: "+parseFloat(JSON.parse(Object.values(content[row]).toString())["amount"]).toFixed(8)))
            await addAllBalanceRecord(balAddressTo.toLowerCase(),balTicker,balAmount,balBlockHash,blknum);
            await addAllBalanceRecord(balAddressFrom.toLowerCase(),balTicker,parseFloat(parseFloat(balAmount*-1).toFixed(8)),balBlockHash,blknum);
          }).catch(function(err){
            console.log;
          })

        }
      }
    }

  cb(blockNum,cbChainGrab,chainRiser);

}

var getStateTrieRootHash = function(){
  return trie.root.toString('hex');
}

module.exports = {
    getAll:getAll,
    refresh:refresh,
    closeDB:closeDB,
    dumpDatCopy:dumpDatCopy,
    dumpToJsonFIle:dumpToJsonFIle,
    dumpToJsonFIleRange:dumpToJsonFIleRange,
    dumpToStreamFIleRange:dumpToStreamFIleRange,
    dumpToStreamBlockRange:dumpToStreamBlockRange,
    dumpToStreamTXOXRange:dumpToStreamTXOXRange,
    importFromJSONFile:importFromJSONFile,
    importFromJSONStream:importFromJSONStream,
    addChainParams:addChainParams,
    getChainParams:getChainParams,
    getChainParamStream:getChainParamStream,
    getChainParamsByName:getChainParamsByName,
    getChainParamsBlockHeight:getChainParamsBlockHeight,
    getCheckPoints:getCheckPoints,
    addChainState:addChainState,
    getChainStateParam:getChainStateParam,
    getChainStateCheckPoint:getChainStateCheckPoint,
    getTopChainStateCheckPoint:getTopChainStateCheckPoint,
    addNode:addNode,
    addUpdateSafe:addUpdateSafe,
    getPeerSafe:getPeerSafe,
    getPeerSafeAccounts:getPeerSafeAccounts,
    getAllPeerSafes:getAllPeerSafes,
    deleteSafe:deleteSafe,
    getNodes:getNodes,
    getNodeById:getNodeById,
    addBlock:addBlock,
    getBlock:getBlock,
    removeBlock:removeBlock,
    getBlockByHash:getBlockByHash,
    getAllBLocksByHash:getAllBLocksByHash,
    getAllBLocks:getAllBLocks,
    getBlockchain:getBlockchain,
    getBlockStream:getBlockStream,
    getBlockRange:getBlockRange,
    blockRangeValidate:blockRangeValidate,
    clearDatabase:clearDatabase,
    addTransactions:addTransactions,
    addTransactionsFromStream:addTransactionsFromStream,
    getTransactions:getTransactions,
    getTransactionReceiptsByAddress:getTransactionReceiptsByAddress,
    getBalanceAtAddress:getBalanceAtAddress,
    getBalanceAtAddressFromTrie:getBalanceAtAddressFromTrie,
    getBalanceAtAddressABTrie:getBalanceAtAddressABTrie,
    getAddressNonce:getAddressNonce,
    addOrder:addOrder,
    getOrdersBuy:getOrdersBuy,
    getOrdersBuySorted:getOrdersBuySorted,
    getOrdersSellSorted:getOrdersSellSorted,
    getOrdersPairBuy:getOrdersPairBuy,
    getOrdersPairSell:getOrdersPairSell,
    getOrdersPairBuyAndSell:getOrdersPairBuyAndSell,
    clearOrderById:clearOrderById,
    callDeletedOrders:callDeletedOrders,
    buildTrade:buildTrade,
    getStateTrieRootHash:getStateTrieRootHash,
    getEverythingFromTrie:getEverythingFromTrie,
    addAllBalanceRecord:addAllBalanceRecord,
    getBalanceAtAddressAllBalance:getBalanceAtAddressAllBalance
}
