var resourcePath = "/resources.json";
var basePath = "/";
var swaggerVersion = "1.1-SNAPSHOT.121026";
var apiVersion = "0.0";
var resources = {};
var validators = [];
var appHandler = null;
var allowedMethods = ['get', 'post', 'put', 'delete'];
var allowedDataTypes = ['string', 'int', 'long', 'double', 'boolean', 'date', 'array'];
var Randomizer = require(__dirname + '/randomizer.js');
var params = require(__dirname + '/paramTypes.js');

/**
 * Initialize Randomizer Caching
 */
var RandomStorage = {};
for (var i = 0; i < allowedDataTypes.length; i++) {
  RandomStorage[allowedDataTypes[i]] = {}; }

/**
 * sets the base path, api version
 * 
 * @param app
 * @param bp
 * @param av
 */
function configure(bp, av) {
  basePath = bp;
  apiVersion = av;
  setResourceListingPaths(appHandler);
  appHandler.get(resourcePath, resourceListing);
}

/**
 * creates declarations for each resource
 * 
 * @param app
 */
function setResourceListingPaths(app) {
  for (var key in resources) {
    app.get("/" + key.replace("\.\{format\}", ".json"), function(req, res) {
      var r = resources[req.url.substr(1).split('?')[0].replace('.json', '.{format}')];
      if (!r) {
        return stopWithError(res, {'description': 'internal error', 'code': 500}); }
      else {
        res.header('Access-Control-Allow-Origin', "*");
        res.header("Content-Type", "application/json; charset=utf-8");
        var key = req.url.substr(1).replace('.json', '.{format}').split('?')[0];
        var data = applyFilter(req, res, resources[key]);
        data.basePath = basePath;
        if (data.code) {
          res.send(data, data.code); }
        else {
          res.header('Access-Control-Allow-Origin', "*");
          res.header("Content-Type", "application/json; charset=utf-8");
          res.send(JSON.stringify(applyFilter(req, res, r)));
        }
      }
    });
  }
}

/**
 * generate random date for type
 * 
 * @param type type of data (must be defined in allowedDataTypes)
 * @param withRandom fill with random data 
 * @return value
 */
function randomDataByType(type, withRandom, subType) {
  type = type.toLowerCase();
  if (allowedDataTypes.indexOf(type)<0) {
    return null; }
  return Randomizer[type](subType);
}

/**
 * Get cache for type and identifier
 * @param type
 * @param id
 * @param key
 * @return value
 */
function getCache(type, id, key) {
  if (id && id != -1 && RandomStorage[type] && RandomStorage[type][key+id]) {
    return RandomStorage[type][key + id]; }
  else {
    return null; }
}

/**
 * Set cache for type and identifier
 * @param type
 * @param id
 * @param key
 * @param value
 */
function setCache(curType, id, key, value) {
  if (id && id != -1 && RandomStorage[curType]) {
    RandomStorage[curType][key + id] = value; }
}

/**
 * try to generate object from model defintion
 * @param model
 * @param withData fill model with data
 * @param withRandom generate random values
 * @return object
 */
function containerByModel(model, withData, withRandom) {
  var item = {};
  for (key in model.properties) {
    var curType = model.properties[key].type.toLowerCase();

    var value = '';
    if (withData && withData[key]) {
      value = withData[key]; }
    if (value == '' && withRandom) {  
      var cache = getCache(curType, withRandom, key);
      if (cache) {
        value = cache; } 
      else {
        if (model.properties[key].enum) {
          value = model.properties[key].enum[Randomizer.intBetween(0, model.properties[key].enum.length-1)]; } 
        else {
          var subType = false;
          if (model.properties[key].items && model.properties[key].items.type) {
            subType = model.properties[key].items.type; }
          var curKey = key;
          value = randomDataByType(curType, withRandom, subType);
          var key = curKey;
        }
      }
      setCache(curType, withRandom, key, value);
    }
    
    if (value == '' && curType == 'array') {
      value = []; }
    
    item[key] = value;
  } 
  
  return item;
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
    return stopWithError(res, {'description': 'internal error', 'code': 500}); }

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
    for (var i in apis) {
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

/**
 * Add model to list and parse List[model] elements
 * @param operation
 * @param models
 */
function addModelsFromResponse(operation, models){
  var responseModel = operation.responseClass;
  if (responseModel) {
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
  var r = {"apis": [], "basePath": basePath, "swaggerVersion": swaggerVersion, "apiVersion" : apiVersion};
  
  for (var key in resources) {
    r.apis.push({"path": "/" + key, "description": "none"}); }
    
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
    if (!root) {
      root = {"apis" : []}; }
    resources[rootPath] = root;
  }

  root.apis.push(api);
  appendToApi(root, api, spec);

  //  TODO: add some XML support
  //  convert .{format} to .json, make path params happy
  var fullPath = spec.path.replace("\.\{format\}", ".json").replace(/\/{/g, "/:").replace(/\}/g,"");
  var currentMethod = spec.method.toLowerCase();
  if (allowedMethods.indexOf(currentMethod)>-1) {
    app[currentMethod](fullPath, function(req,res) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Content-Type", "application/json; charset=utf-8");    
      if (!canAccessResource(req, req.url.substr(1).split('?')[0].replace('.json', '.*'), req.method)) {
        res.send(JSON.stringify({"description":"forbidden", "code":403}), 403);
      } else {    
        try {
          callback(req,res); }
        catch (ex) {
          if (ex.code && ex.description) {
            res.send(JSON.stringify(ex), ex.code); }
          else {
            console.error(spec.method + " failed for path '" + require('url').parse(req.url).href + "': " + ex);
            res.send(JSON.stringify({"description":"unknown error","code":500}), 500);
          }
        }
      }
    }); 
  } else {
    console.log('unable to add ' + currentMethod.toUpperCase() + ' handler');  
    return;
  }
}

