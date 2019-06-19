const express = require('express');
const app = express();
const hbs = require('hbs');
const port = 3003;
var path = require('path');

var getBalance;
var getBlockByHash;
var getBLock;
var initialize = function(getBal,getHash,getBlk,getTxByHash,getTxReceiptsByAddress,getOrdersBS,getOrdersSS){
  getBalance = getBal;
  getBlockByHash = getHash;
  getBlock = getBlk;
  getTransactionByHash = getTxByHash;
  getTransactionReceiptsByAddress = getTxReceiptsByAddress;
  getOrdersBuySorted = getOrdersBS;
  getOrdersSellSorted = getOrdersSS;
}

var server;

app.use('/css', express.static('css'));
app.use('/img', express.static('img'));
//app.use('/css', express.static('/css'))

var startExplorer = function(chainState,cb){

  app.set('views',path.join(__dirname,"views"))
  app.set("view engine","hbs")

  app.get('/',(req,res)=>{

    res.render('index',{chainState:chainState});
  })

  app.get('/address',(req,res)=>{
    if(req.query.theValue.length == 42 || RegExp("^0x[a-fA-F0-9]{40}$").test(req.query.theValue)){
      console.log(req.query.theValue+"was called");
      var myBalanceReturn = [];
      var addyBal = function(val){
        console.log("this address balance is ");
        console.log("------------------------");
        for(x in val){
          console.log(x+": "+val[x]);
          myBalanceReturn.push({"bal":{"ticker":x,"balance":val[x]}});
        }
        console.log("------------------------");
        console.log(JSON.stringify(myBalanceReturn));
        getTransactionReceiptsByAddress(req.query.theValue,function(txCollection){
          res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue,txCollection:txCollection});
        })
        //res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue});
      }
      getBalance(req.query.theValue,addyBal)
    }else if(req.query.theValue.length == 64 && RegExp("[0-9A-Fa-f]{64}").test(req.query.theValue)){

      getTransactionByHash(req.query.theValue,function(tx,bh){

        if(tx != "notatx" && tx != undefined){
          console.log("transaction found");
          res.render('transaction',{transaction:JSON.parse(tx),blockhash:bh});
        }else{
          var blockReturn = function(blk){
            res.render('block',{myBlockReturn:JSON.parse(blk)});
          }
          getBlockByHash(req.query.theValue).then(function(val){
            getBlock(val,blockReturn)
          })
        }
      })

    }else if(req.query.theValue.length < 9 && RegExp("[0-9]").test(req.query.theValue)){
      var blockReturn = function(blk,error){
          res.render('block',{myBlockReturn:JSON.parse(blk)});
      }
      if(chainState.topBlock > req.query.theValue){
        getBlock(req.query.theValue,blockReturn)
      }else{
        res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue+" is an invalid address, hash, or block number"});
      }
    }else{
      console.log("length is "+req.query.theValue.length);
      var myBalanceReturn = [];
      myBalanceReturn.push({"bal":{"ticker":'Does Not Exist',"balance":0}});
      res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue+" is probably not an address, block number, or hash"});
    }



  })

  app.get('/orderbook',(req,res)=>{

    var cbBuySide = function(ordersBuy){
      var orderBuyBook = [];
      for(order in ordersBuy){
        console.log("does it print"+JSON.parse(ordersBuy[order])["fromAddress"])
        orderBuyBook.push({
          fromAddress:JSON.parse(ordersBuy[order])["fromAddress"],
          pairing:JSON.parse(ordersBuy[order])["pairing"],
          pairBuy:JSON.parse(ordersBuy[order])["pairBuy"],
          pairSell:JSON.parse(ordersBuy[order])["pairSell"],
          amount:JSON.parse(ordersBuy[order])["amount"],
          price:JSON.parse(ordersBuy[order])["price"],
          transactionID:JSON.parse(ordersBuy[order])["transactionID"],
          originationID:JSON.parse(ordersBuy[order])["originationID"],
          timestamp:JSON.parse(ordersBuy[order])["timestamp"],
        })
      }

      var cbSellSide = function(ordersSell){
        var orderSellBook = [];
        for(order in ordersSell){
          console.log("does it print"+JSON.parse(ordersSell[order])["fromAddress"])
          orderSellBook.push({
            fromAddress:JSON.parse(ordersSell[order])["fromAddress"],
            pairing:JSON.parse(ordersSell[order])["pairing"],
            pairBuy:JSON.parse(ordersSell[order])["pairBuy"],
            pairSell:JSON.parse(ordersSell[order])["pairSell"],
            amount:JSON.parse(ordersSell[order])["amount"],
            price:JSON.parse(ordersSell[order])["price"],
            transactionID:JSON.parse(ordersSell[order])["transactionID"],
            originationID:JSON.parse(ordersSell[order])["originationID"],
            timestamp:JSON.parse(ordersSell[order])["timestamp"],
          })
        }

        res.render('orders',{buybook:orderBuyBook,sellbook:orderSellBook});

      }
      getOrdersSellSorted(cbSellSide);

    }
    getOrdersBuySorted(cbBuySide);

  })

  /***

  app.get('/', (request, response) => {
    var simpleExplorerResponse = '<script>';
    simpleExplorerResponse += 'setTimeout(function(){window.location.reload(1);}, 8000);'
    simpleExplorerResponse += '</script>';
    //simpleExplorerResponse += '<style>.header{border:1px solid black;}</style>';
    simpleExplorerResponse += '<link rel="stylesheet" type="text/css" href="/css/styles.css"/>';
    simpleExplorerResponse += '<div><img src="/img/EGEM-Sapphire-h-logo-black.png" /></div>';
    simpleExplorerResponse += '<div class="header"><spanEgem Sapphire Explorer</span>';
    simpleExplorerResponse += '<input type="text" id="address" />';
    simpleExplorerResponse += '<input type="button" value="click me" onClick='+cb("i dont know how")+'/></div>';
    simpleExplorerResponse += '<div class="content">';
      simpleExplorerResponse += '<div><span>Chain Walk Height: </span><span>'+chainState.chainWalkHeight+'</span></div>';
      simpleExplorerResponse += '<div><span>chainWalkHash: </span><span>'+chainState.chainWalkHash+'</span></div>';
      simpleExplorerResponse += '<div><span>synchronized: </span><span>'+chainState.synchronized+'</span></div>';
      simpleExplorerResponse += '<div><span>topBlock: </span><span>'+chainState.topBlock+'</span></div>';
      simpleExplorerResponse += '<div><span>checkPointHash: </span><span>'+chainState.checkPointHash+'</span></div>';
      simpleExplorerResponse += '<div><span>Peer Block Height: </span><span>'+chainState.peerNonce+'</span></div>';
      simpleExplorerResponse += '<div><span>Transaction Height: </span><span>'+chainState.transactionHeight+'</span></div>';
      simpleExplorerResponse += '<div><span>transactionRootHash: </span><span>'+chainState.transactionRootHash+'</span></div>';
      simpleExplorerResponse += '<div><span>Previous Transaction Height: </span><span>'+chainState.previousTxHeight+'</span></div>';
      simpleExplorerResponse += '<div><span>previousTxHash: </span><span>'+chainState.previousTxHash+'</span></div>';
      simpleExplorerResponse += '<div><span>transactionHashWeights: </span><span>'+JSON.stringify(chainState.transactionHashWeights)+'</span></div>';
    simpleExplorerResponse += '</div>';
    response.send(simpleExplorerResponse);
    response.end();
  })

  ***/

  server = app.listen(port, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
  })

}

var refreshExplorer = function(chainState){

  //console.log("refresh was called")

}

var closeExplorer = function(){
  server.close();
}

module.exports = {
  startExplorer:startExplorer,
  refreshExplorer:refreshExplorer,
  initialize:initialize,
  closeExplorer:closeExplorer
}
