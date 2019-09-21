const WebSocket = require('ws');



const wss = new WebSocket.Server({ port: 9491 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something back');
});



var myclient = function(ip){
  const ws2 = new WebSocket('ws://'+ip+':9491');

  ws2.on('open', function open() {
    ws2.send('something');
  });

  ws2.on('message', function incoming(data) {
    console.log("client"+data);
  });

  var send = function(msg){
    ws2.send(msg);
  }
}

//setTimeout(function(){myclient()},1000);

module.exports = {
  myclient:myclient
}
