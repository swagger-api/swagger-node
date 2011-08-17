var resourcePath = "/resources.json";
var basePath = "/";
var swaggerVersion = "1.0";
var apiVersion = "0.0";
var resources = new Object();

function configure(app, bp, av) {
	basePath = bp;
	apiVersion = av;
	setResourceListingPaths(app);
}

function setResourceListingPaths(app){
	for ( var key in resources) {
		var r = resources[key];
		app.get("/" + key, function(req,res){
			res.write(JSON.stringify(r));
			res.end();
		})
	}	
}

function resourceListing(request, response) {
	var r = {
		"apis" : new Array(),
		"basePath" : basePath,
		"swaggerVersion" : swaggerVersion,
		"apiVersion" : apiVersion
	};
	for ( var key in resources) {
		r.apis.push({
			"path" : "/"+key,
			"description" : "none"
		})
	}
	response.write(JSON.stringify(r));
	response.end();
}

function addMethod(app, cb, spec, method){
	var root = resources[spec.rootResource];
	if(root && root.apis){
		for ( var key in root.apis) {
			var api = root.apis[key];
			if (api && api.path == spec.path) {
				// found matching path, add & return
				appendToApi(root, api, spec);
				return;
			}
		}
	}

	var api = {
		"path" : spec.path
	};

	if (!resources[spec.rootResource]) {
		root = {
			"apis" : new Array()
		}
		resources[spec.rootResource] = root;
	}
	root.apis.push(api);
	appendToApi(root, api, spec);
	app.get(spec.rootResource + spec.path, cb);
}

function addGet(app, cb, spec) {
	spec.method="GET";
	addMethod(app,cb,spec);
}

function addPost(app, cb, spec) {
	spec.method="POST";
	addMethod(app,cb,spec);
}

function addDelete(app, cb, spec) {
	spec.method="DELETE";
	addMethod(app,cb,spec);
}

function addPut(app, cb, spec) {
	spec.method="PUT";
	addMethod(app,cb,spec);
}

function appendToApi(rootResource, api, spec) {
	api.description = "not here yet";

	// validate params
	var validationErrors = new Array();
	for(var paramKey in spec.params){
		var param = spec.params[paramKey];
		switch(param.paramType){
			case "path":{
				if(api.path.indexOf("{"+param.name+"}")<0) validationErrors.push({"path":api.path,"name":param.name,"error":"invalid path"});
				break;
			}
			case "query":{
				break;
			}
			case "post":{
				break;
			}
			default:{
				validationErrors.push({"path":api.path,"name":param.name,"error":"invalid param type " + param.paramType});
			}
		}
	}
	
	if(validationErrors.length > 0){
		console.log(validationErrors);
		console.log("######" + JSON.stringify(spec.params));
		return;
	}
	if (!api.operations)
		api.operations = new Array();

	// TODO: replace if existing HTTP operation in same api path
	api.operations.push({
		"parameters" : spec.params,
		"httpMethod" : spec.method,
		"notes" : spec.notes,
		"errorResponses" : spec.errorResponses,
		"nickname" : spec.nickname,
		"responseClass" : spec.outputModel.name,
		"summary" : spec.summary
	});

	// add model if not already in array by name
	for ( var key in api.models) {
		var model = api.models[key];
		if (model.name == spec.outputModel.name) {
			return;
		}
	}
	if (!rootResource.models)
		rootResource.models = new Array();
	for(var key in rootResource.models){
		//	don't add the model again
		if(rootResource.models[key].name == spec.outputModel.name) return;
	}
	rootResource.models.push(spec.outputModel);
}

function createEnum(input) {
	if(input && input.indexOf(",")>0){
		//	TODO: stupid!
		var output = new Array();
		var array=input.split(",");
		array.forEach(function(item){
			output.push(item);
		})
		return output;
	}
}

exports.queryParam = function(name, description, dataType, required, allowMultiple, allowableValues) {
	return {
		"name":name,
		"description":description,
		"dataType":dataType,
		"required":required,
		"allowMultiple":allowMultiple,
		"allowableValues":createEnum(allowableValues),
		"paramType":"query"
	};
}

exports.pathParam = function(name, description, dataType, allowableValues) {
	return {
		"name":name,
		"description":description,
		"dataType":dataType,
		"required":true,
		"allowMultiple":false,
		"allowableValues":createEnum(allowableValues),
		"paramType":"path"
	};
}

exports.postParam = function(name, description, dataType, allowableValues) {
	return {
		"name":name,
		"description":description,
		"dataType":dataType,
		"required":true,
		"allowableValues":createEnum(allowableValues),
		"paramType":"path"
	};
}

exports.configure = configure
exports.resourcePath = resourcePath
exports.resourceListing = resourceListing
exports.addGet = addGet
exports.addPost = addPost
exports.addPut = addPut
exports.addDelete = addDelete
