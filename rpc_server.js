'use strict';

let http = require('http');
let url = require('url');
let methods = require('./methods');
let types = require('./types');
const chalk = require('chalk');
const log = console.log;

let server = http.createServer(requestListener);
const PORT = process.env.NODE_PORT || 9090;

// we'll use a very very very simple routing mechanism
// don't do something like this in production, ok technically you can...
// probably could even be faster than using a routing library :-D


///////////////////////////////////////////////inter module parent communication
var impcparent;
var parentBroadcastPeersFunction;
var setChainStateTX;
//callback fuction used to set a caller to the parent called by parent on load
var globalParentCom = function(callback,callback2,callback3){
  //sets the impcparent with the function from parent
  impcparent = callback;
  parentBroadcastPeersFunction = callback2;
  setChainStateTX = callback3;
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
                if (methods[key] && typeof (methods[key].exec) === 'function') {
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
        let body = buf !== null ? buf.toString() : null;

        //first off moving this to here on end instead of on data
        if(isJSON(body) && JSON.parse(body)["createBlock"]){
          closePort();//going to close off the port for a second
        }else if(isJSON(body) &&  JSON.parse(body)["getWorkForMiner"]){
          //this signifies that this is a miner and we need to turn off explorer and other RPC for orders and such
        }
        impcparent(body,parentBroadcastPeersFunction,orderConfirmationEvent,txConfirmationEvent,setChainStateTX);

        if (routes[pathname]) {
            let compute = routes[pathname].call(null, body);

            if (!(compute instanceof Promise)) {
                // we're kinda expecting compute to be a promise
                // so if it isn't, just avoid it

                response.statusCode = 500;
                response.end('oops! server error!');
                console.warn(`whatever I got from rpc wasn't a Promise!`);
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

var openPort = function(){
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
