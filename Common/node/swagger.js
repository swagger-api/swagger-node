/**
 *  Copyright 2013 Wordnik, Inc.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var formatString = ".{format}";
var resourcePath = "/api-docs" + formatString;
var jsonSuffix = ".json";
var basePath = "/";
var swaggerVersion = "1.1";
var apiVersion = "0.0";
var resources = {};
var validators = [];
var appHandler = null;
var allowedMethods = ['get', 'post', 'put', 'delete'];
var allowedDataTypes = ['string', 'int', 'long', 'double', 'boolean', 'date', 'array'];
var params = require(__dirname + '/paramTypes.js');
var allModels = {};

function configureSwaggerPaths(format, path, suffix) {
  formatString = format;
  resourcePath = path;
  jsonSuffix = suffix;
}

// Configuring swagger will set the basepath and api version for all
// subdocuments.  It should only be done once, and during bootstrap of the app
function configure(bp, av) {
  basePath = bp;
  apiVersion = av;
  setResourceListingPaths(appHandler);

  // add the GET for resource listing
  appHandler.get(resourcePath.replace(formatString, jsonSuffix), resourceListing);
  // update resources if already configured

  for(key in resources) {
    var r = resources[key];
    r.apiVersion = av;
    r.basePath = bp;
  }
}

// Convenience to set default headers in each response.
function setHeaders(res) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, api_key");
  res.header("Content-Type", "application/json; charset=utf-8");
}

// creates declarations for each resource path.
function setResourceListingPaths(app) {
  for (var key in resources) {

    // pet.json => api-docs.json/pet
    var path = baseApiFromPath(key);
    app.get(path, function(req, res) {
      // find the api base path from the request URL
      // /api-docs.json/pet => /pet.json

      var p = basePathFromApi(req.url.split('?')[0]);

      // this handles the request
      // api-docs.json/pet => pet.{format}
      var r = resources[p];
      if (!r) {
        console.error("unable to find listing");
        return stopWithError(res, {'description': 'internal error', 'code': 500});
      }
      else {
        exports.setHeaders(res);
        var data = filterApiListing(req, res, r);
        data.basePath = basePath;
        if (data.code) {
          res.send(data, data.code); }
        else {
          res.send(JSON.stringify(filterApiListing(req, res, r)));
        }
      }
    });
  }
}

function basePathFromApi(path) {
  var l = resourcePath.replace(formatString, jsonSuffix);
  var p = path.substring(l.length + 1) + formatString;
  return p;
}

function baseApiFromPath(path) {
  var p = resourcePath.replace(formatString, jsonSuffix) + "/" + path.replace(formatString, "");
  return p;
}

// Applies a filter to an api listing.  When done, the api listing will only contain
// methods and models that the user actually has access to.
function filterApiListing(req, res, r) {
  var route = req.route;
  var excludedPaths = [];
  
  if (!r || !r.apis) {
    return stopWithError(res, {'description': 'internal error', 'code': 500});
  }

  for (var key in r.apis) {
    var api = r.apis[key];

    for (var opKey in api.operations) {
      var op = api.operations[opKey];
      var path = api.path.replace(formatString, "").replace(/{.*\}/, "*");
      if (!canAccessResource(req, path, op.httpMethod)) {
        excludedPaths.push(op.httpMethod + ":" + api.path); }
    }
  }

  //  clone attributes in the resource
  var output = shallowClone(r);
  
  //  models required in the api listing
  var requiredModels = [];
  
  //  clone methods that user can access
  output.apis = [];
  var apis = JSON.parse(JSON.stringify(r.apis));
  for (var i in apis) {
    var api = apis[i];
    var clonedApi = shallowClone(api);

    clonedApi.operations = [];
    var shouldAdd = true;
    for (var o in api.operations) {
      var operation = api.operations[o];
      if (excludedPaths.indexOf(operation.httpMethod + ":" + api.path) >= 0) {
        break;
      }
      else {
        clonedApi.operations.push(JSON.parse(JSON.stringify(operation)));
        addModelsFromPost(operation, requiredModels);
        addModelsFromResponse(operation, requiredModels);
      }
    }
    //  only add cloned api if there are operations
    if (clonedApi.operations.length > 0) {
      output.apis.push(clonedApi);
    }
  }

  // add required models to output
  output.models = {};
  for (var i in requiredModels){
    var modelName = requiredModels[i];
    var model = allModels.models[modelName];
    if(model){
      output.models[requiredModels[i]] = model;
    }
  }
  //  look in object graph
  for (key in output.models) {
    var model = output.models[key];
    if (model && model.properties) {
      for (var key in model.properties) {
        var t = model.properties[key].type;

        switch (t){
        case "Array":
          if (model.properties[key].items) {
            var ref = model.properties[key].items.$ref;
            if (ref && requiredModels.indexOf(ref) < 0) {
              requiredModels.push(ref);
            }
          }
          break;
        case "string":
        case "long":
          break;
        default:
          if (requiredModels.indexOf(t) < 0) {
            requiredModels.push(t);
          }
          break;
        }
      }
    }
  }
  for (var i in requiredModels){
    var modelName = requiredModels[i];
    if(!output[modelName]) {
      var model = allModels.models[modelName];
      if(model){
        output.models[requiredModels[i]] = model;
      }
    }
  }
  return output;
}

// Add model to list and parse List[model] elements
function addModelsFromPost(operation, models){
  if(operation.parameters) {
    for(var i in operation.parameters) {
      var param = operation.parameters[i];
      if(param.paramType == "body" && param.dataType) {
        var model = param.dataType.replace(/^List\[/,"").replace(/\]/,"");
        if(models.indexOf(model) < 0) {
          models.push(responseModel);
        }
        models.push(param.dataType);
      }
    }
  }

  var responseModel = operation.responseClass;
  if (responseModel) {
    responseModel = responseModel.replace(/^List\[/,"").replace(/\]/,"");
    if (models.indexOf(responseModel) < 0) {
      models.push(responseModel); 
    }
  }
}


// Add model to list and parse List[model] elements
function addModelsFromResponse(operation, models){
  var responseModel = operation.responseClass;
  if (responseModel) {
    responseModel = responseModel.replace(/^List\[/,"").replace(/\]/,"");
    if (models.indexOf(responseModel) < 0) {
      models.push(responseModel); 
    }
  }
}

// clone anything but objects to avoid shared references
function shallowClone(obj) {
  var cloned = {};
  for (var i in obj) {
    if (typeof (obj[i]) != "object") {
      cloned[i] = obj[i];
    }
  }
  return cloned;
}

// function for filtering a resource.  override this with your own implementation.
// if consumer can access the resource, method returns true.
function canAccessResource(req, path, httpMethod) {
  for (var i in validators) {
    if (!validators[i](req,path,httpMethod))
      return false;
  }
  return true;
}

/**
 * returns the json representation of a resource
 * 
 * @param request
 * @param response
 */