/**
 * Set expressjs app handler
 * @param app
 */
function setAppHandler(app) {
  appHandler = app;
}

/**
 * Add swagger handlers to express 
 * @param type http method
 * @param handlers list of handlers to be added
 */
function addHandlers(type, handlers) {
  for (var i = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    handler.spec.method = type;
    addMethod(appHandler, handler.action, handler.spec);
  }
}

/**
 * Discover swagger handler from resource
 */
function discover(resource) {
  for (var key in resource) {
    if (resource[key].spec && resource[key].spec.method && allowedMethods.indexOf(resource[key].spec.method.toLowerCase())>-1) {
      addMethod(appHandler, resource[key].action, resource[key].spec); } 
    else {
      console.log('auto discover failed for: ' + key); }
  }
}

/**
 * Discover swagger handler from resource file path
 */
function discoverFile(file) {
  return discover(require(file));
}

function addGet() {
  addHandlers('GET', arguments);
  return this;
}

function addPost() {
  addHandlers('POST', arguments);
  return this;
}

function addDelete() { 
  addHandlers('DELETE', arguments);
  return this;
}

function addPut() {
  addHandlers('PUT', arguments);
  return this;
}

function wrap(callback, req, resp){
  callback(req,resp);
}

function appendToApi(rootResource, api, spec) {
  if (!api.description) {
    api.description = spec.description; }
  var validationErrors = [];

  if(!spec.nickname || spec.nickname.indexOf(" ")>=0){
    //  nicknames don't allow spaces
    validationErrors.push({"path": api.path, "error": "invalid nickname '" + spec.nickname + "'"});
  } 
  // validate params
  for ( var paramKey in spec.params) {
    var param = spec.params[paramKey];
    switch (param.paramType) {
      case "path":
        if (api.path.indexOf("{" + param.name + "}") < 0) {
          validationErrors.push({"path": api.path, "name": param.name, "error": "invalid path"}); }
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
    console.log(validationErrors);
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
  
  if (spec.outputModel) {
    op.responseClass = spec.outputModel.name; }
  api.operations.push(op);

  if (!rootResource.models) {
    rootResource.models = {}; }
  if (spec.outputModel && !rootResource.models[spec.outputModel.responseClass.id]) {
    rootResource.models[spec.outputModel.responseClass.id] = {'properties': spec.outputModel.responseClass.properties}; }
}

function addValidator(v) {
  validators.push(v);
}

/**
 * Create Error JSON by code and text
 * @param int code
 * @param string description
 * @return obj
 */
function error(code, description) {
  return {"code" : code, "description" : description};
}

/**
 * Stop express ressource with error code
 * @param obj res expresso response
 * @param obj error error object with code and description
 */
function stopWithError(res, error) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header("Content-Type", "application/json; charset=utf-8");
  
  if (error && error.description && error.code) {
    res.send(JSON.stringify(error), error.code); } 
  else {
    res.send(JSON.stringify({'description': 'internal error', 'code': 500}), 500); }
};

/**
 * Export most needed error types for easier handling
 */
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

exports.error = error;
exports.stopWithError = stopWithError;
exports.stop = stopWithError;
exports.addValidator = addValidator;
exports.configure = configure;
exports.canAccessResource = canAccessResource;
exports.resourcePath = resourcePath;
exports.resourceListing = resourceListing;
exports.addGet = addGet;
exports.addPost = addPost;
exports.addPut = addPut;
exports.addDelete = addDelete;
exports.setAppHandler = setAppHandler;
exports.discover = discover;
exports.discoverFile = discoverFile;
exports.containerByModel = containerByModel;
exports.Randomizer = Randomizer;
