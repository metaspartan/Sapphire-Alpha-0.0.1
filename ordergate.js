var Orderdb = require('./nano.js');
const readline = require('readline');

const chalk = require('chalk');
const log = console.log;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

var myTradeCallback = function(orig,data) {
  log('SELL TRADE ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("this would be the transaction: ");
    log("BUYER "+orig["fromAddress"]+" OF "+orig["pairBuy"]+" QTY "+orig["amount"]+" FOR "+orig["price"]+" OF "+orig["pairBuy"]+" PER "+orig["pairSell"]);
    log("SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);

    if(parseInt(orig["amount"]) <= parseInt(data[obj]["amount"])){
      log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseInt(orig["amount"])+ " OF "+orig["pairBuy"]);
      log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseInt(data[obj]["amount"]) - parseInt(orig["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
      //log("UNFILLED REPLACEMENT ORDER: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "++ " OF "+orig["pairBuy"]);
    }else if (orig["amount"] > parseInt(data[obj]["amount"])){
      log("TRANSACTION: SELLER "+data[obj]["fromAddress"]+" to BUYER "+orig["fromAddress"]+" QTY "+parseInt(data[obj]["amount"])+ " OF "+orig["pairBuy"]);
      log("UNFILLED REPLACEMENT - SELLER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairSell"]+" QTY "+(parseInt(orig["amount"]) - parseInt(data[obj]["amount"]))+" FOR "+data[obj]["price"]+" OF "+data[obj]["pairBuy"]+" PER "+data[obj]["pairSell"]);
    }

  }
};

var myCallbackBuy = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    Orderdb.buildTrade(data[obj],myTradeCallback);
  }
};

var myCallbackSell = function(data) {
  log('BUY ORDERS: '+JSON.stringify(data));//test for input
  for (obj in data){
    log("BUYER "+data[obj]["fromAddress"]+" OF "+data[obj]["pairBuy"]+" QTY "+data[obj]["amount"]+" FOR "+data[obj]["price"]+" PER "+data[obj]["pairSell"]);
    Orderdb.buildTrade(data[obj],myTradeCallback);
  }
};

function queryr1(){
  //command line stuff
  rl.question('Enter a command: ', (answer) => {
    log(`input: ${answer}`);
    if(isJSON(answer)){
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(answer)["fromAddress"])){//adding function capabilioties
        log("Valid EGEM Sapphire Address")
        //create the order
        var myorder = {'order':{id:null,"fromAddress":JSON.parse(answer)["fromAddress"],buyOrSell:JSON.parse(answer)["buyOrSell"],pairBuy:JSON.parse(answer)["pairBuy"],pairSell:JSON.parse(answer)["pairSell"],amount:JSON.parse(answer)["amount"],price:JSON.parse(answer)["price"]}};
        //var myorder = {order:JSON.parse(answer)};
        log("order is "+myorder)
        Orderdb.addOrder(myorder);

        queryr1();
      }else{
        log("not a valid query at this time");
        queryr1();
      }
    }else{
      //Orderdb.clearOrderDatabase();
      //other commands can go Here
      log("catchy non json options go here but for now its a select");
      //Orderdb.getOrdersBuy(myCallback);
      Orderdb.getOrdersPairBuy("EGEM",myCallbackBuy);
      //Orderdb.getOrdersSell();
      //Orderdb.getAllOrders();
      queryr1();
    }

  })
}

//var myorder = {order:{id:null,fromAddress:'0x0786bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SFRX',amount:'300',price:'26.00'}};

var myorder = {"order":{id:null,"fromAddress":'0x0786bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SFRX',amount:'300',price:'26.00'}};

log(myorder["order"]["fromAddress"]);


//Orderdb.clearDatabase();

//Orderdb.addOrder(myorder);

//Orderdb.getOrdersPairBuy("EGEM");
//Orderdb.getOrdersPairBuy("SFRX");

//Orderdb.getOrdersSell();

queryr1();
