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
  app.get(resourcePath, resourceListing);
}

/**
 * creates declarations for each resource
 * 
 * @param app
 */
function setResourceListingPaths(app) {
  for (var key in resources) {
    app.get("/" + key.replace("\.\{format\}", ".json"), function(req, res) {
      res.header('Access-Control-Allow-Origin', "*");
      res.header("Content-Type", "application/json; charset=utf-8");
      var data = applyFilter(req, res, resources[req.url.substr(1).replace('.json', '.{format}')]);
      if (data.code) {
        res.send(data, data.code); } 
      else {      
        res.send(JSON.stringify(data)); }
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
  var route = req.route;
  var excludedPaths = new Array();
  
  if (!r || !r.apis) {
    return error(500, 'internal error'); }
  
  for (var key in r.apis) {
    var api = r.apis[key];
    for (var opKey in api.operations) {
      var op = api.operations[opKey];
      var path = api.path.replace(/{.*\}/, "*");
      if (!canAccessResource(req, route + path, op.httpMethod)) {
        excludedPaths.push(op.httpMethod + ":" + api.path); }
    }
  }
  
  //  only filter if there are paths to exclude
  if (excludedPaths.length > 0) {
    //  clone attributes if any
    var output = shallowClone(r);

    //  clone models
    var requiredModels = Array();
    
    //  clone methods that have access
    output.apis = new Array();
    var apis = JSON.parse(JSON.stringify(r.apis));
    for (var i in apis){
      var api = apis[i];
      var clonedApi = shallowClone(api);
      clonedApi.operations = new Array();
      var shouldAdd = true;
      for (var o in api.operations){
        var operation = api.operations[o];
        if (excludedPaths.indexOf(operation.httpMethod + ":" + api.path)>=0) {
          break; }
        else {
          clonedApi.operations.push(JSON.parse(JSON.stringify(operation)));
          addModelsFromResponse(operation, requiredModels);
        }
      }
      
      if (clonedApi.operations.length > 0) {
        //  only add cloned api if there are operations
        output.apis.push(clonedApi);

        //  add only required models
        output.models = new Array();
        for (var i in requiredModels){
          var model = r.models[i];
          output.models.push(model);
        }
        //  look in object graph
        requiredModels = new Array();
        for (var i in output.models) {
          var model = output.models[i];
          if (model && model.responseClass.properties) {
            for (var key in model.responseClass.properties) {
              var t = model.responseClass.properties[key].type;
              switch (t){
              case "array":
                if (model.responseClass.properties[key].items) {
                  var ref = model.responseClass.properties[key].items.$ref;
                  if (ref && requiredModels.indexOf(ref) < 0) {
                    requiredModels.push(ref); }
                }
                break;
              case "string":
              case "long":
                break;
              default:
                if (requiredModels.indexOf(t) < 0) {
                  requiredModels.push(t); }
                break;
              }
            }
          }
        }
      }
    }
    return output;
  } else {
    return r;
  }
}

function addModelsFromResponse(operation, models){
  var responseModel = operation.responseClass;
  if (responseModel) {
    //  strip List[...] to locate the models
    responseModel = responseModel.replace(/^List\[/,"").replace(/\]/,"");
    if (models.indexOf(responseModel) < 0) {
      models.push(responseModel); }
  }
}

function shallowClone(obj) {
  var cloned = new Object();
  for (var i in obj) {
    if (typeof (obj[i]) != "object") {
      cloned[i] = obj[i]; }
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
  for (var i in validators) {
    if (!validators[i](req,path,httpMethod)) {
      return false; }
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
  for (var key in resources) {
    r.apis.push({
      "path" : "/" + key,
      "description" : "none"
    });
  }
  response.header('Access-Control-Allow-Origin', "*");
  response.header("Content-Type", "application/json; charset=utf-8");
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
  var rootPath = spec.path.split("/")[1];
  var root = resources[rootPath];
  
  if (root && root.apis) {
    for (var key in root.apis) {
      var api = root.apis[key];
      if (api && api.path == spec.path && api.method == spec.method) {
        // found matching path and method, add & return
        appendToApi(root, api, spec);
        return;
      }
    }
  }

  var api = {"path" : spec.path};
  if (!resources[rootPath]) {
    root = {"apis" : new Array()};
    resources[rootPath] = root;
  }

  root.apis.push(api);
  appendToApi(root, api, spec);

  //  TODO: add some XML support
  //  convert .{format} to .json, make path params happy
  var fullPath = spec.path.replace("\.\{format\}", ".json").replace(/\/{/, "/:").replace("\}","");
  var allowedMethods = ['get', 'post', 'put', 'delete'];
  var currentMethod = spec.method.toLowerCase();
  if (allowedMethods.indexOf(currentMethod)>-1) {
	  app[spec.method.toLowerCase()](fullPath, function(req,resp){
		resp.header("Access-Control-Allow-Origin", "*");
		resp.header("Content-Type", "application/json; charset=utf-8");
		try {
		  callback(req,resp); }
		catch(ex) {
		  if (ex.code && ex.description){
			resp.send(JSON.stringify(ex), ex.code); }
		  else {
			console.error(spec.method + " failed for path '" + fullPath + "': " + ex);
			resp.send(JSON.stringify({"description":"unknown error","code":500})) 
		  }
		}
	  }); 
  } else {
  	console.log('unable to add ' + currentMethod.toUpperCase() + ' handler');  
  	return;
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

function wrap(callback, req, resp){
  callback(req,resp);
}

function appendToApi(rootResource, api, spec) {
  if(!api.description) api.description = spec.description;
  var validationErrors = new Array();

  if(!spec.nickname || spec.nickname.indexOf(" ")>=0){
    //  nicknames don't allow spaces
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
      case "body": {
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
  var op = {
    "parameters" : spec.params,
    "httpMethod" : spec.method,
    "notes" : spec.notes,
    "errorResponses" : spec.errorResponses,
    "nickname" : spec.nickname,
    "summary" : spec.summary
  };
  if(spec.outputModel){
    op.responseClass = spec.outputModel.name;
  }
  api.operations.push(op);

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
    if (spec.outputModel && rootResource.models[key].name == spec.outputModel.name)
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
    allowMultiple, allowableValues, defaultValue) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : required,
    "allowMultiple" : allowMultiple,
    "allowableValues" : createEnum(allowableValues),
    "defaultValue" : defaultValue,
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

exports.postParam = function(description, dataType) {
  return {
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "paramType" : "body"
  };
}

function addValidator(v) {
  validators.push(v);
}

function error(code, description) {
  return {
    "description" : description,
    "code" : code
  };
}

exports.error = error
exports.addValidator = addValidator
exports.configure = configure
exports.canAccessResource = canAccessResource
exports.resourcePath = resourcePath
exports.resourceListing = resourceListing
exports.addGet = addGet
exports.addPost = addPost
exports.addPut = addPut
exports.addDelete = addDelete
