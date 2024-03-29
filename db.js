'use strict';

const chalk = require('chalk');
const log = console.log;

let users = {};
let tasks = {};
let miners = {};
let blocks = {};
let balances = {};

// we are saving everything inmemory for now
let db = {
    users: proc(users),
    tasks: proc(tasks),
    miners: proc(miners),
    blocks: proc(blocks),
    balances: proc(balances),
}

function clone(obj) {
    // a simple way to deep clone an object in javascript
    return JSON.parse(JSON.stringify(obj));
}

// a generalised function to handles CRUD operations
function proc(container) {
    return {
        save(obj) {
            // in JS, objects are passed by reference
            // so to avoid interfering with the original data
            // we deep clone the object, to get our own reference
            let _obj = clone(obj);
            log(chalk.bgGreen.bold('RPC : '), _obj);
            if (!_obj.id) {
                // assign a random number as ID if none exists
                _obj.id = (Math.random() * 10000000) | 0;
            }

            container[_obj.id.toString()] = _obj;
            return clone(_obj);
        },
        fetch(id) {
            // deep clone this so that nobody modifies the db by mistake from outside
            return clone(container[id.toString()]);
        },
        fetchKey(address) {
          log(address);
          //searching for ky value
          let _bunch = [];
          for (let item in container) {
            log(JSON.stringify(item));
            if(container[item]["address"] == address){
              _bunch.push(clone(container[item]));
            }
            return _bunch;
          }
        },
        fetchAll() {
            let _bunch = [];
            for (let item in container) {
                _bunch.push(clone(container[item]));
            }
            return _bunch;
        },
        unset(id) {
            delete container[id];
        },
        unsetAll() {
          for (let item in container) {
              delete container[item];
          }
        }
    }
}

module.exports = db;
