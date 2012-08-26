var express = require("express")
 , url = require("url")
 , swagger = require("../../Common/node/swagger.js")
 , db = false; // maybe define a global database handler if needed?

var app = express.createServer(
  function(req, res, next) { if (req.db === undefined) { req.db = db; } next(); });
app.use(express.bodyParser());
swagger.setAppHandler(app);  
swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod) {
      //  validate by api_key in header or queryparam
      var apiKey = req.headers["api_key"];
      if (!apiKey) {
        apiKey = url.parse(req.url,true).query["api_key"]; }
      if ("special-key" == apiKey) {
        return true; }
      return false;
    }
    //  allow everything else
    return true;
  }
);
// resources for the demo
var petResources = require("./petResources.js");

swagger.addModels(petResources.models)
  .addGet(petResources.findByTags)
  .addGet(petResources.findByStatus)
  .addGet(petResources.findById)
  .addPost(petResources.addPet)
  .addPut(petResources.updatePet)
  .addDelete(petResources.deletePet);

// configures the app
swagger.configure("http://localhost:8002", "0.1");

// serve up swagger ui at /docs
var docs_handler = express.static(__dirname + '/../../../swagger-ui/swagger-ui-1.1.0/');
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

//  start the server
app.listen(8002);
