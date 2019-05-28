var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.egem.io/custom"));

var txTo = "0x2025ed239a8dec4de0034a252d5c5e385b73fcd0"

activeWallet = web3.eth.accounts.privateKeyToAccount("0x3141592653589793238462643383279502884197169399375105820974944592");

var postMessage = function(message){

  web3.eth.accounts.signTransaction({ to: txTo.toLowerCase().replace(/^\s+|\s+$/g, ''), data:web3.utils.toHex(message), value: 100, gas: 2000000 }
    , activeWallet.privateKey)
    .then(function(rawtx) {
        console.log('Raw TX:'+ rawtx.rawTransaction);
        console.log('sending now');
        web3.eth.sendSignedTransaction(rawtx.rawTransaction).then(function(rawTextTx){
          //messageAlerts();
          console.log("Hash :"+rawTextTx["transactionHash"]);
          console.log("Raw :"+rawTextTx);
          //pkSend.value = "";
          //document.getElementById("pksendbtn").setAttribute("disabled",true);
          //document.getElementById("pksendbtn").className = "btn btn-negative";
        }).catch(function(rawSendError){
            //insufficient funds for gas * price + value
            ////messageAlerts();
            //document.getElementById("account_history").innerHTML = 'Hmm.. there was an error: '+ String(rawSendError);
            console.log('Hmm.. there was an error rawsend: '+ String(rawtxError));
        });
    })
    .catch(function(rawtxError){
        //insufficient funds for gas * price + value
        //messageAlerts();
        //document.getElementById("account_history").innerHTML = 'Hmm.. there was an error: '+ String(rawtxError);
        console.log('Hmm.. there was an error in the catch: '+ String(rawtxError));
    });

}

var messageToPost = JSON.stringify({node:"channelName"});
//postMessage(messageToPost);

console.log(web3.utils.hexToUtf8("0x7b226e6f6465223a226368616e6e656c4e616d65227d"));

console.log(Buffer.from(web3.utils.toAscii("0xcb49b44ba602d8")).toString())
//a54ee4a7ab23068529b7fec588ec3959e384a816


web3.eth.getTransaction("0x76da21f99cd8ebcc955961b8559429e3421028f89e4d2fed69ec793d9e4948f2").then(function(tx){
  console.log("transaction data is "+tx.input)
  //console.log("in string format is "+web3.utils.hexToUtf8(tx.input));
  console.log("in ascii format is "+web3.utils.toAscii(tx.input));
})

web3.eth.getTransaction("0xc3c4e43f3a97140b5d3e8536c50ac2ce21a23e0580123cd5204c7a343196875f").then(function(tx){
  console.log("transaction data 2 is "+tx.input)
  console.log("in string format is "+web3.utils.hexToUtf8(tx.input));
})

var getBalance = async function(){
  //var orig = await web3.eth.getBalance("0x2025ed239a8dec4de0034a252d5c5e385b73fcd0", 2671434)
  var orig = await web3.eth.getBalance("0x2025ed239a8dec4de0034a252d5c5e385b73fcd0", 2674925)
  orig = web3.utils.fromWei(orig,'ether');
  console.log(orig);
}

getBalance();
