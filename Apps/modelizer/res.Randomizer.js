var swagger = require("../../Common/node/swagger.js");
var models = require("./models.js");
var url = require("url");

exports.randoms = {
  'spec': {
    "description" : "Operations for testing random model generator",
    "path" : "/randoms.{format}/all",
    "method": "GET",
    "notes" : "Return object filled with random data. Provide an identifier to regenerate random data for testing etc.",
    "summary" : "Generate random data",
    "params" : [swagger.queryParam("ID", "Random identifier for generating content")],
    "outputModel" : {
      "name" : "random",
      "responseClass" : models.random
    },
    "nickname" : "randomsAll"
  },
  'action': function (req,res) {
    var randomID = url.parse(req.url,true).query["ID"] || -1;
    res.send(JSON.stringify(swagger.containerByModel(models.random, {'ID': randomID}, randomID)));
  }
};

exports.justFields = {
  'spec': {
    "description" : "Operations for testing model generator",
    "path" : "/randoms.{format}/model",
    "method": "GET",
    "notes" : "Return empty object based on default model",
    "summary" : "Generate empty model container",
    "outputModel" : {
      "name" : "random",
      "responseClass" : models.random
    },
    "nickname" : "justFields"
  },
  'action': function (req,res) {
    res.send(JSON.stringify(swagger.containerByModel(models.random, {'ID': -1}, false)));
  }
};