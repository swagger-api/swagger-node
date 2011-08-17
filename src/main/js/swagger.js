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
				// found matching path
				appendToApi(api, spec);
				return;
			}
		}
	}

	var api = {
		"path" : spec.path
	};

	if (!resources[spec.rootResource]) {
		resources[spec.rootResource] = {
			"apis" : new Array()
		}
	}
	resources[spec.rootResource].apis.push(api);
	appendToApi(api, spec);
	app.get(spec.rootResource + spec.path, cb);
}

function addGet(app, cb, spec) {
	addMethod(app,cb,spec,"GET");
}

function addPost(app, cb, spec) {
	addMethod(app,cb,spec,"POST");
}

function addDelete(app, cb, spec) {
	addMethod(app,cb,spec,"DELETE");
}

function addPut(app, cb, spec) {
	addMethod(app,cb,spec,"PUT");
}

function appendToApi(api, spec) {
	api.description = "not here yet";

	if (!api.operations)
		api.operations = new Array();

	//	TODO: replace if existing operation in same api

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
	if (!api.models)
		api.models = new Array();
	api.models.push(spec.outputModel);
}

exports.queryParam = function(name, description, dataType, required, allowMultiple, allowableValues) {
	return {
		"name":name,
		"description":description,
		"dataType":dataType,
		"required":required,
		"allowMultiple":allowMultiple,
		"allowableValues":allowableValues,
		"paramType":"query"
	};
}

exports.postParam = function(name, description, dataType, allowableValues) {
	return {
		"name":name,
		"description":description,
		"dataType":dataType,
		"required":true,
		"allowableValues":allowableValues,
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