function resourceListing(req, res) {
  var r = {
    "apiVersion" : apiVersion, 
    "swaggerVersion" : swaggerVersion, 
    "basePath" : basePath, 
    "apis" : []
  };

  for (var key in resources) {
    var p = resourcePath + "/" + key.replace(formatString,"");
    r.apis.push({"path": p, "description": "none"}); 
  }

  exports.setHeaders(res);
  res.write(JSON.stringify(r));
  res.end();
}

// Adds a method to the api along with a spec.  If the spec fails to validate, it won't be added
function addMethod(app, callback, spec) {
  var apiRootPath = spec.path.split("/")[1];
  var root = resources[apiRootPath];

  if (root && root.apis) {
    // this path already exists in swagger resources
    for (var key in root.apis) {
      var api = root.apis[key];
      if (api && api.path == spec.path && api.method == spec.method) {
        // add operation & return
        appendToApi(root, api, spec);
        return;
      }
    }
  }

  var api = {"path" : spec.path};
  if (!resources[apiRootPath]) {
    if (!root) {
      // 
      var resourcePath = "/" + apiRootPath.replace(formatString, ""); 
      root = {
        "apiVersion" : apiVersion, "swaggerVersion": swaggerVersion, "basePath": basePath, "resourcePath": resourcePath, "apis": [], "models" : []
      };
    }
    resources[apiRootPath] = root;
  }

  root.apis.push(api);
  appendToApi(root, api, spec);

  //  convert .{format} to .json, make path params happy
  var fullPath = spec.path.replace(formatString, jsonSuffix).replace(/\/{/g, "/:").replace(/\}/g,"");
  var currentMethod = spec.method.toLowerCase();
  if (allowedMethods.indexOf(currentMethod)>-1) {
    app[currentMethod](fullPath, function(req,res) {
      exports.setHeaders(res);

      // todo: needs to do smarter matching against the defined paths
      var path = req.url.split('?')[0].replace(jsonSuffix, "").replace(/{.*\}/, "*");
      if (!canAccessResource(req, path, req.method)) {
        res.send(JSON.stringify({"description":"forbidden", "code":403}), 403);
      } else {    
        try {
          callback(req,res); 
        }
        catch (ex) {
          if (ex.code && ex.description)
            res.send(JSON.stringify(ex), ex.code); 
          else {
            console.error(spec.method + " failed for path '" + require('url').parse(req.url).href + "': " + ex);
            res.send(JSON.stringify({"description":"unknown error","code":500}), 500);
          }
        }
      }
    }); 
  } else {
    console.error('unable to add ' + currentMethod.toUpperCase() + ' handler');  
    return;
  }
}

// Set expressjs app handler
function setAppHandler(app) {
  appHandler = app;
}

// Add swagger handlers to express 
function addHandlers(type, handlers) {
  for (var i = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    handler.spec.method = type;
    addMethod(appHandler, handler.action, handler.spec);
  }
}

// Discover swagger handler from resource
function discover(resource) {
  for (var key in resource) {
    if (resource[key].spec && resource[key].spec.method && allowedMethods.indexOf(resource[key].spec.method.toLowerCase())>-1) {
      addMethod(appHandler, resource[key].action, resource[key].spec); 
    } 
    else
      console.error('auto discover failed for: ' + key); 
  }
}

