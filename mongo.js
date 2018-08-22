//this next process starts up mongodb from local bin in project folder
//"prestart": "/osoese/bin/mongod --dbpath /data/db",
var exec = require('child_process').exec;
exec('/osoese3/bin/mongod --dbpath /data/db', function(error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
        console.log('exec error: ' + error);
    }
});

// Retrieve
var MongoClient = require('mongodb').MongoClient;

//this function creats a collection called name
var collection = function newCollection(name){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      console.log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection(name, function(err, res) {
      if (err) throw err;
        console.log("Collection created!");
        db.close();
      });
      //dbo.collection(name).createIndex({ "previousHash": 1 }, { unique: true } );

    }else{
      console.log("The error is: "+err)
    }
  });
};

var updateCollection = function updateCollection(coll,obj1,obj2,obj3){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      console.log("We are connected");

      var dbo = db.db("mydb");
      dbo.collection(coll, function(err, res) {
      if (err) throw err;
        console.log("Collection: "+coll);
      });
      //var myobj = obj1+","+obj2+","+obj3+",";
      setTimeout(function(){ console.log("Update One"+coll); }, 3000);
      dbo.collection(coll).updateOne(obj1,obj2,obj3,function(err, res) {
      if (err) throw err;
        console.log(coll + obj1 + " document updated");
        db.close();
      });
    }else{
      console.log("The error is: "+err)
    }
  });
};

var insertCollection = function insertCollection(coll,obj1){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      console.log("We are connected");

      var dbo = db.db("mydb");
      dbo.collection(coll, function(err, res) {
      if (err) throw err;
        console.log("Collection: "+coll);
      });
      //var myobj = obj1+","+obj2+","+obj3+",";
      dbo.collection(coll).insert(obj1,function(err, res) {
      if (err) throw err;
        console.log(coll + obj1 + " document updated");
        db.close();
      });
    }else{
      console.log("The error is: "+err)
    }
  });
};

var findOne = function findOne(coll, key, value){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      console.log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection(coll, function(err, res) {
      if (err) throw err;
        console.log("Collection created second time!");
      });
      var myobj = { key: value };
      dbo.collection(coll).find(myobj, function(err, res) {
      if (err) throw err;
        if (res){
          console.log("1 document found"+res);
        }
        db.close();
      });
    }else{
      console.log("The error is: "+err)
    }
  });
}


var trythis = function tryIt(){
  MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
    if(!err) {
      console.log("We are connected");

      var dbo = db.db("mydb");
      dbo.createCollection("egem_wallets_del", function(err, res) {
      if (err) throw err;
        console.log("Collection created second time!");
      });
      var myobj = { addr: "0x0666bf13ab1902de7dee4f8193c819118d7e21a6", coin: "000" };
      dbo.collection("egem_wallets_del").insertOne(myobj, function(err, res) {
      if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    }else{
      console.log("The error is: "+err)
    }
  });
};

module.exports = {
  tryit: trythis,
  collection: collection,
  updateCollection: updateCollection,
  insertCollection: insertCollection,
  findOne: findOne
}
