var express = require("express");
var url = require("url");

//  swagger core
var swagger = require("../../Common/node/swagger.js");

var app = express.createServer();

//  start the server
app.use(express.bodyParser());
swagger.setAppHandler(app);

/**
 * Randomizer and Model Checker actions
 **/
swagger.discover(require("./res.Randomizer.js"));

swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod) {
      //  validate by api_key in header or queryparam
      var apiKey = req.headers["api_key"];
      if(!apiKey) apiKey= url.parse(req.url,true).query["api_key"];
      if("special-key" == apiKey) return true;
      return false;
    }
    //  allow everything else
    return true;
  }
);

//  configures the app
swagger.configure(app, "http://localhost:8002", "0.1");

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

app.listen(8002);