// Discover swagger handler from resource file path
function discoverFile(file) {
  return discover(require(file));
}

// adds get handler
function addGet() {
  addHandlers('GET', arguments);
  return this;
}

// adds post handler
function addPost() {
  addHandlers('POST', arguments);
  return this;
}

// adds delete handler
function addDelete() { 
  addHandlers('DELETE', arguments);
  return this;
}

// adds put handler
function addPut() {
  addHandlers('PUT', arguments);
  return this;
}

// adds models to swagger
function addModels(models) {
  if(!allModels['models']) {
    allModels = models;
  } else {
    for(k in models['models']) {
      allModels['models'][k] = models['models'][k];
    }
  }
  return this;
}

function wrap(callback, req, resp){
  callback(req,resp);
}

// appends a spec to an existing operation
function appendToApi(rootResource, api, spec) {
  if (!api.description) {
    api.description = spec.description; 
  }
  var validationErrors = [];

  if(!spec.nickname || spec.nickname.indexOf(" ")>=0){
    //  nicknames don't allow spaces
    validationErrors.push({"path": api.path, "error": "invalid nickname '" + spec.nickname + "'"});
  } 
  // validate params
  for ( var paramKey in spec.params) {
    var param = spec.params[paramKey];
    if(param.allowableValues) {
      var avs = param.allowableValues.toString();
      var type = avs.split('[')[0];
      if(type == 'LIST'){
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[','').replace('\]', '').split(',');
        param.allowableValues = {valueType: type, values: values};
      }
      else if (type == 'RANGE') {
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[','').replace('\]', '').split(',');
        param.allowableValues = {valueType: type, min: values[0], max: values[1]};
      }
    }
    
    switch (param.paramType) {
      case "path":
        if (api.path.indexOf("{" + param.name + "}") < 0) {
          validationErrors.push({"path": api.path, "name": param.name, "error": "invalid path"});
        }
        break;
      case "query":
        break;
      case "body":
        break;
      default:
        validationErrors.push({"path": api.path, "name": param.name, "error": "invalid param type " + param.paramType});
        break;
    }
  }

  if (validationErrors.length > 0) {
    console.error(validationErrors);
    return;
  }
  
  if (!api.operations) {
    api.operations = []; }

  // TODO: replace if existing HTTP operation in same api path
  var op = {
    "parameters" : spec.params,
    "httpMethod" : spec.method,
    "notes" : spec.notes,
    "errorResponses" : spec.errorResponses,
    "nickname" : spec.nickname,
    "summary" : spec.summary
  };
  
  if (spec.responseClass) {
    op.responseClass = spec.responseClass; 
  }
  else {
    op.responseClass = "void";
  }
  api.operations.push(op);

  if (!rootResource.models) {
    rootResource.models = {}; 
  }
}

function addValidator(v) {
  validators.push(v);
}

// Create Error JSON by code and text
function error(code, description) {
  return {"code" : code, "description" : description};
}

// Stop express ressource with error code
function stopWithError(res, error) {
  exports.setHeaders(res);
  if (error && error.description && error.code)
    res.send(JSON.stringify(error), error.code);
  else
    res.send(JSON.stringify({'description': 'internal error', 'code': 500}), 500);
}

// Export most needed error types for easier handling
exports.errors = {
  'notFound': function(field, res) { 
    if (!res) { 
      return {"code": 404, "description": field + ' not found'}; } 
    else { 
      res.send({"code": 404, "description": field + ' not found'}, 404); } 
  },
  'invalid': function(field, res) { 
    if (!res) { 
      return {"code": 400, "description": 'invalid ' + field}; } 
    else { 
      res.send({"code": 400, "description": 'invalid ' + field}, 404); } 
  },
  'forbidden': function(res) {
    if (!res) { 
      return {"code": 403, "description": 'forbidden' }; } 
    else { 
      res.send({"code": 403, "description": 'forbidden'}, 403); }
  }
};

exports.params = params;
exports.queryParam = exports.params.query;
exports.pathParam = exports.params.path;
exports.postParam = exports.params.post;
exports.getModels = allModels;

exports.error = error;
exports.stopWithError = stopWithError;
exports.stop = stopWithError;
exports.addValidator = addValidator;
exports.configure = configure;
exports.canAccessResource = canAccessResource;
exports.resourcePath = resourcePath;
exports.resourceListing = resourceListing;
exports.setHeaders = setHeaders;
exports.addGet = addGet;
exports.addPost = addPost;
exports.addPut = addPut;
exports.addDelete = addDelete;
exports.addGET = addGet;
exports.addPOST = addPost;
exports.addPUT = addPut;
exports.addDELETE = addDelete;
exports.addModels = addModels;
exports.setAppHandler = setAppHandler;
exports.discover = discover;
exports.discoverFile = discoverFile;
exports.configureSwaggerPaths = configureSwaggerPaths;
exports.setHeaders = setHeaders;