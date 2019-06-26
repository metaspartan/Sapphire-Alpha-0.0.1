'use strict';

let http = require('http');
let url = require('url');
let methods = require('./methods');
let types = require('./types');
const chalk = require('chalk');
const log = console.log;

let server = http.createServer(requestListener);
const PORT = process.env.NODE_PORT || 9090;

var isMining = false;

// we'll use a very very very simple routing mechanism
// don't do something like this in production, ok technically you can...
// probably could even be faster than using a routing library :-D


///////////////////////////////////////////////inter module parent communication
var impcparent;
var parentBroadcastPeersFunction;
var setChainStateTX;
var closeExplorer;
var thisNodeCanMine;
//callback fuction used to set a caller to the parent called by parent on load
var globalParentCom = function(callback,callback2,callback3,callback4,callfn1){
  //sets the impcparent with the function from parent
  impcparent = callback;
  parentBroadcastPeersFunction = callback2;
  setChainStateTX = callback3;
  closeExplorer = callback4;
  thisNodeCanMine = callfn1;
}

var impcParentMethods;
var impcbalanceEvent;
//callback fuction used to set a caller to the parent called by parent on load

///////////////////////////////////////////end inter module parent communication
var storeCBtransactionEvent;
var transactionCallback = async function(cb){
  //console.log("the callback is set now");
  storeCBtransactionEvent = cb;
}
var storeCBorderEvent;
var orderCallback = async function(cb){
  //console.log("the callback is set now");
  storeCBorderEvent = cb;
}

var txConfirmationEvent = function(txidvar){
  //console.log("loading transaction confrmation event "+txidvar);
  setTimeout(function(){storeCBtransactionEvent(txidvar)},1000)
}

var orderConfirmationEvent = function(txidvar){
  //console.log("loading order confrmation event "+txidvar);
  setTimeout(function(){storeCBorderEvent(txidvar)},1000)
}

var methodEvent = function(datacall){
  return new Promise((resolve)=> {
    //log(chalk.yellow("event replay through rpc server [this message for dev]"));
    resolve(impcParentMethods(datacall));
  })
}

var balanceEvent = function(addr,cb){
  return new Promise((resolve)=> {
    //log(chalk.yellow("event replay through rpc server [this message for dev]"));
    resolve(impcbalanceEvent(addr,cb));
  })
}

//another impc event cycle for parent messages
var impcevent = function(mydata,mypeer){
  log("IMPC EVENT FIRED"+mydata+mypeer);//probably will be removed
}

var globalParentComMethods = function(callback,cbIMPCBalance){
  //sets the impcparent with the function from parent
  //console.log("global parent com methods called in rpc server")
  impcParentMethods = callback;
  impcbalanceEvent = cbIMPCBalance;

  methods.parentComEvent(methodEvent,impcbalanceEvent,orderCallback,transactionCallback);
}
/*****
//this code is in peer.js pushed into rpc_server.js
//1) peer.js calls globalParentEvent and pushes the impcevent from peer.js
//2) rpc_server.js pushes back its own impcevent as the callback
//3) what does this do? complete comments
var impceventcaller;
var impcevent = function(callback){
    //sets the impcparent with the function from parent
    impceventcaller = callback;
}
*****/
//callback gonna push a callback to parent
var globalParentEvent = function(callback){
  callback(impcevent);
}
//end impx event cycle

var postRPCforMiner = function(data){
  //console.log("block data is rpc relayed thorugh rpc_server to methods for miner");
  //console.log("and the rpc relayed data "+JSON.stringify(data));
    setTimeout(function(){
      console.log(chalk.bgGreen.bold("RPC DATA IS ENABLED FOR MINER"));
      methods.postRPCforMiner(data);
      setTimeout(function(){
        openPort();
      },1000)
    },2000);

}

/////////////////////////////simple function to test JSON input and avoid errors
function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
/////////////////////////end simple function to test JSON input and avoid errors

let routes = {
    // this is the rpc endpoint
    // every operation request will come through here
    '/rpc': function (body) {
        return new Promise((resolve, reject) => {
            let _json = JSON.parse(body); // might throw error
            let keys = Object.keys(_json);
            let promiseArr = [];

            if (!body) {
                response.statusCode = 400;
                response.end(`rpc request was expecting some data...!`);
                return;
            }

            for (let key of keys) {
                if (methods[key] && typeof (methods[key].exec) === 'function' && isMining == false) {
                    let execPromise = methods[key].exec.call(null, _json[key]);
                    if (!(execPromise instanceof Promise)) {
                        throw new Error(`exec on ${key} did not return a promise`);
                    }
                    promiseArr.push(execPromise);
                } else if (key === 'getWorkForMiner' || key === 'createBlock' && isMining == true){
                    console.log("ONLY MINING IS ACCEPTED ON PORT")
                    let execPromise = methods[key].exec.call(null, _json[key]);
                    if (!(execPromise instanceof Promise)) {
                        throw new Error(`exec on ${key} did not return a promise`);
                    }
                    promiseArr.push(execPromise);
                } else {
                    console.log(JSON.stringify(body));
                    let execPromise = Promise.resolve({
                        error: 'method not defined'
                    })
                    promiseArr.push(execPromise);
                }
            }

            Promise.all(promiseArr).then(iter => {
                log(iter);
                let response = {};
                iter.forEach((val, index) => {
                    response[keys[index]] = val;
                });

                resolve(response);
            }).catch(err => {
                reject(err);
            });
        });
    },

    // this is our docs endpoint
    // through this the clients should know
    // what methods and datatypes are available
    '/describe': function () {
        // load the type descriptions
        return new Promise(resolve => {
            let type = {};
            let method = {};

            // set types
            type = types;

            //set methods
            for(let m in methods) {
                let _m = JSON.parse(JSON.stringify(methods[m]));
                method[m] = _m;
            }

            resolve({
                types: type,
                methods: method
            });
        });
    }
};

