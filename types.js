'use strict';

let types = {
    user: {
        description:'the details of the user',
        props: {
            name:['string', 'required'],
            age: ['number'],
            email: ['string', 'required'],
            password: ['string', 'required']
        }
    },
    task: {
        description:'a task entered by the user to do at a later time',
        props: {
            userid: ['number', 'required'],
            content: ['string', 'require'],
            expire: ['date', 'required']
        }
    },
    miner: {
        description:'a miner connecting',
        props: {
            address: ['string', 'required'],
            port: ['string', 'required']
        }
    },
    block: {
      description:'a block submission of work from miner',
      props: {
          perviousHash: ['string', 'required'],
          timestamp: ['date', 'required'],
          nonce: ['number', 'required'],
          hash: ['string', 'required'],
          difficulty: ['number', 'required']
      }
    },
    work: {
      description:'a work request from miner',
      props: {
          perviousHash: ['string', 'required'],
          timestamp: ['date', 'required'],
          nonce: ['number', 'required'],
          hash: ['string', 'required'],
          difficulty: ['number', 'required']
      }
    },
    balance: {
      description:'balance for address provided',
      props: {
        address: ['string', 'required'],
        balance: ['number', 'required']
      }
    }
}

module.exports = types;
