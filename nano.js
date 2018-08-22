//const express = require('express');
const nSQL = require("nano-sql").nSQL;

// Use an instance table to query and organize existing tables of data.
var blockchain = nSQL('blockchain')// Table/Store Name, required to declare model and attach it to this store.
.model([ // Data Model, required
    {key:'id',type:'uuid',props:['pk']}, // This has the primary key value
    {key:'name',type:'string', default:"None"}, // The 'default' will cause inserts to always use "None" if no value is provided.
    {key:'age',type:'int', props: ["idx"]}, // secondary index
    {key: "eyeColor", type: "string", props:["trie"]}, // Index as trie
    {key:'balance',type:'float', default: 0},
    {key:'postIDs',type:'array'},
    {key:'meta',type:'map'}
])
.config({
    mode: "PERM", // With this enabled, the best storage engine will be auttomatically selected and all changes saved to it.  Works in browser AND nodeJS automatically.
    history: true, // allow the database to undo/redo changes on the fly.
    dbPath: "./datadir/"
})
.actions([ // Optional
    {
        name:'add_new_user',
        args:['user:map'],
        call:function(args, db) {
            return db.query('upsert',args.user).exec();
        }
    }
])
.views([ // Optional
    {
        name: 'get_user_by_name',
        args: ['name:string'],
        call: function(args, db) {
            return db.query('select').where(['name','=',args.name]).exec();
        }
    },
    {
        name: 'list_all_users',
        args: ['page:int'],
        call: function(args, db) {
            return db.query('select',['id','name']).exec();
        }
    }
]);
