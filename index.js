var express = require('express');
var app = express();
var router = express.Router();

var Fieldbook = require('node-fieldbook');
var requestify = require('requestify');
var ejsLint = require('ejs-lint');

var bookId = '598603f8789bad0400ee5c36';
var baseUrl = 'https://api.fieldbook.com/v1/' + bookId;
var options = {
    headers: {accept: 'application/json'},

    auth: {
        //username: process.env.FIELDBOOK_USER,
        //password: process.env.FIELDBOOK_KEY
        username: 'key-1',
        password: 'OaPjWb6dYuSQ_tmX4vX-'
    }
};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  console.log('REQUEST: ' + JSON.stringify(request.query));
  var surgeon = request.query.surgeon;
  var procedure = request.query.procedure;
  var results = [];
  getProcedures()
  .then(procedureDict => {
  //console.log('PROCEDURE LIST: ' + JSON.stringify(procedureList));
  if (procedure) {
    var procedureId = procedureDict[procedure];
    console.log('PROCEDURE ID: ' + procedureId);
    getProcedure(procedureId)
    .then(p => {
      console.log('P: ' + JSON.stringify(p));
      var promiseChain = [];
      //for (var i in p) {
        var preferences = p.preferences;
        console.log('** PREFERENCES: ' + preferences);
        for (var j in preferences) {
          promiseChain.push(getPreference(preferences[j].id));
        }
      //}
      Promise.all(promiseChain)
      .then(data => {
        for(var k in data) {
          results.push(data[k]);
        }
      var procedureList = Object.keys(procedureDict);
      var lint = ejsLint('views/pages/index.ejs', {results: results});
      console.log('RESULTS: ' + JSON.stringify(results));
      console.log('LINT ERRORS: ' + JSON.stringify(lint));
      response.render('pages/index', {
        results: results,
        procedureList: procedureList,
        surgeon: surgeon,
        procedure: procedure
      });
      });
    });
  } else {
      console.log('ELSE');
      var procedureList = Object.keys(procedureDict);
      var lint = ejsLint('views/pages/index.ejs', {results: results});
      console.log('RESULTS: ' + JSON.stringify(results));
      console.log('LINT ERRORS: ' + JSON.stringify(lint));
      response.render('pages/index', {
        results: results,
        procedureList: procedureList,
        surgeon: surgeon,
        procedure: procedure
      });
  }
    });
  //});
  //})
  //.catch(err => conosle.log('ERROR: ' + err));
});

//var preferenceCardRoute = require('./routes/preferenceCard.js');

//router.use('/api/v1/preferenceCard', preferenceCardRoute);

router.get('/api/v1/preferences', function(req, res) {
  var url = baseUrl + '/preferences';
  requestify.get(url, options)
  .then (function(response) {
    var body = response.getBody();
    console.log('BODY: ' + JSON.stringify(body));
  });
});

function getMultiplePreferences(prefrences) {
 var results = [];
 for (var j in preferences) {
   getPreference(preferences[j].id)
   .then(preferenceResult => {
     results.push(preferenceResult);
   })
   .catch(err => console.log('ERROR: ' + err));
 }
 return results;
};

function getSurgeon(surgeon) {
  return new Promise(
    function (resolve, reject) {
      var url = baseUrl + '/surgeons?surgeon=' + surgeon;
      requestify.get(url, options)
      .then (function(response) {
        console.log('SURGEON RESULTS: ' + JSON.stringify(response.getBody()));
        resolve(response.getBody());
      });
    }
  );
};

function getProcedure(procedure) {
  return new Promise(
    function (resolve, reject) {
      //var url = baseUrl + '/procedures?a_p_repair=' + procedure;
      var url = baseUrl + '/procedures/' + procedure;
      requestify.get(url, options)
      .then (function(response) {
        console.log('PROCEDURE RESULTS: ' + JSON.stringify(response.getBody()));
        resolve(response.getBody());
      });
    }
  );
};

function getProcedures() {
  return new Promise(
    function (resolve, reject) {
      var url = baseUrl + '/procedures';
      requestify.get(url, options)
      .then (function(response) {
        var results = response.getBody();
        var list = [];
        var dict = {};
        for (var i in results) {
          list.push(results[i].a_p_repair);
          dict[results[i].a_p_repair] = results[i].id;
        }
        resolve(dict);
      });
    }
  );
};

function getPreference(preferenceId) {
  return new Promise(
    function (resolve, reject) {
      console.log('GET PREFERENCE');
      var url = baseUrl + '/preferences/' + preferenceId;
      requestify.get(url, options)
      .then (function(response) {
        console.log('PREFERENCE RESULTS: ' + JSON.stringify(response.getBody()));
        resolve(response.getBody());
      });
    }
  );
};

function getPreferences() {
  return new Promise(
    function (resolve, reject) {
      var url = baseUrl + '/preferences';
      requestify.get(url, options)
      .then (function(response) {
        console.log('BODY: ' + JSON.stringify(response.getBody()));
        resolve(response.getBody());
      });
    }
  );
};

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
