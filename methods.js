'use strict';

let db = require('./db');

let methods = {
    createUser: {
        description: `creates a new user, and returns the details of the new user`,
        params: ['user:the user object'],
        returns: ['user'],
        exec(userObj) {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // attach an id the save to db
                let _userObj = JSON.parse(JSON.stringify(userObj));
                _userObj.id = (Math.random() * 10000000) | 0;
                resolve(db.users.save(userObj));
            });
        }
    },

    fetchUser: {
        description: `fetches the user of the given id`,
        params: ['id:the id of the user were looking for'],
        returns: ['user'],
        exec(userObj) {
            return new Promise((resolve) => {
                if (typeof (userObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.users.fetch(userObj.id) || {});
            });
        }
    },

     fetchAllUsers: {
        description: `fetches the entire list of users`,
        params: [],
        returns: ['userscollection'],
        exec() {
            return new Promise((resolve) => {
                // fetch
                resolve(db.users.fetchAll() || {});
            });
        }
    },

    createTask: {
        description: `creates a new user, and returns the details of the new user`,
        params: ['task:the task object'],
        returns: ['task'],
        exec(taskObj) {
            return new Promise((resolve) => {

                // you would usually do some validations here
                // and check for required fields

                // create a task object, then save it to db
                // attach an id the save to db
                let task = {
                    userId: taskObj.userId,
                    taskContent: taskObj.taskContent,
                    expiry: taskObj.expiry
                };

                resolve(db.tasks.save(task));
            });
        }
    },

    createMiner: {
        description: `creates a miner, and returns the details of the new user`,
        params: ['miner:the user object'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // attach an id the save to db
                let _minerObj = JSON.parse(JSON.stringify(minerObj));
                _minerObj.id = (Math.random() * 10000000) | 0;
                resolve(db.miners.save(minerObj));
            });
        }
    },

    fetchMiner: {
        description: `fetches the miner of the given id`,
        params: ['id:the id of the user were looking for'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.miners.fetch(minerObj.id) || {});
            });
        }
    },

    fetchMinerByKey: {
        description: `fetches the miner of the given id`,
        params: ['address:the address of the user were looking for'],
        returns: ['miner'],
        exec(minerObj) {
            return new Promise((resolve) => {
                if (typeof (minerObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                // fetch
                resolve(db.miners.fetchKey(minerObj.address.toString()) || {});
                //resolve(db.miners.fetch(minerObj.id) || {});
            });
        }
    },

    getWorkForMiner: {
      description: `fetches the work for miner of the given address`,
      params: ['address:the address of the miner'],
      returns: ['work'],
      exec() {
          return new Promise((resolve) => {
              // fetch
              resolve(db.blocks.fetchAll() || {});
              //resolve(db.work.fetchAll() || {});
          });
      }
    },

     fetchAllMiners: {
        description: `fetches the entire list of miners`,
        params: [],
        returns: ['minerscollection'],
        exec() {
            return new Promise((resolve) => {
                // fetch
                resolve(db.miners.fetchAll() || {});
            });
        }
    },

    createBlock: {
        description: `creates a block of submitted work, and returns to validation`,
        params: ['block:the block object'],
        returns: ['block'],
        exec(blockObj) {
            return new Promise((resolve) => {
                if (typeof (blockObj) !== 'object') {
                    throw new Error('was expecting an object!');
                }
                // you would usually do some validations here
                // and check for required fields

                //going to delete all first
                resolve(db.blocks.unsetAll());

                // attach an id the save to db
                let _blockObj = JSON.parse(JSON.stringify(blockObj));
                _blockObj.id = (Math.random() * 10000000) | 0;
                resolve(db.blocks.save(blockObj));
            });
        }
    },

    fetchAllBlocks: {
       description: `fetches the entire list of blocks`,
       params: [],
       returns: ['blockscollection'],
       exec() {
           return new Promise((resolve) => {
               // fetch
               resolve(db.blocks.fetchAll() || {});
           });
       }
   },

};

module.exports = methods;
