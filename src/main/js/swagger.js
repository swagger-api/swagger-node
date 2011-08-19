var resourcePath = "/resources.json";
var basePath = "/";
var swaggerVersion = "1.0";
var apiVersion = "0.0";
var resources = new Object();
var validators = Array();

/**
 * sets the base path, api version
 * 
 * @param app
 * @param bp
 * @param av
 */
function configure(app, bp, av) {
	basePath = bp;
	apiVersion = av;
	setResourceListingPaths(app);
}

/**
 * creates declarations for each resource
 * 
 * @param app
 */
function setResourceListingPaths(app) {
	for ( var key in resources) {
		var r = resources[key];
		app.get("/" + key.replace("\.\{format\}", ".json"), function(req, res) {
			res.header('Access-Control-Allow-Origin', "*");
			res.write(JSON.stringify(applyFilter(req, res, r)));
			res.end();
		})
	}
}

/**
 * filters resource listing by access
 *  
 * @param req
 * @param res
 * @param r
 * @returns
 */
function applyFilter(req, res, r) {
	var route = req.route.path;
	var excludedPaths = new Array();
	for ( var key in r.apis) {
		var api = r.apis[key];
		for ( var opKey in api.operations) {
			var op = api.operations[opKey];
			var path = api.path.replace(/{.*\}/, "*");
			if (!canAccessResource(req, route + path, op.httpMethod)) {
				excludedPaths.push(op.httpMethod + ":" + api.path);
			}
		}
	}

	//	only filter if there are paths to exclude
	if (excludedPaths.length > 0) {
		//	clone attributes if any
		var output = shallowClone(r);
		
		//	clone models
		var requiredModels = Array();
		
		//	clone methods that have access
		output.apis = new Array();
		var apis = JSON.parse(JSON.stringify(r.apis));
		for(var i in apis){
			var api = apis[i];
			var clonedApi = shallowClone(api);
			clonedApi.operations = new Array();
			var shouldAdd = true;
			for(var o in api.operations){
				var operation = api.operations[o];
				if(excludedPaths.indexOf(operation.httpMethod + ":" + api.path)>=0)
					break;
				else{
					clonedApi.operations.push(JSON.parse(JSON.stringify(operation)));
					if(operation.responseClass && requiredModels.indexOf(operation.responseClass)<0) requiredModels.push(operation.responseClass);
				}
			}
			if(clonedApi.operations.length>0){
				//	only add cloned api if there are operations
				output.apis.push(clonedApi);

				//	add only required models
				output.models = new Array();
				for(var i in requiredModels){
					output.models.push(r.models[i]);
				}
			}
		}
		return output;
	} else {
		return r;
	}
}

function shallowClone(obj) {
	var cloned = new Object();
	for ( var i in obj) {
		if (typeof (obj[i]) != "object")
			cloned[i] = obj[i];
	}
	return cloned;
}

/**
 * function for filtering a resource.  override this with your own implementation
 * 
 * @param req
 * @param path
 * @param httpMethod
 * @returns {Boolean}
 */
function canAccessResource(req, path, httpMethod) {
	for(var i in validators){
		if(!validators[i](req,path,httpMethod)){
			return false;
		}
	}
	return true;
}

/**
 * returns the json representation of a resource
 * 
 * @param request
 * @param response
 */
function resourceListing(request, response) {
	var r = {
		"apis" : new Array(),
		"basePath" : basePath,
		"swaggerVersion" : swaggerVersion,
		"apiVersion" : apiVersion
	};
	for ( var key in resources) {
		r.apis.push({
			"path" : "/" + key,
			"description" : "none"
		})
	}
	response.header('Access-Control-Allow-Origin', "*");
	response.write(JSON.stringify(r));
	response.end();
}

/**
 * adds a method to the api along with a spec.  If the spec fails to validate, it won't be added
 * 
 * @param app
 * @param callback
 * @param spec
 */
