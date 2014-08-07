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
 , cors = require("cors")
 , app = express()
 , swagger = require("../").createNew(app);

var petResources = require("./resources.js");


var corsOptions = {
  credentials: true,
  origin: function(origin,callback) {
    if(origin===undefined) {
      callback(null,false);
    } else {
      // change wordnik.com to your allowed domain.
      var match = origin.match("^(.*)?.wordnik.com(\:[0-9]+)?");
      var allowed = (match!==null && match.length > 0);
      callback(null,allowed);
    }
  }
};

app.use(express.json());
app.use(express.urlencoded());
app.use(cors(corsOptions));

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
      return "special-key" == apiKey;
    }
    return true;
  }
);

var models = require("./models.js");

// Add models and methods to swagger
swagger.addModels(models)
  .addGet(petResources.findById)
  .addGet(petResources.findByTags)
  .addGet(petResources.findByStatus)
  .addPost(petResources.addPet)
  .addPut(petResources.updatePet)
  .addDelete(petResources.deletePet);

swagger.configureDeclaration("pet", {
  description : "Operations about Pets",
  authorizations : ["oauth2"],
  produces: ["application/json"]
});

// set api info
swagger.setApiInfo({
  title: "Swagger Sample App",
  description: "This is a sample server Petstore server. You can find out more about Swagger at <a href=\"http://swagger.wordnik.com\">http://swagger.wordnik.com</a> or on irc.freenode.net, #swagger.  For this sample, you can use the api key \"special-key\" to test the authorization filters",
  termsOfServiceUrl: "http://helloreverb.com/terms/",
  contact: "apiteam@wordnik.com",
  license: "Apache 2.0",
  licenseUrl: "http://www.apache.org/licenses/LICENSE-2.0.html"
});

swagger.setAuthorizations({
  apiKey: {
    type: "apiKey",
    passAs: "header"
  }
});

// Configures the app's base path and api version.
swagger.configureSwaggerPaths("", "api-docs", "")
swagger.configure("http://localhost:8002", "1.0.0");

// Serve up swagger ui at /docs via static route
var docs_handler = express.static(__dirname + '/../swagger-ui/');
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

app.get('/throw/some/error', function(){
  throw {
    status: 500,
    message: 'we just threw an error for a test case!'
  };
});

app.use(function(err, req, res, next){
  var status = err.status || err.code || 500;
  var message = err.message || 'An error has occurred - ' + err;

  res.send(status, message);
});

// Start the server on port 8002
app.listen(8002);