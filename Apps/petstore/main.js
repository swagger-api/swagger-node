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
    if("POST" == httpMethod){
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
// resources for the demo
var petResources = require("./petResources.js");

swagger.addGet(petResources.findByTags)
  .addGet(petResources.findByStatus)
  .addGet(petResources.findById)
  .addPut(petResources.addPet)
  .addPost(petResources.updatePet)
  .addDelete(petResources.deletePet);

// configures the app
swagger.configure("http://localhost:8002", "0.1");

// start the server
app.listen(8002);
