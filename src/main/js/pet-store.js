var express = require("express");
var url = require("url");
var swagger = require("./swagger.js");
var petResources = require("./petResources.js");
var petstoreModels = require("./models.js");

var app = express.createServer();

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
