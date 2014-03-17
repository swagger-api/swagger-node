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
var _ = require('lodash');
var formatString = ".{format}";
var resourcePath = "/api-docs" + formatString;
var jsonSuffix = ".json";
var basePath = "/";
var apiInfo = null;
var authorizations = null;
var swaggerVersion = "1.2";
var apiVersion = "1.0";
var resources = {};
var validators = [];
var appHandler = null;
var allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
var allowedDataTypes = ['string', 'integer', 'boolean', 'array'];
var params = require(__dirname + '/paramTypes.js');
var allModels = {};

// Default error handler
var errorHandler = function (req, res, error) {
  if (error.code && error.message)
    res.send(JSON.stringify(error), error.code);
  else {
    console.error(req.method + " failed for path '" + require('url').parse(req.url).href + "': " + error);
    res.send(JSON.stringify({
      "message": "unknown error",
      "code": 500
    }), 500);
  }
};

function configureSwaggerPaths(format, path, suffix) {
  if(path.indexOf("/") != 0) path = "/" + path;
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

  _.forOwn(resources, function (resource) {
    resource.apiVersion = av;
    resource.basePath = bp;
  });
}

// Convenience to set default headers in each response.

function setHeaders(res) {
  res.header("Access-Control-Allow-Headers", "Content-Type, api_key");
  res.header("Content-Type", "application/json; charset=utf-8");
}

// creates declarations for each resource path.

function setResourceListingPaths(app) {
  _.forOwn(resources, function (resource, key) {

    // pet.json => api-docs.json/pet
    var path = baseApiFromPath(key);
    app.get(path, function (req, res) {
      // find the api base path from the request URL
      // /api-docs.json/pet => /pet.json

      var p = basePathFromApi(req.url.split('?')[0]);

      // this handles the request
      // api-docs.json/pet => pet.{format}
      var r = resources[p] || resources[p.replace(formatString, "")];
      if (!r) {
        console.error("unable to find listing");
        return stopWithError(res, {
          'message': 'internal error',
          'code': 500
        });
      } else {
        exports.setHeaders(res);
        var data = filterApiListing(req, res, r);
        data.basePath = basePath;
        if (data.code) {
          res.send(data, data.code);
        } else {
          res.send(JSON.stringify(data));
        }
      }
    });
  });
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

function addPropertiesToRequiredModelsFromDeepModel(modelRef, requiredModels) {
  if (modelRef) {
    var model = allModels[modelRef];
    if (model.properties) {
      addPropertiesToRequiredModels(model.properties, requiredModels);
    }
  }
}

function addPropertiesToRequiredModels(properties, requiredModels) {
  _.forOwn(properties, function (property) {
    var type = property["type"];
    if(type) {
      switch (type) {
      case "array":
        if (property.items) {
          var ref = property.items.$ref;
          if (ref && requiredModels.indexOf(ref) < 0) {
            requiredModels.push(ref);
            addPropertiesToRequiredModelsFromDeepModel(ref, requiredModels);
          }
        }
        break;
      case "string":
      case "integer":
        break;
      default:
        if (requiredModels.indexOf(type) < 0) {
          requiredModels.push(type);
        }
        break;
      }
    }
    else {
      var ownRef = property["$ref"];
      if (ownRef) {
        requiredModels.push(ownRef);
        addPropertiesToRequiredModelsFromDeepModel(ownRef, requiredModels);
      }
    }
    if (property.properties) {
      addPropertiesToRequiredModels(property.properties, requiredModels);
    }
  });
}

// Applies a filter to an api listing.  When done, the api listing will only contain
// methods and models that the user actually has access to.

function filterApiListing(req, res, r) {
  var excludedPaths = [];

  if (!r || !r.apis) {
    return stopWithError(res, {
      'message': 'internal error',
      'code': 500
    });
  }

  _.forOwn(r.apis, function (api) {
    for (var opKey in api.operations) {
      if (!api.operations.hasOwnProperty(opKey)) {
        continue;
      }
      var op = api.operations[opKey];
      var path = api.path.replace(formatString, "").replace(/{.*\}/, "*");
      if (!canAccessResource(req, path, op.method)) {
        excludedPaths.push(op.method + ":" + api.path);
      }
    }
  });

  //  clone attributes in the resource
  var output = shallowClone(r);

  // clone arrays for
  if(r["produces"]) output.produces = r["produces"].slice(0);
  if(r["consumes"]) output.consumes = r["consumes"].slice(0);
  if(r["authorizations"]) output.authorizations = r["authorizations"].slice(0);
  if(r["protocols"]) output.protocols = r["protocols"].slice(0);

  //  models required in the api listing
  var requiredModels = [];

  //  clone methods that user can access
  output.apis = [];
  var apis = JSON.parse(JSON.stringify(r.apis));
  _.forOwn(apis, function (api) {
    var clonedApi = shallowClone(api);

    clonedApi.operations = [];
    _.forOwn(api.operations, function (operation) {
      if (excludedPaths.indexOf(operation.method + ":" + api.path) == -1) {
        clonedApi.operations.push(JSON.parse(JSON.stringify(operation)));
        addModelsFromBody(operation, requiredModels);
        addModelsFromResponse(operation, requiredModels);
      }
    });
    //  only add cloned api if there are operations
    if (clonedApi.operations.length > 0) {
      output.apis.push(clonedApi);
    }
  });

  // add required models to output
  output.models = {};
  _.forOwn(requiredModels, function (modelName) {
    var model = allModels[modelName];
    if (model) {
      output.models[modelName] = model;
    }
  });

  //  look in object graph
  _.forOwn(output.models, function (model) {
    if (model && model.properties) {
      addPropertiesToRequiredModels(model.properties, requiredModels);
    }
  });
  _.forOwn(requiredModels, function (modelName) {
    if (!output[modelName]) {
      var model = allModels[modelName];
      if (model) {
        output.models[modelName] = model;
      }
    }
  });

  return output;
}

// Add model to list and parse List[model] elements

function addModelsFromBody(operation, models) {
  if (operation.parameters) {
    _.forOwn(operation.parameters, function (param) {
      if (param.paramType == "body" && param.type) {
        var model = param.type.replace(/^List\[/, "").replace(/\]/, "");
        models.push(model);
      }
    });
  }
}

// Add model to list and parse List[model] elements

function addModelsFromResponse(operation, models) {
  var responseModel = operation.type;
  if(responseModel === "array" && operation.items) {
    var items = operation.items;
    if(items["$ref"]) {
      models.push(items["$ref"]);
    }
    else if (items.type && allowedDataTypes.indexOf(items.type) == -1) {
      models.push(items["type"]);
    }
  }
  // if not void or a json-schema type, add the model
  else if (responseModel != "void" && allowedDataTypes.indexOf(responseModel) == -1) {
    models.push(responseModel);
  }
}

// clone anything but objects to avoid shared references
function shallowClone(obj) {
  var cloned = {};
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) {
      continue;
    }
    if (typeof (obj[i]) != "object") {
      cloned[i] = obj[i];
    }
  }
  return cloned;
}

