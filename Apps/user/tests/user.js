var http = require('http');

var apiHost = 'localhost';
var apiPort = 8002;
var apiKey = 'special-key';

var gToken = null;

function createUser(test, uName, uMail, uPass, resErr, resName) {
  test.expect(2);
  var post_data = 'data=' + JSON.stringify({"name": uName,"password": uPass,"mail": uMail});
  var post_options = {
    host: apiHost,
    port: apiPort,
    path: '/user.json?api_key=' + apiKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var re = JSON.parse(chunk);
        test.equal(re.code, resErr, "error must not be set");
        test.equal(re.name, resName, "user not created");
        test.done();
      } catch (e) {
        test.done();      
      }
    });
  });

  post_req.write(post_data);
  post_req.end();
}

function deleteUser(test, uName, uPass, resErr, resName) {
  test.expect(2);
  var post_data = 'name=' + uName + "&password=" + uPass;
  var post_options = {
    host: apiHost,
    port: apiPort,
    path: '/user.json?api_key=' + apiKey,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };  
  
  // Set up the request
  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var re = JSON.parse(chunk);
        test.equal(re.code, resErr, "error must not be set");
        test.equal(re.name, resName, "user not removed");
        test.done();
      } catch (e) {
        test.done();      
      }
    });
  });

  post_req.write(post_data);
  post_req.end();
}


exports['Block user names < 4 chars '] = function(test) { 
  createUser(test, 'us1', "lorem@example.com", 'lorem123', 400, undefined); 
};  
exports['Block malformed user name'] = function(test) { 
  createUser(test, 'lorem ipsum', "lorem@example.com", 'lorem123', 400, undefined); 
};
exports['Block missing email address'] = function(test) { 
  createUser(test, 'user1', "", 'lorem123', 400, undefined); 
};
exports['Block malformed email address'] = function(test) { 
  createUser(test, 'user1', "()@example.com", 'lorem123', 400, undefined); 
};
exports['Create User'] = function(test) { 
  createUser(test, 'user1', "lorem@example.com", 'lorem123', undefined, 'user1'); 
};
exports['Block Re-Creation of User'] = function(test) { 
  createUser(test, 'user1', "lorem@example.com", 'lorem123', 400, undefined); 
};  
exports['Delete User'] = function(test) { 
  deleteUser(test, 'user1', 'lorem123', undefined, 'user1'); 
};
exports['Re-Create User'] = function(test) { 
  createUser(test, 'user1', "lorem@example.com", 'lorem123', undefined, 'user1'); 
};
exports['Create Token for User'] = function(test) { 
  test.expect(2);
  var post_data = "name=user1&password=lorem123";
  var post_options = {
    host: apiHost,
    port: apiPort,
    path: '/user.json/session?api_key=' + apiKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };  
  
  // Set up the request
  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var re = JSON.parse(chunk);
        test.equal(re.code, undefined, "error must not be set");
        test.notEqual(re.token, undefined, "token must be received");
        gToken = re.token;
        test.done();
      } catch (e) {
        test.done();      
      }
    });
  });

  post_req.write(post_data);
  post_req.end();
};
exports['Check User Token'] = function(test) { 
  test.expect(2);
  var post_options = {
    host: apiHost,
    port: apiPort,
    path: '/user.json/session/' + gToken + '?api_key=' + apiKey,
    method: 'GET'
  };  
  
  // Set up the request
  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var re = JSON.parse(chunk);
        test.equal(re.code, undefined, "error must not be set");
        test.equal(re.token, gToken, "token must be received");
        test.done();
      } catch (e) {
        test.done();      
      }
    });
  });

  post_req.end();
};
exports['Get User Details'] = function(test) { 
  test.expect(2);
  var post_options = {
    host: apiHost,
    port: apiPort,
    path: '/user.json/user1?api_key=' + apiKey,
    method: 'GET'
  };  
  
  // Set up the request
  var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var re = JSON.parse(chunk);
        test.equal(re.code, undefined, "error must not be set");
        test.equal(re.name, 'user1', "token must be received");
        test.done();
      } catch (e) {
        test.done();      
      }
    });
  });

  post_req.end();
};
exports['Delete User again'] = function(test) { 
  deleteUser(test, 'user1', 'lorem123', undefined, 'user1'); 
};