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
    console.log("yup we did send the msg ");
    ws2.send(msg);
  }
}

peerComChannel = class peerComChannel{
  constructor(ip){
    var ws2 = new WebSocket('ws://'+ip+':9491');
    ws2.on('open', function open() {
      ws2.send('something');
    });
    ws2.on('message', function incoming(data) {
      console.log("client"+data);
    });
    this.ws2 = ws2;
    this.send = function(msg){
      console.log("yup we did send the msg ");
       this.ws2.send(msg,function(error){
         // Do something in here here to clean things up (or don't do anything at all)
         console.log("the websicked errored "+error)
       });
    }
  }
}

//setTimeout(function(){myclient()},1000);

module.exports = {
  peerComChannel:peerComChannel,
  myclient:myclient
}
