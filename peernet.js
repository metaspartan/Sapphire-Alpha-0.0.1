const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 9491 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something back');
});

peerComChannel = class peerComChannel{
  constructor(ip){
    var ws2 = new WebSocket('ws://'+ip+':9491');
    ws2.on('open', function open() {
      ws2.send('something');
    });
    ws2.on('message', function incoming(data) {
      console.log("client"+data);
    });
    ws2.onerror=function(event){
      console.log("ws Error");
    }
    this.ws2 = ws2;
    this.send = function(msg){
      console.log("yup we did send the msg ");
      if (this.ws2.readyState !== WebSocket.OPEN) {
        console.log("cant send readyState is "+this.ws2.readyState)
      }else{
        this.ws2.send(msg);
      }
    }
  }
}

//setTimeout(function(){myclient()},1000);

module.exports = {
  peerComChannel:peerComChannel
}
