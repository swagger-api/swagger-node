var express = require("express");
var url = require("url");
var mongodb = require('mongodb');
var swagger = require("../../Common/node/swagger.js");
var connect = require("connect");

var dbName = 'swagger-user';
var dbHost = '127.0.0.1';
var dbPort = 27017;

var dbServer = new mongodb.Server(dbHost, dbPort, {});
var db = new mongodb.Db(dbName, dbServer);

db.open(function(err, db) {
  if (err || !db) {
    console.log('Cannot connect to database');
  } else {
    // Start Expressjs handler
    var app = express.createServer(
      connect.bodyParser(), /* Express' bodyParser() is not working propper? */
      function(req, res, next) {
        if (req.db === undefined) {
          req.db = db; }
        next(); });
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

    // serve up swagger ui at /docs
    var docs_handler = express.static(__dirname + '/../../swagger-ui/build/');
    app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
      if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
        res.writeHead(302, { 'Location' : req.url + '/' });
        res.end();
        return;
      }
      // take off leading /docs so that connect locates file correctly
      req.url = req.url.substr('/docs'.length);
      return docs_handler(req, res, next);
    });

    console.log('API listening on ' + 8002);
    app.listen(8002);
  }
});
