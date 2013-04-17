// ### Swagger Sample Application
// 
// This is a sample application which uses the [swagger-node-express](https://github.com/wordnik/swagger-node-express)
// module.  The application is organized in the following manner:
//
// #### petResources.js
// 
// All API methods for this petstore implementation live in this file and are added to the swagger middleware.
//
// #### models.js
//
// This contains all model definitions which are sent & received from the API methods. 
//
// #### petData.js
//
// This is the sample implementation which deals with data for this application

// Include express and swagger in the application.
var express = require("express")
 , url = require("url")
 , swagger = require("../../Common/node/swagger.js");

var petResources = require("./petResources.js");

var app = express();
app.use(express.bodyParser());

// Set the main handler in swagger to the express app
swagger.setAppHandler(app);

// This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT
// methods, the header `api_key` OR query param `api_key` must be equal
// to the string literal `special-key`.  All other HTTP ops are A-OK
swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
      var apiKey = req.headers["api_key"];
      if (!apiKey) {
        apiKey = url.parse(req.url,true).query["api_key"]; }
      if ("special-key" == apiKey) {
        return true; 
      }
      return false;
    }
    return true;
  }
);


// Add models and methods to swagger
swagger.addModels(petResources.models)
  .addGet(petResources.findByTags)
  .addGet(petResources.findByStatus)
  .addGet(petResources.findById)
  .addPost(petResources.addPet)
  .addPut(petResources.updatePet)
  .addDelete(petResources.deletePet);

// Configures the app's base path and api version.
swagger.configure("http://localhost:8002", "0.1");

// Serve up swagger ui at /docs via static route
var docs_handler = express.static(__dirname + '/../../swagger-ui-1.1.13/');
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

// Start the server on port 8002
app.listen(8002);