function addMethod(app, callback, spec) {
	var root = resources[spec.rootResource];
	if (root && root.apis) {
		for ( var key in root.apis) {
			var api = root.apis[key];
			if (api && api.path == spec.path) {
				// found matching path, add & return
				appendToApi(root, api, spec);
				return;
			}
		}
	}

	var api = {"path" : spec.path};
	if (!resources[spec.rootResource]) {
		root = {"apis" : new Array()};
		resources[spec.rootResource] = root;
	}

	root.apis.push(api);
	appendToApi(root, api, spec);

	//	TODO: add some xml support
	var root = spec.rootResource.replace("\.\{format\}", ".json");
	switch(spec.method){
		case "GET":
			app.get(root, callback);
			break;
		case "POST":
			app.post(root, callback);
			break;
		case "PUT":
			app.put(root, callback);
			break;
		case "DELETE":
			app.post(root, callback);
			break;
		default:
			console.log("unknown method " + spec.method);
	}
}

function addGet(app, cb, spec) {
	spec.method = "GET";
	addMethod(app, cb, spec);
}

function addPost(app, cb, spec) {
	spec.method = "POST";
	addMethod(app, cb, spec);
}

function addDelete(app, cb, spec) {
	spec.method = "DELETE";
	addMethod(app, cb, spec);
}

function addPut(app, cb, spec) {
	spec.method = "PUT";
	addMethod(app, cb, spec);
}

function appendToApi(rootResource, api, spec) {
	api.description = "not here yet";
	var validationErrors = new Array();

	if(!spec.nickname || spec.nickname.indexOf(" ")>=0){
		validationErrors.push({
			"path" : api.path,
			"error" : "invalid nickname '" + spec.nickname + "'"
		});
	} 
	// validate params
	for ( var paramKey in spec.params) {
		var param = spec.params[paramKey];
		switch (param.paramType) {
			case "path": {
				if (api.path.indexOf("{" + param.name + "}") < 0)
					validationErrors.push({
						"path" : api.path,
						"name" : param.name,
						"error" : "invalid path"
					});
				break;
			}
			case "query": {
				break;
			}
			case "post": {
				break;
			}
			default: {
				validationErrors.push({
					"path" : api.path,
					"name" : param.name,
					"error" : "invalid param type " + param.paramType
				});
			}
		}
	}

	if (validationErrors.length > 0) {
		console.log(validationErrors);
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
	for ( var key in rootResource.models) {
		// don't add the model again
		if (rootResource.models[key].name == spec.outputModel.name)
			return;
	}
	rootResource.models.push(spec.outputModel);
}

function createEnum(input) {
	if (input && input.indexOf(",") > 0) {
		// TODO: stupid! handle escaped commas
		var output = new Array();
		var array = input.split(",");
		array.forEach(function(item) {
			output.push(item);
		})
		return output;
	}
}

exports.queryParam = function(name, description, dataType, required,
		allowMultiple, allowableValues) {
	return {
		"name" : name,
		"description" : description,
		"dataType" : dataType,
		"required" : required,
		"allowMultiple" : allowMultiple,
		"allowableValues" : createEnum(allowableValues),
		"paramType" : "query"
	};
}

exports.pathParam = function(name, description, dataType, allowableValues) {
	return {
		"name" : name,
		"description" : description,
		"dataType" : dataType,
		"required" : true,
		"allowMultiple" : false,
		"allowableValues" : createEnum(allowableValues),
		"paramType" : "path"
	};
}

exports.postParam = function(name, description, dataType, allowableValues) {
	return {
		"name" : name,
		"description" : description,
		"dataType" : dataType,
		"required" : true,
		"allowableValues" : createEnum(allowableValues),
		"paramType" : "path"
	};
}

function addValidator(v) {
	validators.push(v);
}

exports.addValidator = addValidator
exports.configure = configure
exports.canAccessResource = canAccessResource
exports.resourcePath = resourcePath
exports.resourceListing = resourceListing
exports.addGet = addGet
exports.addPost = addPost
exports.addPut = addPut
exports.addDelete = addDelete
