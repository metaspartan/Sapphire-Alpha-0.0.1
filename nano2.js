const nSQL = require("nano-sql").nSQL;
const chalk = require('chalk');
const log = console.log;

var blockchain = nSQL('blockchain')// Table/Store Name, required to declare model and attach it to this store.
.model([ // Data Model, required
    {key:'id',type:'uuid',props:['pk']}, // This has the primary key value
    {key:'blocknum',type:'int', props: ["idx"]},
    {key:'previousHash',type:'string'},
    {key:'timestamp',type:'int'},
    {key:'transactions',type:'array'},//array
    {key:'orders',type:'array'},//array
    {key:'ommers',type:'array'},//array
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
    {key:'difficulty',type:'int'}
])
.actions([ // Optional
    {
        name:'add_block',
        args:['blockchain:map'],
        call:function(args, db) {
          return db.query('select').where(['hash','=',args.blockchain["hash"]]).exec().then(function(rows) {
              if(rows.length == 0){
                log(chalk.blue("We are inserting: "+ chalk.green(rows.length+args.blockchain["hash"])))
                return db.query('upsert',args.blockchain).exec();
              }else{
                log(chalk.blue("We are inserting genesis block: "+ chalk.green(rows.length+args.blockchain["hash"])))
                log(chalk.red("Block already existed hash is "+args.blockchain["hash"]));
              }
            }
          );
        }
        /***
        call:function(args, db) {
            return db.query('upsert',args.blockchain).exec();
        }
        ***/
    },
    {
        name:'add_genblock',
        args:['blockchain:map'],
        call:function(args, db) {
          return db.query('upsert',args.blockchain).exec();
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
        name: 'get_latest_block',
        args: ['blocknum:int'],
        call: function(args, db) {
            return db.query('select',["MAX(blocknum) AS blocknum"]).exec();
        }
    },
    {
        name: 'get_block',
        args: ['blocknum:int'],
        call: function(args, db) {
            return db.query('select',['id','blocknum','previousHash','hash','timestamp','transactions','orders','ommers','eGEMBackReferenceBlock','egemBackReferenceBlockHash','nonce','difficulty']).where(["blocknum","=",args.blocknum]).exec();
        }
    },
    {
        name: 'get_blockchain',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select',['id','blocknum','previousHash','hash','timestamp','transactions','orders','ommers','eGEMBackReferenceBlock','egemBackReferenceBlockHash','nonce','difficulty']).orderBy({blocknum:"asc"}).exec();
        }
    }
]);
var orders = nSQL('orders')
.model([
    {key:'id',type:'uuid',props:['pk']},
    {key:'fromAddress',type:'string'},
    {key:'buyOrSell',type:'string'},
    {key:'pairBuy',type:'string'},
    {key:'pairSell',type:'string'},
    {key:'amount',type:'string'},
    {key:'price',type:'string'},
    {key:'state',type:'string'},
    {key:'timestamp',type:'string'},
    {key:'transactionID',type:'string'},
    {key:'originationID',type:'string'},
]).actions([ // Optional
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
]);
var sfrxreceipts = nSQL('sfrxreceipts')
.model([ // Data Model, required
    {key:'id',type:'uuid',props:['pk']}, // This has the primary key value
    {key:'address',type:'string'},
    {key:'fromAddress',type:'string'},
    {key:'ticker',type:'string'},
    {key:'amount',type:'string'},//using string for long tail floats and big numbers but convert
    {key:'timestamp',type:'string'},
    {key:'transactionID',type:'string'},
    {key:'blockHash',type:'string'}
]).config({
    mode: "PERM", // With this enabled, the best storage engine will be auttomatically selected and all changes saved to it.  Works in browser AND nodeJS automatically.
    history: true,  // allow the database to undo/redo changes on the fly.
    dbPath: "./datadir/"
}).actions([ // Optional
    {
        name:'add_new_receipt',
        args:['sfrxreceipt:map'],
        call:function(args, db) {
            return db.query('upsert',args.sfrxreceipt).exec();
        }
    }
])
.views([ // Optional
    {
        name: 'get_receipts_by_ticker',
        args: ['ticker:string'],
        call: function(args, db) {
            return db.query('select').where([["ticker","=",args.ticker],"AND",["address","=",args.address]]).orderBy({ticker:"asc",timestamp:"asc"}).exec();
        }
    },
    {
        name: 'list_all_receipts',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select').exec();
        }
    },
    {
        name: 'list_all_receipts_address',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select').where(["address","=",args.address]).orderBy({ticker:"asc",timestamp:"asc"}).exec();
        }
    }
]).connect();