// request Listener
// this is what we'll feed into http.createServer
function requestListener(request, response) {
    let reqUrl = `http://${request.headers.host}${request.url}`;
    let parseUrl = url.parse(reqUrl, true);
    let pathname = parseUrl.pathname;

    // we're doing everything json
    //response.setHeader('Content-Type', 'application/json');
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // buffer for incoming data
    let buf = null;

    // listen for incoming data
    request.on('data', data => {
        if (buf === null) {
            buf = data;
        } else {
            buf = buf + data;
        }
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(chalk.blue("Reference Check: "+ chalk.green(buf.toString())));
    });

    // on end proceed with compute
    request.on('end', () => {

        var doEet = false;
        let body = buf !== null ? buf.toString() : null;

        //first off moving this to here on end instead of on data
        if(isJSON(body) && JSON.parse(body) == null){
          response.statusCode = 404;
          response.end("oops!! not sending properly formatted JSON")
          console.log(chalk.bgRed("This was the null create block issue from "+request.connection.remoteAddress+" ignoring it "));

        }else if(isJSON(body) && JSON.parse(body)["createBlock"]){
          doEet = true;
          closePort();//going to close off the port for a second
        }else if(isJSON(body) &&  JSON.parse(body)["getWorkForMiner"]){
          //doEet = true;
          var canMine = thisNodeCanMine();
          console.log("canMine = "+canMine);
          if(canMine.split(":")[0] == canMine.split(":")[1] && canMine.split(":")[2] > 2){
            closeExplorer();//closes the explorer port on 3003
            isMining = true;//restricts the methods to only call getWork on this page
          }else{
            console.log("not sure what action to take yet ?");
            closePort();
            setTimeout(function(){openPort(),15000})
            isMining = false;
          }
          //this signifies that this is a miner and we need to turn off explorer and other RPC for orders and such
        }else if(isJSON(body) &&  JSON.parse(body)["getOrderBook"]){
          doEet = true;
        }else if(isJSON(body) &&  JSON.parse(body)["signedOrder"]){
          doEet = true;
        }else if(isJSON(body) &&  JSON.parse(body)["signedTransaction"]){
          doEet = true;
        }else{
          console.log(chalk.bgRed("This was the fall through case from "+request.connection.remoteAddress+" ignoring it "));
          console.log("probable hack attempt");
        }

        if(doEet == true){
          impcparent(body,parentBroadcastPeersFunction,orderConfirmationEvent,txConfirmationEvent,setChainStateTX);
        }


        if (routes[pathname]) {
            let compute = routes[pathname].call(null, body);

            if (!(compute instanceof Promise)) {
                // we're kinda expecting compute to be a promise
                // so if it isn't, just avoid it

                response.statusCode = 469;

                console.warn(`whatever I got from rpc wasn't a Promise!`);
                response.end('oops! server error!');

            } else {
                compute.then(res => {
                    response.end(JSON.stringify(res))
                }).catch(err => {
                    console.error(err);

                    response.statusCode = 500;
                    response.end('oops! server error!');
                });
            }

        } else {
            response.statusCode = 404;
            response.end(`oops! ${pathname} not found here`)
        }
    })
}

var closePort = function(){
  log(chalk.bgRed("CLOSING server on port: "+chalk.green(": "+PORT)));
  server.close();
}

var openPort = function(stallTime = 0){
  if(isMining == true){
    isMining == false;
  }
  if(stallTime > 0){
    setTimeout(function(){
      log(chalk.bgRed("RE OPENING server on port: "+chalk.green(": "+PORT)));
      try{
        server.listen(PORT);
      }catch(e){
        if(e.toString().includes("ERR_SERVER_ALREADY_LISTEN")){
          console.log("port was already open");
        }else{
          console.log(e)
          console.log("this error is in rpc_server.js");
        }
      }
    },120000)
  }else{
    log(chalk.bgRed("RE OPENING server on port: "+chalk.green(": "+PORT)));
    try{
      server.listen(PORT);
    }catch(e){
      if(e.toString().includes("ERR_SERVER_ALREADY_LISTEN")){
        console.log("port was already open");
      }else{
        console.log(e)
        console.log("this error is in rpc_server.js");
      }
    }
  }
}

//NOTE moved call to methods up into the return function from peers above

log(chalk.blue("Started and Listening on "+chalk.green(": "+PORT)));
server.listen(PORT);

module.exports = {
  globalParentCom:globalParentCom,
  globalParentEvent:globalParentEvent,
  globalParentComMethods:globalParentComMethods,
  postRPCforMiner:postRPCforMiner,
  closePort:closePort,
  openPort:openPort
}
