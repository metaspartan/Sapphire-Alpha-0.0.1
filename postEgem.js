var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("https://lb.rpc.egem.io"));

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
