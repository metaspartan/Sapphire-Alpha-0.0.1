const express = require('express');
const app = express();
const hbs = require('hbs');
const port = 3003;
var path = require('path');

var getBalance;
var initialize = function(getBal){
  getBalance = getBal;
}

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
    if(req.query.theValue.length != 42 || !RegExp("^0x[a-fA-F0-9]{40}$").test(req.query.theValue)){
      var myBalanceReturn = [];
      myBalanceReturn.push({"bal":{"ticker":'Does Not Exist',"balance":0}});
      res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue+" is an invalid address"});
    }else{
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
        console.log(JSON.stringify(myBalanceReturn))
        res.render('address',{myBalanceReturn:myBalanceReturn,address:req.query.theValue});
      }
      getBalance(req.query.theValue,addyBal)
    }



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

  app.listen(port, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
  })

}

var refreshExplorer = function(chainState){

  //console.log("refresh was called")

}

module.exports = {
  startExplorer:startExplorer,
  refreshExplorer:refreshExplorer,
  initialize:initialize
}
