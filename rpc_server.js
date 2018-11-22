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
//callback fuction used to set a caller to the parent called by parent on load
var globalParentCom = function(callback,callback2){
  //sets the impcparent with the function from parent
  impcparent = callback;
  parentBroadcastPeersFunction = callback2;
}

var impcParentMethods;
//callback fuction used to set a caller to the parent called by parent on load
var globalParentComMethods = function(callback){
  //sets the impcparent with the function from parent
  impcParentMethods = callback;
}
///////////////////////////////////////////end inter module parent communication

;

var methodEvent = function(datacall){
  return new Promise((resolve)=> {
    log(chalk.yellow("event replay through rpc server [this message for dev]"));
    resolve(impcParentMethods(datacall));
  })
}

//another impc event cycle for parent messages
var impcevent = function(mydata,mypeer){
  log("IMPC EVENT FIRED"+mydata+mypeer);//probably will be removed
}
//callback gonna push a callback to parent
var globalParentEvent = function(callback){
  callback(impcevent);
}
//end impx event cycle

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
        impcparent(buf.toString(),parentBroadcastPeersFunction);
    });

    // on end proceed with compute
    request.on('end', () => {
        let body = buf !== null ? buf.toString() : null;

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

methods.parentComEvent(methodEvent);

log(chalk.blue("Started and Listening on "+chalk.green(": "+PORT)));
server.listen(PORT);

module.exports = {
  globalParentCom:globalParentCom,
  globalParentEvent:globalParentEvent,
  globalParentComMethods:globalParentComMethods
}
