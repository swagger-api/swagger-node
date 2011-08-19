var express = require("express");
var url = require("url");
var swagger = require("./swagger.js");
var myModels = require("./models.js");
var errors = require("./errors.js");

var app = express.createServer();

var getSpec = {
	"rootResource" : "super.{format}",
	"path" : "/foo/{name}",
	"notes" : "gets foo",
	"summary" : "summary",
	"params" : new Array(
			swagger.queryParam("showDetails", "toggles whether or not details are returned", "boolean", false, false, "true,false"),
			swagger.pathParam("name", "the name of foo to get", "string")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : myModels.petModel
	},
	"errorResponses" : new Array(errors.error(400, "invalid id"), errors.error(
			404, "not found")),
	"nickname" : "foo"
}

var postSpec = {
	"rootResource" : "super.{format}",
	"path" : "/foo",
	"notes" : "posts foo",
	"summary" : "summary",
	"params" : new Array(swagger.queryParam("replace", "toggles whether or not pet is replaced", "boolean", false, false, "true,false")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : myModels.petModel
	},
	"errorResponses" : new Array(errors.error(400, "invalid id"), errors.error(
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
		"responseClass" : myModels.petModel
	},
	"errorResponses" : new Array(errors.error(400, "invalid id"), errors.error(
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
		"responseClass" : myModels.petModel
	},
	"errorResponses" : new Array(errors.error(400, "invalid id"), errors.error(
			404, "not found")),
	"nickname" : "putFoo"
}

function callback(req, res) {
	res.send(JSON.stringify({
		"message" : "it works!"
	}));
}

swagger.addGet(app, callback, getSpec);
swagger.addPost(app, callback, postSpec);
//swagger.addDelete(app, callback, deleteSpec);
//swagger.addPut(app, callback, putSpec);

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

swagger.configure(app, "http://localhost:3000", "0.1");

app.get(swagger.resourcePath, swagger.resourceListing);

app.listen(3000);
