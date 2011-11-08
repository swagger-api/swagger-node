var express = require("express")
 , url = require("url")
 , swagger = require("../../Common/node/swagger.js")
 , db = false; // maybe define a global database handler if needed?

var app = express.createServer(
  /** Add global database handler to request data */
  function(req, res, next) { if (req.db === undefined) { req.db = db; } next(); }, 
  /** Add authentication */
  function(req, res, next) { 
    /** 
     * Example: All POST request need to be accessed with api_key 'special-key'
     */
    if (req.method == 'POST') {
      var apiKey = req.headers["api_key"] || require('url').parse(req.url,true).query["api_key"];
      if (!apiKey || apiKey != 'special-key' ) {
        return swagger.stopWithError(res); }
    }
    
    /**
     * Accept request and call next action
     */
    next();
    
    /**
     * ruff example for dynamic api_key handling with mongodb, needs of course some tweaking for your custom 
     * settings and of course a working mongodb handler like https://github.com/christkv/node-mongodb-native 
     *
     * req.db.collection('Clients', function(err, c) {
     *   c.find({'key': apiKey}).toArray(function(err, result) {
     *     if (result.length == 1) {
     *       next();
     *     } else {
     *       swagger.stopWithError(res);    
     *     }
     *   });
     * });
     **/
  }
);
app.use(express.bodyParser());
swagger.setAppHandler(app);  

// resources for the demo
var petResources = require("./petResources.js");

swagger.addGet(petResources.findByStatus)
  .addGet(petResources.findByTags)
  .addGet(petResources.findById)
  .addPost(petResources.addPet)
  .addDelete(petResources.deletePet)
  .addPut(petResources.updatePet);

// configures the app
swagger.configure("http://localhost:8002", "0.1");

// start the server
app.listen(8002);
