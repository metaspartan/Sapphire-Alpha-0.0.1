//const express = require('express');
const nSQL = require("nano-sql").nSQL;

// Use an instance table to query and organize existing tables of data.
var blockchain = nSQL('blockchain')// Table/Store Name, required to declare model and attach it to this store.
.model([ // Data Model, required
    {key:'id',type:'uuid',props:['pk']}, // This has the primary key value
    {key:'blocknum',type:'int', props: ["idx"]},
    {key:'previousHash',type:'string'},
    {key:'timestamp',type:'int'},
    {key:'transactions',type:'array'},//may turn into array
    {key:'orders',type:'array'},//may turn into array
    {key:'hash',type:'string'},
    {key:'nonce',type:'int'},
    {key:'eGEMBackReferenceBlock',type:'int'},
    {key:'egemBackReferenceBlockHash',type:'string'},
    {key:'data',type:'string'},
    {key:'sponsor',type:'string'},
    {key:'miner',type:'string'},
    {key:'hardwareTx',type:'string'},
    {key:'softwareTx',type:'string'},
    {key:'targetBlock',type:'string'},
    {key:'targetBlockDataHash',type:'string'},
    {key:'allConfig',type:'string'},
    {key:'allConfigHash',type:'string'},
    {key:'hashOfThisBlock',type:'string'},
])
.config({
    mode: "PERM", // With this enabled, the best storage engine will be auttomatically selected and all changes saved to it.  Works in browser AND nodeJS automatically.
    history: true, // allow the database to undo/redo changes on the fly.
    dbPath: "./datadir/"
})
.actions([ // Optional
    {
        name:'add_block',
        args:['blockchain:map'],
        call:function(args, db) {
            return db.query('upsert',args.blockchain).exec();
        }
    }
])
.views([ // Optional
    {
        name: 'get_block_by_num',
        args: ['blocknum:int'],
        call: function(args, db) {
            return db.query('select').where(['blocknum','=',args.name]).exec();
        }
    },
    {
        name: 'get_blockchain',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select',['id','blocknum','previousHash','timestamp','transactions','orders']).exec();
        }
    }
]).connect();

var addBlock = function(order){
  console.log(JSON.stringify(order));
  //orders.connect().then(function(result) {
      // DB ready to use.
      nSQL("blockchain").doAction('add_block',order
      ).then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var clearDatabase = function(){
  nSQL("blockchain").query("delete").exec();
}

var getBlockchain = function(){
  console.log("ENTIRE BLOCKCHAIN");
      // DB ready to use.
      nSQL("blockchain").getView('get_blockchain')
      .then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
      });

}

module.exports = {
    addBlock:addBlock,
    getBlockchain:getBlockchain,
    clearDatabase:clearDatabase
}