// function for filtering a resource.  override this with your own implementation.
// if consumer can access the resource, method returns true.

function canAccessResource(req, path, method) {
  for (var i = 0; i < validators.length; i++) {
    var validator = validators[i];
    if (_.isFunction(validator) && !validator(req, path, method)) {
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

function resourceListing(req, res) {
  var r = {
    "apiVersion": apiVersion,
    "swaggerVersion": swaggerVersion,
    "apis": []
  };

  if(authorizations != null)
    r["authorizations"] = authorizations;

  if(apiInfo != null)
    r["info"] = apiInfo;

  _.forOwn(resources, function (value, key) {
    var p = "/" + key.replace(formatString, "");
    r.apis.push({
      "path": p,
      "description": value.description
    });
  });

  exports.setHeaders(res);
  res.write(JSON.stringify(r));
  res.end();
}

// Adds a method to the api along with a spec.  If the spec fails to validate, it won't be added

function addMethod(app, callback, spec) {
  var apiRootPath = spec.path.split(/[\/\(]/)[1];
  var root = resources[apiRootPath];

  if (root && root.apis) {
    // this path already exists in swagger resources
    _.forOwn(root.apis, function (api) {
      if (api && api.path == spec.path && api.method == spec.method) {
        // add operation & return
        appendToApi(root, api, spec);
        return;
      }
    });
  }

  var api = {
    "path": spec.path
  };
  if (!resources[apiRootPath]) {
    if (!root) {
      //
      var resourcePath = "/" + apiRootPath.replace(formatString, "");
      root = {
        "apiVersion": apiVersion,
        "swaggerVersion": swaggerVersion,
        "basePath": basePath,
        "resourcePath": resourcePath,
        "apis": [],
        "models": []
      };
    }
    resources[apiRootPath] = root;
  }

  root.apis.push(api);
  appendToApi(root, api, spec);

  //  convert .{format} to .json, make path params happy
  var fullPath = spec.path.replace(formatString, jsonSuffix).replace(/\/{/g, "/:").replace(/\}/g, "");
  var currentMethod = spec.method.toLowerCase();
  if (allowedMethods.indexOf(currentMethod) > -1) {
    app[currentMethod](fullPath, function (req, res, next) {
      exports.setHeaders(res);

      // todo: needs to do smarter matching against the defined paths
      var path = req.url.split('?')[0].replace(jsonSuffix, "").replace(/{.*\}/, "*");
      if (!canAccessResource(req, path, req.method)) {
        res.send(JSON.stringify({
          "message": "forbidden",
          "code": 403
        }), 403);
      } else {
        try {
          callback(req, res, next);
        } catch (error) {
          if (typeof errorHandler === "function") {
            errorHandler(req, res, error);
          } else if (errorHandler === "next") {
            next(error);
          } else {
            throw error;
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

// Change error handler
// Error handler should be a function that accepts parameters req, res, error

function setErrorHandler(handler) {
  errorHandler = handler;
}

// Add swagger handlers to express

function addHandlers(type, handlers) {
  _.forOwn(handlers, function (handler) {
    handler.spec.method = type;
    addMethod(appHandler, handler.action, handler.spec);
  });
}

// Discover swagger handler from resource

function discover(resource) {
  _.forOwn(resource, function (handler, key) {
    if (handler.spec && handler.spec.method && allowedMethods.indexOf(handler.spec.method.toLowerCase()) > -1) {
      addMethod(appHandler, handler.action, handler.spec);
    } else
      console.error('auto discover failed for: ' + key);
  });
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

// adds patch handler

function addPatch() {
  addHandlers('PATCH', arguments);
  return this;
}

// adds models to swagger

function addModels(models) {
  models = _.cloneDeep(models);
  if (!allModels) {
    allModels = models;
  } else {
    _.forOwn(models, function (model, key) {
      allModels[key] = model;
    });
  }
  return this;
}

function wrap(callback, req, resp) {
  callback(req, resp);
}

// appends a spec to an existing operation

function appendToApi(rootResource, api, spec) {
  var validationErrors = [];

  if (!spec.nickname || spec.nickname.indexOf(" ") >= 0) {
    //  nicknames don't allow spaces
    validationErrors.push({
      "path": api.path,
      "error": "invalid nickname '" + spec.nickname + "'"
    });
  }
  // validate params
  _.forOwn(spec.parameters, function (parameter) {

    switch (parameter.paramType) {
    case "path":
      if (api.path.indexOf("{" + parameter.name + "}") < 0) {
        validationErrors.push({
          "path": api.path,
          "name": parameter.name,
          "error": "invalid path"
        });
      }
      break;
    case "query":
      break;
    case "body":
      break;
    case "form":
      break;
    case "header":
      break;
    default:
      validationErrors.push({
        "path": api.path,
        "name": parameter.name,
        "error": "invalid param type " + parameter.paramType
      });
      break;
    }
  });

  if (validationErrors.length > 0) {
    console.error(validationErrors);
    return;
  }

  if (!api.operations) {
    api.operations = [];
  }

  // TODO: replace if existing HTTP operation in same api path
  var op = {
    "parameters": spec.parameters,
    "method": spec.method,
    "notes": spec.notes,
    "responseMessages": spec.responseMessages,
    "nickname": spec.nickname,
    "summary": spec.summary,
    "consumes" : spec.consumes,
    "produces" : spec.produces
  };

  // Add custom fields.
  op = _.extend({}, spec, op);

  if (!spec.type) {
    op.type = "void";
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
  return {
    "code": code,
    "message": description
  };
}

// Stop express ressource with error code

function stopWithError(res, error) {
  exports.setHeaders(res);
  if (error && error.message && error.code)
    res.send(JSON.stringify(error), error.code);
  else
    res.send(JSON.stringify({
      'message': 'internal error',
      'code': 500
    }), 500);
}

function setApiInfo(data) {
  apiInfo = data;
}

function setAuthorizations(data) {
  authorizations = data;
}

// Export most needed error types for easier handling
exports.errors = {
  'notFound': function (field, res) {
    if (!res) {
      return {
        "code": 404,
        "message": field + ' not found'
      };
    } else {
      res.send({
        "code": 404,
        "message": field + ' not found'
      }, 404);
    }
  },
  'invalid': function (field, res) {
    if (!res) {
      return {
        "code": 400,
        "message": 'invalid ' + field
      };
    } else {
      res.send({
        "code": 400,
        "message": 'invalid ' + field
      }, 404);
    }
  },
  'forbidden': function (res) {
    if (!res) {
      return {
        "code": 403,
        "message": 'forbidden'
      };
    } else {
      res.send({
        "code": 403,
        "message": 'forbidden'
      }, 403);
    }
  }
};

function configureDeclaration(resourceName, obj) {
  if(resources[resourceName]) {
    var resource = resources[resourceName];

    if(obj["description"]) {
      resource["description"] = obj["description"];
    }
    if(obj["consumes"]) {
      resource["consumes"] = obj["consumes"];
    }
    if(obj["produces"]) {
      resource["produces"] = obj["produces"];
    }
    if(obj["protocols"]) {
      resource["protocols"] = obj["protocols"];
    }
    if(obj["authorizations"]) {
      resource["authorizations"] = obj["authorizations"];
    }
  }
}

exports.params = params;
exports.queryParam = exports.params.query;
exports.pathParam = exports.params.path;
exports.bodyParam = exports.params.body;
exports.formParam = exports.params.form;
exports.headerParam = exports.params.header;
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
exports.addPatch = addPatch;
exports.addDelete = addDelete;
exports.addGET = addGet;
exports.addPOST = addPost;
exports.addPUT = addPut;
exports.addPATCH = addPatch;
exports.addDELETE = addDelete;
exports.addModels = addModels;
exports.setAppHandler = setAppHandler;
exports.setErrorHandler = setErrorHandler;
exports.errorHandler = errorHandler;
exports.discover = discover;
exports.discoverFile = discoverFile;
exports.configureSwaggerPaths = configureSwaggerPaths;
exports.setHeaders = setHeaders;
exports.setApiInfo = setApiInfo;
exports.setAuthorizations = setAuthorizations;
exports.configureDeclaration = configureDeclaration;
