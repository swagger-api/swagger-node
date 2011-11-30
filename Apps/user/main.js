var express = require("express");
var url = require("url");
var mongodb = require('mongodb');
var swagger = require("../../Common/node/swagger.js");
var connect = require("connect");

var dbName = 'swagger-user';
var dbHost = '127.0.0.1';
var dbPort = 27017;

var dbServer = new mongodb.Server(dbHost, dbPort, {});
new mongodb.Db(dbName, dbServer, {}).open(function (err, srv) {
  srv.open(function(err, db) {
    if (err || !db) {
      console.log('Cannot connect to database');
    } else {
      // Start Expressjs handler
      var app = express.createServer(
        connect.bodyParser(), /* Express' bodyParser() is not working propper? */
        function(req, res, next) { if (req.db === undefined) { req.db = db; } next(); });
      app.use(express.logger('dev'));
      
      // Set swagger actions 
      swagger.setAppHandler(app);
      swagger.discoverFile(__dirname + "/res.User.js");
      
      // Add validation
      swagger.addValidator(
        function validate(req, path, httpMethod) {
          var apiKey = req.headers["api_key"];
          if (!apiKey) 
            apiKey = url.parse(req.url,true).query["api_key"];
          if ("special-key" == apiKey) {
            return true; }
          return false;
        }
      );
      
      //  configures the app
      swagger.configure("http://localhost:8002", "0.1");
  
      console.log('API listening on ' + 8002);
      app.listen(8002);
    }
  });
});