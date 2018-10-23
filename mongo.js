const chalk = require('chalk');
const log = console.log;

//this next process starts up mongodb from local bin in project folder
//"prestart": "/osoese/bin/mongod --dbpath /data/db",

var exec = require('child_process').exec;
exec('/osoese3/bin/mongod --dbpath /data/db', function(error, stdout, stderr) {
    log('stdout: ' + stdout);
    log('stderr: ' + stderr);
    if (error !== null) {
        log('exec error: ' + error);
    }
});

/***
var mongodb_prebuilt = require('mongodb-prebuilt-cross');

mongodb_prebuilt.start_server({
  args: {
            port: 27017,
            quiet: true,
            dbpath: __dirname + "/data/frankodb"
        }
}, function(err) {
    if (err) {
        log('mongod didnt start:', err);
    } else {
        log('mongod is started');
    }
});
****/

// Retrieve
var MongoClient = require('mongodb').MongoClient;

//this function creats a collection called name
var collection = function newCollection(name){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection(name, function(err, res) {
      if (err) throw err;
        log("Collection created!");
        db.close();
      });
      //dbo.collection(name).createIndex({ "previousHash": 1 }, { unique: true } );

    }else{
      log("The error is: "+err)
    }
  });
};

var updateCollection = function updateCollection(coll,obj1,obj2,obj3){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.collection(coll, function(err, res) {
      if (err) throw err;
        log("Collection: "+coll);
      });
      //var myobj = obj1+","+obj2+","+obj3+",";
      dbo.collection(coll).updateOne(obj1,obj2,obj3,function(err, res) {
      if (err) throw err;
        log(coll + obj1 + " document updated");
        db.close();
      });
    }else{
      log("The error is: "+err)
    }
  });
};

var insertCollection = function insertCollection(coll,obj1){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.collection(coll, function(err, res) {
      if (err) throw err;
        log("Collection: "+coll);
      });
      //var myobj = obj1+","+obj2+","+obj3+",";
      dbo.collection(coll).insert(obj1,function(err, res) {
      if (err) throw err;
        log(coll + obj1 + " document updated");
        db.close();
      });
    }else{
      log("The error is: "+err)
    }
  });
};

var findOne = function findOne(coll, key, value){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection(coll, function(err, res) {
      if (err) throw err;
        log("Collection created second time!");
      });
      var myobj = { key: value };
      dbo.collection(coll).find(myobj, function(err, res) {
      if (err) throw err;
        if (res){
          log("1 document found"+res);
        }
        db.close();
      });
    }else{
      log("The error is: "+err)
    }
  });
}

var getitall = function(){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection("Blockchain", function(err, res) {
      if (err) throw err;
        log("Collection created second time!");
      });
      //var myobj = { key: value };
      dbo.collection("Blockchain").find({}, function(err, res) {
      if (err) throw err;
        if (res){
          log("1 document found"+res);
        }
        db.close();
      });
    }else{
      log("The error is: "+err)
    }
  });
}


var trythis = function tryIt(){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection("egem_wallets_del", function(err, res) {
      if (err) throw err;
        log("Collection created second time!");
      });
      var myobj = { addr: "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", coin: "000" };
      dbo.collection("egem_wallets_del").insertOne(myobj, function(err, res) {
      if (err) throw err;
        log("1 document inserted");
        db.close();
      });
    }else{
      log("The error is: "+err)
    }
  });
};

module.exports = {
  tryit: trythis,
  getitall: getitall,
  collection: collection,
  updateCollection: updateCollection,
  insertCollection: insertCollection,
  findOne: findOne
}
