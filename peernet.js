const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 9491 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something back');
});



var myclient = function(){
  const ws2 = new WebSocket('ws://149.28.32.186:9491');

  ws2.on('open', function open() {
    ws2.send('something');
  });

  ws2.on('message', function incoming(data) {
    console.log("client"+data);
  });
}

setTimeout(function(){myclient()},1000);
