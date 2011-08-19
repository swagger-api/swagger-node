var express = require("express");
var url = require("url");
var swagger = require("./swagger.js");
var petResources = require("./petResources.js");
var petstoreModels = require("./models.js");

var app = express.createServer();

var postSpec = {
	"rootResource" : "super.{format}",
	"path" : "/foo",
	"notes" : "posts foo",
	"summary" : "summary",
	"params" : new Array(swagger.queryParam("replace", "toggles whether or not pet is replaced", "boolean", false, false, "true,false")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : petstoreModels.pet
	},
	"errorResponses" : new Array(swagger.error(400, "invalid id"), swagger.error(
			404, "not found")),
	"nickname" : "updateFoo"
}

var deleteSpec = {
	"rootResource" : "super.json",
	"path" : "/foo",
	"notes" : "posts foo",
	"summary" : "summary",
	"params" : new Array(swagger.postParam("paramater name", "the description",
			"string", "1,2,3,4")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : petstoreModels.pet
	},
	"errorResponses" : new Array(swagger.error(400, "invalid id"), swagger.error(
			404, "not found")),
	"nickname" : "deleteFoo"
}

var putSpec = {
	"rootResource" : "super.json",
	"path" : "/foo",
	"notes" : "posts foo",
	"summary" : "summary",
	"params" : new Array(swagger.postParam("paramater name", "the description",
			"string", "1,2,3,4")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : petstoreModels.pet
	},
	"errorResponses" : new Array(swagger.error(400, "invalid id"), swagger.error(
			404, "not found")),
	"nickname" : "putFoo"
}

function callback(req, res) {
	res.header('Access-Control-Allow-Origin', "*");
	res.send(JSON.stringify({
		"message" : "it works!"
	}));
}

swagger.addGet(app, callback, petResources.findById);
swagger.addGet(app, callback, petResources.findByStatus);
swagger.addGet(app, callback, petResources.findByTags);
swagger.addPost(app, callback, petResources.addPet);
swagger.addDelete(app, callback, petResources.deletePet);
swagger.addPut(app, callback, petResources.updatePet);

swagger.addValidator(
	function validate(req, path, httpMethod) {
		//	example, only allow POST for api_key="special-key"
		if("POST" == httpMethod){
			//	validate by api_key in header or queryparam
			var apiKey = req.headers["api_key"];
			if(!apiKey) apiKey= url.parse(req.url,true).query["api_key"];
			if("special-key" == apiKey) return true;
			return false;
		}
		//	allow everything else
		return true;
	}
);

//	configures the app
swagger.configure(app, "http://localhost:3000", "0.1");

app.listen(3000);
