var express = require("express");
var swagger = require("./swagger.js");
var myModels = require("./models.js");
var errors = require("./errors.js");

var app = express.createServer();

var getSpec = {
	"rootResource" : "super.json",
	"path" : "/foo",
	"notes" : "gets foo",
	"summary" : "summary",
	"params" : new Array(swagger.queryParam("paramater name", "the description",
			"string", true, true, "1,2,3,4")),
	"outputModel" : {
		"name" : "pet",
		"responseClass" : myModels.petModel
	},
	"errorResponses" : new Array(errors.error(400, "invalid id"), errors.error(
			404, "not found")),
	"nickname" : "foo"
}

var postSpec = {
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
	"nickname" : "foo post"
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
	"nickname" : "foo delete"
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
	"nickname" : "foo put"
}

function callback(req, res) {
	res.send(JSON.stringify({
		"message" : "it works!"
	}));
}

swagger.addGet(app, callback, getSpec);
swagger.addPost(app, callback, postSpec);
swagger.addDelete(app, callback, deleteSpec);
swagger.addPut(app, callback, putSpec);
swagger.configure(app, "http://localhost:3000", "0.1");

app.get(swagger.resourcePath, swagger.resourceListing);

app.configure(function() {
});

app.listen(3000);
