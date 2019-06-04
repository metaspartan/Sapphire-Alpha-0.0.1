/////////////////////////////////////////////////REMOVING A BLOCK IS VER INTENSE
BlkDB.addBlock(JSON.parse(data)["block"]["transactions"],parseInt(JSON.parse(data)["block"]["blockHeight"]),JSON.stringify(JSON.parse(data)["block"]),JSON.parse(data)["block"]["hash"],"967",setChainStateTX,frankieCoin.chainRiser,thisBlockCheckPointHash);
var reorderBlock = async function(blknum,transactions,blknum,block,blkhash,callfrom,cbSetChainStateTX,chainRiser,blkCheckPointHash){
  //first step is get the block under this block

  blkNumForTx = (blknum-1);//gonna need to pull the transactions and rerun them

  console.log("REMOVING BLOCK NUMBER "+blknum+" FROM LEVELDB");
  var blocknum = parseInt(blknum);
  var hexBlockNum = ("000000000000000" + blocknum.toString(16)).substr(-16);

  //first we need to unwind the transactions
  ////////////////////////////////////////////////////////CALCULATE BLOCK REWARDS
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

  ///////////////////////////////////////////////////////////////////CORE DEVS
  var osoTx = await new Transaction("sapphire", "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

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

    })
    getAddressNonce
    addAllBalanceRecord("0x0666bf13ab1902de7dee4f8193c819118d7e21a6","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
  })
  /**8
  await db.get("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:0x0666bf13ab1902de7dee4f8193c819118d7e21a6:SFRX:"+JSON.parse(block)["timestamp"]+":"+osoTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(osoTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord("0x0666bf13ab1902de7dee4f8193c819118d7e21a6","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//1
  })
  ***/
  var ridzTx = await new Transaction("sapphire", "0xc393659c2918a64cdfb44d463de9c747aa4ce3f7", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /****
  await db.get("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:0xc393659c2918a64cdfb44d463de9c747aa4ce3f7:SFRX:"+JSON.parse(block)["timestamp"]+":"+ridzTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(ridzTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord("0xc393659c2918a64cdfb44d463de9c747aa4ce3f7","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//2
  })
  ***/
  var jalTx = await new Transaction("sapphire", "0xA54EE4A7ab23068529b7Fec588Ec3959E384a816", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /***
  await db.get("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:0xA54EE4A7ab23068529b7Fec588Ec3959E384a816:SFRX:"+JSON.parse(block)["timestamp"]+":"+jalTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(jalTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord("0xA54EE4A7ab23068529b7Fec588Ec3959E384a816","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//3
  })
  ***/
  var tbatesTx = await new Transaction("sapphire", "0x5a911396491C3b4ddA38fF14c39B9aBc2B970170", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /***
  await db.get("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:0x5a911396491C3b4ddA38fF14c39B9aBc2B970170:SFRX:"+JSON.parse(block)["timestamp"]+":"+tbatesTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(tbatesTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord("0x5a911396491C3b4ddA38fF14c39B9aBc2B970170","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//4
  })
  ***/

  var beastTx = await new Transaction("sapphire", "0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103", calcDevReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /***
  await db.get("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103:SFRX:"+JSON.parse(block)["timestamp"]+":"+beastTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(beastTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord("0xe1284A0968Fdcc44BEd32AAc6c1c7e97ee366103","SFRX",parseFloat(calcDevReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//5
  })
  ***/
  //miner
  var minerTx = await new Transaction("sapphire", JSON.parse(block)["miner"], calcMiningReward, "SFRX", JSON.parse(block)["timestamp"]);
  await db.del("tx:sapphire:"+JSON.parse(block)["miner"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /***
  await db.get("tx:sapphire:"+JSON.parse(block)["miner"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["miner"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+minerTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(minerTx),blocknum,thisBlockCheckPointHash,txIndex);
    addAllBalanceRecord(JSON.parse(block)["miner"],"SFRX",parseFloat(calcMiningReward).toFixed(8),txConfirmation,blocknum,txIndex);
    txIndex++;//6
  })
  ***/
  //sponsor
  var sponsorTx = await new Transaction("sapphire", JSON.parse(block)["sponsor"], calcSponsorReward, "SFRX", JSON.parse(block)["timestamp"]);
  db.del("tx:sapphire:"+JSON.parse(block)["sponsor"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){

  })
  /***
  db.get("tx:sapphire:"+JSON.parse(block)["sponsor"].toLowerCase()+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"]).then(async function(){
    //we skip the intry
  }).catch(async function(){
    //var localBalanceRecord = 0;
    txConfirmation = await addTransaction("tx:sapphire:"+JSON.parse(block)["sponsor"]+":SFRX:"+JSON.parse(block)["timestamp"]+":"+sponsorTx.hash+":"+JSON.parse(block)["hash"],JSON.stringify(sponsorTx),blocknum,thisBlockCheckPointHash,txIndex);
    localBalanceRecord = await addAllBalanceRecord(JSON.parse(block)["sponsor"],"SFRX",parseFloat(calcSponsorReward).toFixed(8),txConfirmation,blocknum,txIndex);
    //txConfirmation = await Hash(txConfirmation+localBalanceRecord);
    txIndex++;//7
  })
  ***/
  ////////////////////////////////////////////////////////now block TXs in order
  console.log("WHAT IS TRANSACTIONS LENGTH BLOCK ???? "+transactions.length)

  if(transactions.length > 0){
    for(tranx in transactions){

      console.log("in the transactions loop ")

      var receipt = transactions[tranx];

      var localTxFrom = receipt["fromAddress"].toLowerCase().substring(0,42);
      var localTxTo = receipt["toAddress"].toLowerCase().substring(0,42);

      var localToBalance = 0;
      var localFromBalance = 0;

      //receipts have a key of toAddress:timestamp:receipthash atm
      txConfirmation = await addTransaction("tx:"+localTxFrom+":"+localTxTo+":"+receipt["ticker"]+":"+receipt["timestamp"]+":"+receipt["hash"]+":"+JSON.parse(block)["hash"],JSON.stringify(receipt),blocknum,thisBlockCheckPointHash,txIndex);
      //need to accumulate the balances and add or subtract to PMT

      localToBalance = await addAllBalanceRecord(localTxTo,receipt["ticker"],parseFloat(receipt["amount"]).toFixed(8),txConfirmation,blocknum,txIndex);

      localFromBalance = await addAllBalanceRecord(localTxFrom,receipt["ticker"],parseFloat(receipt["amount"]*-1).toFixed(8),txConfirmation,blocknum,txIndex);
      //2) get the trie root hash and return for hasing into the block

      txConfirmation = await Hash(txConfirmation+localToBalance+localFromBalance)

      txIndex++
    }
  }

  //////////////////////////////////////////end remove tx//////////////////////

  db.del("sfblk:"+hexBlockNum, function(err){
    if(err) return console.log('Ooops!', err) // likely the key was not found
  });

}
****/
