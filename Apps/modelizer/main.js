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

app.listen(8002);
