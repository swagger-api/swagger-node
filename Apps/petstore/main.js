var express = require("express");
var url = require("url");

//  swagger core
var swagger = require("../../Common/node/swagger.js");

//  resources for the demo
var petResources = require("./petResources.js");

var app = express.createServer();
swagger.setAppHandler(app);

swagger.addGet(petResources.findByStatus)
  .addGet(petResources.findByTags)
  .addGet(petResources.findById)
  .addPost(petResources.addPet)
  .addDelete(petResources.deletePet)
  .addPut(petResources.updatePet);

swagger.addValidator(
  function validate(req, path, httpMethod) {
    
    return true;
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

//  configures the app
swagger.configure(app, "http://localhost:8002", "0.1");

//  start the server
app.listen(8002);
