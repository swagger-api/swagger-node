var express = require("express");
var url = require("url");

//	swagger core
var swagger = require("./swagger.js");

//	resources for the demo
var petResources = require("./petResources.js");

var app = express.createServer();

function callback(req, res) {
	res.header('Access-Control-Allow-Origin', "*");
	res.send(JSON.stringify({
		"message" : "it works!"
	}));
}

swagger.addGet(app, petResources.findByStatus, petResources.findByStatusSpec);
swagger.addGet(app, petResources.findByTags, petResources.findByTagsSpec);
swagger.addGet(app, petResources.findById, petResources.findByIdSpec);

swagger.addPost(app, callback, petResources.addPetSpec);
swagger.addDelete(app, callback, petResources.deletePetSpec);
swagger.addPut(app, callback, petResources.updatePetSpec);

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

//	start the server
app.listen(3000);
