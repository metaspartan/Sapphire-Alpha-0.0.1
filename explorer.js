const express = require('express')
const app = express()
const port = 3003



var startExplorer = function(chainState){

  app.get('/', (request, response) => {
    var simpleExplorerResponse = '<script>setTimeout(function(){window.location.reload(1);}, 8000)</script>;'
    simpleExplorerResponse += "<html>Egem Sapphire Explorer</html>";
    simpleExplorerResponse += '<div><span>Chain Walk Height: </span><span>'+chainState.chainWalkHeight+'</span></div>';
    simpleExplorerResponse += '<div><span>chainWalkHash: </span><span>'+chainState.chainWalkHash+'</span></div>';
    simpleExplorerResponse += '<div><span>synchronized: </span><span>'+chainState.synchronized+'</span></div>';
    simpleExplorerResponse += '<div><span>topBlock: </span><span>'+chainState.topBlock+'</span></div>';
    simpleExplorerResponse += '<div><span>checkPointHash: </span><span>'+chainState.checkPointHash+'</span></div>';
    simpleExplorerResponse += '<div><span>Peers: </span><span>'+chainState.peerNonce+'</span></div>';
    simpleExplorerResponse += '<div><span>Transaction Height: </span><span>'+chainState.transactionHeight+'</span></div>';
    simpleExplorerResponse += '<div><span>transactionRootHash: </span><span>'+chainState.transactionRootHash+'</span></div>';
    simpleExplorerResponse += '<div><span>Previous Transaction Height: </span><span>'+chainState.previousTxHeight+'</span></div>';
    simpleExplorerResponse += '<div><span>previousTxHash: </span><span>'+chainState.previousTxHash+'</span></div>';
    simpleExplorerResponse += '<div><span>transactionHashWeights: </span><span>'+JSON.stringify(chainState.transactionHashWeights)+'</span></div>';
    response.send(simpleExplorerResponse);
    response.end();
  })

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
  refreshExplorer:refreshExplorer
}
