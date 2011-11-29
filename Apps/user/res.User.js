var sw = require("../../Common/node/swagger.js");
var param = require("../../Common/node/paramTypes.js");
var models = require("./models.js");
var url = require("url");
var swe = sw.errors;
var mongo = require('mongodb');
var passwordHash = require('password-hash');

/**
 * Simple function for cleaning db result
 */
function cleanUser(u) {
  delete u.password;
  delete u.mail;
  
  return u;
}

exports.newUser = {
  'spec': {
    "description" : "Create new User item",
    "path" : "/user.{format}",
    "method": "POST",
    "notes" : "Creates a new User account with provided information. Will return error message if something failed or send an confirmation email if account has been created.",
    "summary" : "Create new User account",
    "params" : [param.post("data", "{\"name\": \"username\", \"mail\": \"mail@example.com\", \"password\": \"toBeHashed\"}", "string", true)],
    "outputModel" : {
      "name" : "user",
      "responseClass" : models.user
    },
    "errorResponses" : [swe.invalid('data'), swe.invalid('name'), swe.invalid('mail'), swe.invalid('password')],
    "nickname" : "create"
  },
  'action': function (req,res) {	
    var data = req.param('data');
    if (!data) {
      throw swe.invalid('data'); }
      
    try {
      data = JSON.parse(data);
      if (!data.name || !models.user.properties.name.regex.test(data.name)) {
        throw swe.invalid('name'); }
      if (!models.user.properties.mail.regex.test(data.mail) || !data.mail) {
        throw swe.invalid('mail'); }
      if (!data.password) {
        throw swe.invalid('password'); }
      
      var collection = new mongo.Collection(req.db, 'User');
      collection.find({'name': data.name}).toArray(function(err, docs) {
        if (!err && docs.length == 0) {
          var newUser = {'name': data.name, 'mail': data.mail, 'password': passwordHash.generate(data.password), 'created': new Date()};
          collection.insert(newUser, function(err, result) { res.send(JSON.stringify(result[0])); }); 
        } else {
          swe.invalid('name', res); }
      });
    } catch (e) {
      if (e && e.code) {
        res.send(JSON.stringify(e), e.code); }
      else {
        swe.invalid('data', res); }
    };
  }
};

exports.deleteUser = {
  'spec': {
    "description" : "Delete User",
    "path" : "/user.{format}",
    "method": "DELETE",
    "notes" : "Delete User",
    "summary" : "Delete User",
    "params" : [param.post("name", "User name", "string", true), param.post("password", "User password", "string", true)],
    "outputModel" : {
      "name" : "user",
      "responseClass" : models.user
    },
    "errorResponses" : [swe.invalid('name'), swe.invalid('password'), swe.notFound('User')],
    "nickname" : "delete"
  },
  'action': function (req,res) {	
    var name = req.param('name');
    if (!name || !models.user.properties.name.regex.test(name)) {
      throw swe.invalid('name'); }
    var password = req.body.password;
    if (!password) {
      throw swe.invalid('password'); }
      
    var collection = new mongo.Collection(req.db, 'User');
    collection.find({'name': name}).toArray(function(err, docs) {
      if (!err && docs.length == 1) {
        if (passwordHash.verify(password, docs[0].password)) {
          var user = {'name': name};
          res.send(JSON.stringify(user));
          
          collection = new mongo.Collection(req.db, 'User');
          collection.remove(user);
          collection = new mongo.Collection(req.db, 'Token');
          collection.remove({'user': name}); } 
        else {
          swe.invalid('password', res); } 
      } else {
        swe.invalid('name', res); }
    });
  }
};

exports.search = {
  'spec': {
    "description": "Search for Users by name",
    "path": "/user.{format}/search",
    "method": "GET",
    "notes": "Search for Users by name and get List of matching users",
    "summary": "Search Users by name",
    "params": [param.query("name", "Search for Users by name", "string")],
    "outputModel": {"name": "List[user]", "responseClass": models.user},
    "errorResponses": [swe.invalid('name')],
    "nickname": "search"
  },
  'action': function (req,res) {
    var name = url.parse(req.url,true).query["name"];
    if (!name) {
      throw swe.invalid('name'); }
      
    var collection = new mongo.Collection(req.db, 'User');
    collection.find({'name': {$regex: '(' + name + ')'}}).sort({'name': 1}).toArray(function(err, docs) {
      if (!err) {
        var output = [];
        for (var n = 0; n < docs.length; n++) {
          output.push(cleanUser(docs[n])); }
        res.send(JSON.stringify(output)); 
      } else {
        swe.notFound('User', res); }
    });
  }
};

exports.createToken = {
  'spec': {
    "description": "Get token for User access",
    "path": "/user.{format}/session",
    "method": "POST",
    "notes": "Create token for User access and authentication",
    "summary": "Create User token",
    "params": [param.post("name", "User name", "string"), param.post("password", "User password", "string")],
    "outputModel": {"name": "user", "responseClass": models.user},
    "errorResponses": [swe.invalid('name'), swe.invalid('password')],
    "nickname": "createToken"
  },
  'action': function (req,res) {
    var name = req.body.name;
    if (!name || !models.user.properties.name.regex.test(name)) {
      throw swe.invalid('name'); }
    var password = req.body.password;
    if (!password) {
      throw swe.invalid('password'); }
      
    var collection = new mongo.Collection(req.db, 'User');
    collection.find({'name': name}).toArray(function(err, docs) {
      if (!err && docs.length == 1) {
        if (passwordHash.verify(password, docs[0].password)) {
          var token = {'user': name, 'token': passwordHash.generate(docs[0].name), 'created': new Date()};
          res.send(JSON.stringify(token));
          collection = new mongo.Collection(req.db, 'Token');
          collection.insert(token); 
        } else {
          swe.invalid('password', res); } 
      } else {
        swe.invalid('name', res); }
    });
  }
};

exports.checkToken = {
  'spec': {
    "description": "Check User session",
    "path": "/user.{format}/session/{token}",
    "method": "GET",
    "notes": "Check User session",
    "summary": "Check User session",
    "params": [param.path("token", "User Session token", "string")],
    "outputModel": {"name": "user", "responseClass": models.user},
    "errorResponses": [swe.invalid('token')],
    "nickname": "checkToken"
  },
  'action': function (req,res) {
    var token = req.params.token;
    if (!token) {
      throw swe.invalid('token'); }
      
    var collection = new mongo.Collection(req.db, 'Token');
    collection.find({'token': token}).toArray(function(err, docs) {
      if (!err && docs.length == 1) {
        res.send(JSON.stringify(docs[0])); } 
      else {
        swe.invalid('token', res); }
    });
  }
};

exports.findById = {
  'spec': {
    "description": "Operations about user",
    "path": "/user.{format}/{name}",
    "method": "GET",
    "notes": "Return user by internal identifier, will throw error on non integer input",
    "summary": "Find User by ID",
    "params": [param.path("name", "ID of user that needs to be fetched", "string")],
    "outputModel": {"name": "user", "responseClass": models.user},
    "errorResponses": [swe.invalid('name'), swe.notFound('User')],
    "nickname": "byName"
  },
  'action': function (req,res) {
    var name = req.params.name;
    if (!name || !models.user.properties.name.regex.test(name)) {
      throw swe.invalid('name'); }
      
    var collection = new mongo.Collection(req.db, 'User');
    collection.find({'name': name}).toArray(function(err, docs) {
      if (!err && docs.length == 1) {
        res.send(JSON.stringify(cleanUser(docs[0]))); }
      else {
        swe.notFound('User', res); }
    });
  }
};

