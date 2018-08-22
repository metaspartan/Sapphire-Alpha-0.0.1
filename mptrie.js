var Trie = require('merkle-patricia-tree'),
levelup = require('levelup'),
leveldown = require('leveldown')

db = levelup(leveldown('./testdb'));
trie = new Trie(db);

console.log(trie.root);

trie.createReadStream()
  .on('data', function (data) {
    console.log(data.key, '=', data.value)
    console.log(JSON.stringify(data))
  })
  .on('end', function() {
    console.log('End.')
  })

db.on('put', function (key, value) {
  console.log('inserted in db', { key, value })
})

db.on('get', function (key, value) {
  console.log('selected from db', { key, value })
})


  trie.putRaw('0x0669bf13ab1902de7dee4f8193c819118d7e21a6', '35.04', function () {

  });

  trie.get('0x0669bf13ab1902de7dee4f8193c819118d7e21a6', function (err, value) {
    if(value) console.log(value.toString())
  });


  trie.put('0x5c7ae12c853012d355b5ee36a6cb8285708760e6', '25.09', function () {

  });

  trie.get('0x5c7ae12c853012d355b5ee36a6cb8285708760e6', function (err, value) {
    if(value) console.log(value.toString())
  });

  trie.put('mama', '25.32', function () {

  });

  trie.get('mama', function (err, value) {
    if(value) console.log(value.toString())
  });

  trie.get('mama', function (err, value) {
    if(value) console.log(value.toString())
  });


  db.createKeyStream()
  .on('data', function (data) {
    console.log('key=', data.toString())
  })

  db.createValueStream()
  .on('data', function (data) {
    console.log('value=', data.toString())
  })

  console.log("tree root"+trie.root);
