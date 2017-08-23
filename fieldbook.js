var Fieldbook = require('node-fieldbook');


var requestify = require('requestify');

var bookId = '598603f8789bad0400ee5c36';
var baseUrl = 'https://api.fieldbook.com/v1/' + bookId;
var options = {
    headers: {accept: 'application/json'},

    auth: {
        username: process.env.FIELDBOOK_USER,
        password: process.env.FIELDBOOK_KEY
        //username: 'key-1',
        //password: 'OaPjWb6dYuSQ_tmX4vX-'
    }
};

var url = baseUrl + '/preferences';
requestify.get(url, options)
.then (function(response) {
  var body = response.getBody();
  console.log('RESPONSE: ' + JSON.stringify(response));
  //var body = JSON.parse(response.body);
  console.log('BODY: ' + JSON.stringify(body));
});
/*
var book = new Fieldbook({
  key: 'key-1',
  secret: 'OaPjWb6dYuSQ_tmX4vX-',
  book: '598603f8789bad0400ee5c36',
})
*/
/*var book = new Fieldbook({
  book: '5960e0dab93bd8030008699d'
});*/
/*
filter = {
  //procedure: 'Connor',
  limit: 1
};
*/
/* 
book.getSheet('preferences', filter)
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error);
  });

book.getRecord('preferences', 13, filter)
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.log(error);
  });
*/
