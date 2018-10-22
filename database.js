const log = console.log;
// Retrieve
var MongoClient = require('mongodb').MongoClient;

// Connect to the db

MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
  if(!err) {
    log("We are connected");

    var dbo = db.db("mydb");
    dbo.createCollection("egem_wallets", function(err, res) {
    if (err) throw err;
      log("Collection created!");
      db.close();
    });

  }else{
    log("The error is: "+err)
  }
});

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

  tryit: trythis
}
