var express = require("express");
var url = require("url");

//  swagger core
var swagger = require("../../Common/node/swagger.js");
var app = express.createServer();

//  start the server
app.use(express.bodyParser());
swagger.setAppHandler(app);

// Randomizer actions
swagger.discover(require("./res.Randomizer.js"));

// configures the app
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

// start the server
app.listen(8002);