var addBlock = function(block){
  log(JSON.stringify(block));
  //orders.connect().then(function(result) {
      // DB ready to use.
      nSQL("blockchain").doAction('add_block', block
      ).then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var addGenBlock = function(block){
  log(JSON.stringify(block));
  //orders.connect().then(function(result) {
      // DB ready to use.
      nSQL("blockchain").doAction('add_genblock', block
      ).then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var clearDatabase = function(){
  nSQL("blockchain").query("delete").exec();
}

var clearBlock = function(blocknum){
  nSQL("blockchain").query("delete").where(['blocknum','=',blocknum]).exec();
}

var getBlockchain = function(limit,callBack){
  log("ENTIRE BLOCKCHAIN");
      if(limit){
        log(" LIMITED by "+limit);
      }
      // DB ready to use.
      nSQL("blockchain").getView('get_blockchain')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

var getBlock = function(number,callBack){
  log(chalk.blue("BLOCK FROM BLOCKCHAIN"));
      // DB ready to use.
      nSQL("blockchain").getView('get_block',{blocknum:number})
      .then(function(result) {
          log(chalk.green(JSON.stringify(result))) //  <- single object array containing the row we inserted.
          callBack(JSON.stringify(result));
      });

}

var getLatestBlock = function(){
  log(chalk.blue("LATEST BLOCK"));
      // DB ready to use.
      nSQL("blockchain").getView('get_latest_block')
      .then(function(result) {
          log(chalk.green(JSON.stringify(result))) //  <- single object array containing the row we inserted.
          //callBack(result);
      });

}

var clearOrderById = function(id){
  nSQL("orders").query("delete").where(["id","=",id]).exec()
}

var clearOrderDatabase = function(){
  nSQL("orders").query("delete").exec();
}


var addOrder = function(order){
  log("okay at least we are trying to add this order in db"+JSON.stringify(order));
  //orders.connect().then(function(result) {
      // DB ready to use.
      log("we are placing this order "+order);

      nSQL("orders").doAction('add_new_order',order
      ).then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });
  //});
}

var ordersToBuy = [];

var getOrdersBuy = function(callBack){
  log("Open BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_buy')
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callBack(result);
      });

}

////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairBuy = function(pair,callback){
  log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairBuy',{pairBuy:pair})
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //log(result);
      });

}
////////////////////////////////////////////////////////////////////////////first call
var getOrdersPairSell = function(pair,callback){
  log("Open PAIR BUY Orders");
      // DB ready to use.
      nSQL("orders").getView('get_order_by_pairSell',{pairSell:pair})
      .then(function(result) {
          //log(result) //  <- single object array containing the row we inserted.
          callback(result);
          //log(result);
      });

}

var buildTrade = function(obj,callBack){
  log("Building transactions from sell orders for "+JSON.stringify(obj));
  nSQL("orders").getView('get_order_by_pairSell',{pairSell:obj["pairSell"]})
  .then(function(result) {
      //log(result) //  <- single object array containing the row we inserted.
      callBack(obj,result);
  });
}

var getOrdersSell = function(){
  log("Open SELL Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders_sell')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

var getAllOrders = function(){
  log("ALL Open Orders");
      // DB ready to use.
      nSQL("orders").getView('list_all_orders')
      .then(function(result) {
          log(result) //  <- single object array containing the row we inserted.
      });

}

module.exports = {
    addBlock:addBlock,
    addGenBlock:addGenBlock,
    getBlockchain:getBlockchain,
    getBlock:getBlock,
    getLatestBlock:getLatestBlock,
    addOrder:addOrder,
    getOrdersBuy:getOrdersBuy,
    getOrdersSell:getOrdersSell,
    getAllOrders:getAllOrders,
    buildTrade:buildTrade,
    getOrdersPairBuy:getOrdersPairBuy,
    getOrdersPairSell:getOrdersPairSell,
    clearDatabase:clearDatabase,
    clearBlock:clearBlock,
    clearOrderDatabase:clearOrderDatabase,
    clearOrderById:clearOrderById
}
