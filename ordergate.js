var Orderdb = require('./nano.js');
const readline = require('readline');

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

function queryr1(){
  //command line stuff
  rl.question('console action: ', (answer) => {
    console.log(`input: ${answer}`);
    if(isJSON(answer)){
      if(RegExp("^0x[a-fA-F0-9]{40}$").test(JSON.parse(answer)["fromAddress"])){//adding function capabilioties
        console.log("Valid EGEM Sapphire Address")
        //create the order
        var myorder = {'order':{id:null,"fromAddress":JSON.parse(answer)["fromAddress"],buyOrSell:JSON.parse(answer)["buyOrSell"],pairBuy:JSON.parse(answer)["pairBuy"],pairSell:JSON.parse(answer)["pairSell"],amount:JSON.parse(answer)["amount"],price:JSON.parse(answer)["price"]}};
        //var myorder = {order:JSON.parse(answer)};
        console.log("order is "+myorder)
        Orderdb.addOrder(myorder);

        queryr1();
      }else{
        console.log("not a valid query at this time");
        queryr1();
      }
    }else{
      //other commands can go Here
      console.log("catchy non json options go here but for now its a select");
      Orderdb.getOrdersBuy();
      Orderdb.getOrdersSell();
      Orderdb.getAllOrders();
      queryr1();
    }

  })
}

//var myorder = {order:{id:null,fromAddress:'0x0786bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SPHR',amount:'300',price:'26.00'}};

var myorder = {"order":{id:null,"fromAddress":'0x0786bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SPHR',amount:'300',price:'26.00'}};

console.log(myorder["order"]["fromAddress"]);


//Orderdb.clearDatabase();

//Orderdb.addOrder(myorder);

//Orderdb.getOrdersBuy();

//Orderdb.getOrdersSell();

queryr1();
