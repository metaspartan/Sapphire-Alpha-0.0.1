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
    {key:'difficulty',type:'int'},
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
          return db.query('select').where(['hash','=',args.blockchain["hash"]]).exec().then(function(rows) {
              if(rows.length == 0){
                console.log("somehow we are inserting and row length = "+rows.length+args.blockchain["hash"])
                return db.query('upsert',args.blockchain).exec();
              }else{
                console.log("block already existed");
              }
            }
          );
        }
        /***
        call:function(args, db) {
            return db.query('upsert',args.blockchain).exec();
        }
        ***/
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
        name: 'get_block',
        args: ['blocknum:int'],
        call: function(args, db) {
            return db.query('select',['id','blocknum','previousHash','hash','timestamp','transactions','orders','eGEMBackReferenceBlock','egemBackReferenceBlockHash','nonce']).where(["blocknum","=",args.blocknum]).exec();
        }
    },
    {
        name: 'get_blockchain',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select',['id','blocknum','previousHash','hash','timestamp','transactions','orders','eGEMBackReferenceBlock','egemBackReferenceBlockHash','nonce']).orderBy({blocknum:"asc"}).exec();
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

var getBlockchain = function(limit,callBack){
  console.log("ENTIRE BLOCKCHAIN");
      if(limit){
        console.log(" LIMITED by "+limit);
      }
      // DB ready to use.
      nSQL("blockchain").getView('get_blockchain')
      .then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

var getBlock = function(number,callBack){
  console.log("BLOCK FROM BLOCKCHAIN");
      // DB ready to use.
      nSQL("blockchain").getView('get_block',{blocknum:number})
      .then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

//////////////////////////////////////this is the ORDER database now////////////
// Use an instance table to query and organize existing tables of data.
var orders = nSQL('orders')// Table/Store Name, required to declare model and attach it to this store.
.model([ // Data Model, required
    {key:'id',type:'uuid',props:['pk']}, // This has the primary key value
    {key:'fromAddress',type:'string'},
    {key:'buyOrSell',type:'string'},
    {key:'pairBuy',type:'string'},
    {key:'pairSell',type:'string'},
    {key:'amount',type:'string'},//using string for long tail floats and big numbers but convert
    {key:'price',type:'string'},
    {key:'state',type:'string'},
    {key:'timestamp',type:'string'},
    {key:'transactionID',type:'string'},
    {key:'originationID',type:'string'}
    //{key:'status',type:'string', default:"open"},//open until partial filled and ay just remain open until filled
    //{key:'nonce',type:'int', default:0, props: ["idx"]}, // secondary index
])
.config({
    mode: "PERM", // With this enabled, the best storage engine will be auttomatically selected and all changes saved to it.  Works in browser AND nodeJS automatically.
    history: true,  // allow the database to undo/redo changes on the fly.
    dbPath: "./datadir/"
})
.actions([ // Optional
    {
        name:'add_new_order',
        args:['order:map'],
        call:function(args, db) {
            return db.query('upsert',args.order).exec();
        }
    }
])
.views([ // Optional
    {
        name: 'get_order_by_pairBuy',
        args: ['pairBuy:string'],
        call: function(args, db) {
            return db.query('select').where([["pairBuy","=",args.pairBuy],"AND",["buyOrSell","=","BUY"]]).orderBy({price:"desc",amount:"desc"}).exec();
        }
    },
    {
        name: 'get_order_by_pairSell',
        args: ['pairSell:string'],
        call: function(args, db) {
            return db.query('select').where([["pairSell","=",args.pairSell],"AND",["buyOrSell","=","SELL"]]).orderBy({price:"asc",amount:"asc"}).exec();
        }
    },
    {
        name: 'list_all_orders',
        args: ['page:int'],
        call: function(args, db) {
            //return db.query('select',['id',"fromAddress","amount","buyOrSell","pairBuy","pairSell","price","transactionID"]).exec();
            return db.query('select').exec();
        }
    },
    {
        name: 'list_all_orders_buy',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select').where(["buyOrSell","=","BUY"]).orderBy({price:"desc",amount:"desc"}).exec();
        }
    },
    {
        name: 'list_all_orders_sell',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select').where(["buyOrSell","=","SELL"]).orderBy({price:"asc",amount:"asc"}).exec();
        }
    }
]).connect();

var clearOrderById = function(id){
  nSQL("orders").query("delete").where(["id","=",id]).exec()
}

var clearOrderDatabase = function(){
  nSQL("orders").query("delete").exec();
}


var addOrder = function(order){
  console.log("okay at least we are trying to add this order in db"+JSON.stringify(order));
  //orders.connect().then(function(result) {
      // DB ready to use.
      console.log("we are placing this order "+order);

      nSQL("orders").doAction('add_new_order',order
      ).then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

/***
var simple = nSQL([
    {id:null,fromAddress:'0x0666bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'BUY',pairBuy:'EGEM',pairSell:'SPHR',amount:'300',price:'24.5567'},
    {id:null,fromAddress:'0x0667bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SPHR',amount:'320',price:'24.5567'},
    {id:null,fromAddress:'0x0668bf13ab1902de7dee4f8193c819118d7e21a6',buyOrSell:'BUY',pairBuy:'EGEM',pairSell:'SPHR',amount:'350',price:'24.5567'},
    {id:null,fromAddress:'0x5c4ae12c853012d355b5ee36a6cb8285708760e6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SPHR',amount:'450',price:'25.5567'},
    {id:null,fromAddress:'0x5c4ae12c853012d775b5ee36a6cb8285708760e6',buyOrSell:'SELL',pairBuy:'EGEM',pairSell:'SPHR',amount:'920',price:'26.5567'},
]);
***/

var ordersToBuy = [];

var getOrdersBuy = function(callBack){
  console.log("Open BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_buy')
      .then(function(result) {
          //console.log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairBuy = function(pair,callback){
  console.log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairBuy',{pairBuy:pair})
      .then(function(result) {
          //console.log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //console.log(result);
      });

}
////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairSell = function(pair,callback){
  console.log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairSell',{pairSell:pair})
      .then(function(result) {
          //console.log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //console.log(result);
      });

}

var buildTrade = function(obj,callBack){
  console.log("Building transactions from sell orders for "+JSON.stringify(obj));
  nSQL("orders").getView('get_order_by_pairSell',{pairSell:obj["pairSell"]})
  .then(function(result) {
      //console.log(result) //  <- single object array containing the row we inserted.
      callBack(obj,result);
  });
}

var getOrdersSell = function(){
  console.log("Open SELL Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_sell')
      .then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
      });

}

var getAllOrders = function(){
  console.log("ALL Open Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders')
      .then(function(result) {
          console.log(result) //  <- single object array containing the row we inserted.
      });

}
//////////////////////////////////////end order database////////////////////////

module.exports = {
    addBlock:addBlock,
    getBlockchain:getBlockchain,
    getBlock:getBlock,
    addOrder:addOrder,
    getOrdersBuy:getOrdersBuy,
    getOrdersSell:getOrdersSell,
    getAllOrders:getAllOrders,
    buildTrade:buildTrade,
    getOrdersPairBuy:getOrdersPairBuy,
    getOrdersPairSell:getOrdersPairSell,
    clearDatabase:clearDatabase,
    clearOrderDatabase:clearOrderDatabase,
    clearOrderById:clearOrderById
}
