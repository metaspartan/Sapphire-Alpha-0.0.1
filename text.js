const chalk = require('chalk');
const log = console.log;

const puretext = require('puretext');
  require('request');

  let text = {
      // To Number is the number you will be sending the text to.
      toNumber: '+12103249208',
      // From number is the number you will buy from your admin dashboard
      fromNumber: '+12027592341',
      // Text Content
      smsBody: 'This is from my EGEM saphire code my friend 💎 - coming soon send EGEM via text!! (from osoese)',
      //Sign up for an account to get an API Token
      apiToken: '540qea'
  };

  puretext.send(text, function (err, response) {
    if(err) log(err);
    else log(response)
  })
