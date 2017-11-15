var express = require('express');
var app = express();
var router = express.Router();

var Fieldbook = require('node-fieldbook');
var requestify = require('requestify');
var ejsLint = require('ejs-lint');

//var bookId = '598603f8789bad0400ee5c36';
var bookId = '5960e0dab93bd8030008699d';
var baseUrl = 'https://api.fieldbook.com/v1/' + bookId;
var options = {
    headers: {accept: 'application/json'},

    auth: {
        username: process.env.FIELDBOOK_USER,
        password: process.env.FIELDBOOK_KEY
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
  var previousPreferenceIds = [];
  if (request.query.preference) {
    previousPreferenceIds = request.query.preference;
  }
  var results = [];
  var lint = ejsLint('views/pages/index.ejs', {results: results});
  getProceduresAndSurgeons()
  .then(ps => {
    console.log('PROCEDURE LIST');
    var procedureList = Object.keys(ps.procedures);
    var surgeonList = Object.keys(ps.surgeons);
    //console.log('PROCEDURE LIST: ' + JSON.stringify(ps[0]));
    if (procedure || surgeon) {
      var procedureDict = ps.procedures;
      var procedureId = procedureDict[procedure];
      var surgeonId = ps.surgeons[surgeon];
      console.log('PROCEDURE ID: ' + procedureId);
      getProcedureSurgeonPreferences(procedureId, surgeonId)
      .then(preferences => {
        console.log('** PREFERENCES: ' + preferences);
        var promiseChain = [];
        for (var j in preferences) {
          promiseChain.push(getPreference(preferences[j]));
        }
        Promise.all(promiseChain)
        .then(data => {
          for(var k in data) {
            results.push(data[k]);
          }
          console.log('RESULTS: ' + JSON.stringify(results));
          console.log('LINT ERRORS: ' + JSON.stringify(lint));
          response.render('pages/index', {
            results: results,
            procedureList: procedureList,
            surgeonList: surgeonList,
            surgeon: surgeon,
            procedure: procedure,
            previousPreferenceIds: previousPreferenceIds
          });
        });
      });
    } else {
      console.log('ELSE');
      console.log('RESULTS: ' + JSON.stringify(results));
      console.log('LINT ERRORS: ' + JSON.stringify(lint));
      response.render('pages/index', {
        results: results,
        procedureList: procedureList,
        surgeonList: surgeonList,
        surgeon: surgeon,
        procedure: procedure,
        previousPreferenceIds: previousPreferenceIds
      });
  }
    });
  //});
  //})
  //.catch(err => conosle.log('ERROR: ' + err));
});

app.get('/print', function(request, response) {
  console.log('REQUEST: ' + JSON.stringify(request.query));
  var preference = [];
  var results = [];
  var lint = ejsLint('views/pages/print.ejs', {results: results});
  var promiseChain = [];
  console.log('TYPE OF ' + typeof request.query.preference);
  if (typeof request.query.preference === "string") {
    preference.push(request.query.preference);
  } else {
    preference = request.query.preference;
  }
  for (var j in preference) {
    console.log('J: ' + JSON.stringify(preference[j]));
    promiseChain.push(getPreference(preference[j]));
  }
  Promise.all(promiseChain)
  .then(data => {
    for(var k in data) {
      results.push(data[k]);
    }
    console.log('RESULTS: ' + JSON.stringify(results));
    console.log('LINT ERRORS: ' + JSON.stringify(lint));
    response.render('pages/print', {
      results: results,
    });
  });
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
      var url = baseUrl + '/surgeons/' + surgeon;
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
}

function getProcedureSurgeonPreferences(procedure, surgeon) {
  return new Promise(function (resolve, reject) {
    console.log('START OF GET SPP');
    var preferenceIds = [];
    var promiseChain = [];
    if (procedure) {
      console.log('IF PROCEDURE');
      if (surgeon) {
        console.log('PROCEDURE AND SURGEON');
        promiseChain.push(getProcedure(procedure));
        promiseChain.push(getSurgeon(surgeon));
        Promise.all(promiseChain)
        .then(data => {
          var pPreferenceIds = [];
          var s = data[1];
          var p = data[0];
          for(var j in p.preferences) {
            pPreferenceIds.push(data[0].preferences[j].id);
          }
          for(var i in s.preferences) {
            console.log('HELLO: ' + pPreferenceIds.indexOf(s.preferences[i].id));
            if(pPreferenceIds.indexOf( s.preferences[i].id ) > -1){
              console.log(s.preferences[i].id);
              preferenceIds.push( s.preferences[i].id );
            }
          }
          resolve(preferenceIds);
        });
       
      } else {
        console.log('ONLY PROCEDURE');
        getProcedure(procedure)
        .then(p => {
          for (var i in p.preferences) {
            preferenceIds.push(p.preferences[i].id);
          }
          resolve(preferenceIds);
        });
      }
    } else if (surgeon) {
      console.log('ONLY SURGEON');
      getSurgeon(surgeon)
      .then(s => {
        for (var i in s.preferences) {
          preferenceIds.push(s.preferences[i].id);
        }
        resolve(preferenceIds);
      });
    } else {
      console.log('NEITHER');
      resolve(null);
    }
  });
}

function getProceduresAndSurgeons() {
  return new Promise(
    function (resolve, reject) {
      var url = baseUrl + '/procedures';
      var ps = {};
      var promiseChain = [];
      console.log('GET PRCOEDURES AND SURGEONS');
      promiseChain.push(requestify.get(url, options));
      url = baseUrl + '/surgeons';
      promiseChain.push(requestify.get(url, options));
      Promise.all(promiseChain)
      .then(data => {
      //requestify.get(url, options)
      //.then (function(response) {
        //console.log('PROCEDURE RESPONSE: ' + JSON.stringify(response));
        console.log('PROCEDURE RESPONSE');
        var results = data[0].getBody();
        var list = [];
        var procedures = {};
        for (var i in results) {
          procedures[results[i].procedure] = results[i].id;
        }
        console.log('after loop');
        ps.procedures = procedures;
        //console.log('PS: ' + JSON.stringify(ps));
        //url = baseUrl + '/surgeons';
        //requestify.get(url, options)
        //.then (function(response) {
          console.log('surgeon response');
          //console.log('SURGEON RESPONSE: ' + JSON.stringify(response));
          var body = data[1].getBody();
          var surgeons = {};
          
          for (var j in body) {
            surgeons[body[j].surgeon] = body[j].id;
          }
          ps.surgeons = surgeons;
          console.log('END');
          resolve(ps);
        //});
      })
      .catch(function(err) {
        console.log('ERROR in getProceduresAndSurgeons()');
        console.log(err);
        reject(err);
      });
    }
  );
}

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
}

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
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
