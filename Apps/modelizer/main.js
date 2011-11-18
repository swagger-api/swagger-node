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

//  configures the app
swagger.configure("http://localhost:8002", "0.1");

app.listen(8002);
