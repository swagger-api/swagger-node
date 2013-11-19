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
var swaggerVersion = "1.1";
var apiVersion = "0.0";
var resources = {};
var validators = [];
var appHandler = null;
var allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
var allowedDataTypes = ['string', 'int', 'long', 'double', 'boolean', 'date', 'array'];
var params = require(__dirname + '/paramTypes.js');
var allModels = {};

// Default error handler
var errorHandler = function (req, res, error) {
  if (error.code && error.reason)
    res.send(JSON.stringify(error), error.code);
  else {
    console.error(req.method + " failed for path '" + require('url').parse(req.url).href + "': " + error);
    res.send(JSON.stringify({
      "reason": "unknown error",
      "code": 500
    }), 500);
  }
};

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

  _.forOwn(resources, function (resource) {
    resource.apiVersion = av;
    resource.basePath = bp;
  });
}

// Convenience to set default headers in each response.

function setHeaders(res) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
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
          'reason': 'internal error',
          'code': 500
        });
      } else {
        exports.setHeaders(res);
        var data = filterApiListing(req, res, r);
        data.basePath = basePath;
        if (data.code) {
          res.send(data, data.code);
        } else {
          res.send(JSON.stringify(filterApiListing(req, res, r)));
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

// Applies a filter to an api listing.  When done, the api listing will only contain
// methods and models that the user actually has access to.

function filterApiListing(req, res, r) {
  var excludedPaths = [];

  if (!r || !r.apis) {
    return stopWithError(res, {
      'reason': 'internal error',
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
      if (!canAccessResource(req, path, op.httpMethod)) {
        excludedPaths.push(op.httpMethod + ":" + api.path);
      }
    }
  });

  //  clone attributes in the resource
  var output = shallowClone(r);

  //  models required in the api listing
  var requiredModels = [];

  //  clone methods that user can access
  output.apis = [];
  var apis = JSON.parse(JSON.stringify(r.apis));
  _.forOwn(apis, function (api) {
    var clonedApi = shallowClone(api);

    clonedApi.operations = [];
    _.forOwn(api.operations, function (operation) {
      if (!excludedPaths.indexOf(operation.httpMethod + ":" + api.path) >= 0) {
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
      _.forOwn(model.properties, function (property) {
        var type = property.type;

        switch (type) {
        case "array":
        case "Array":
          if (property.items) {
            var ref = property.items.$ref;
            if (ref && requiredModels.indexOf(ref) < 0) {
              requiredModels.push(ref);
            }
          }
          break;
        case "string":
        case "long":
          break;
        default:
          if (requiredModels.indexOf(type) < 0) {
            requiredModels.push(type);
          }
          break;
        }
      });
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
      if (param.paramType == "body" && param.dataType) {
        var model = param.dataType.replace(/^List\[/, "").replace(/\]/, "");
        models.push(model);
      }
    });
  }
}

// Add model to list and parse List[model] elements

function addModelsFromResponse(operation, models) {
  var responseModel = operation.responseClass;
  if (responseModel) {
    responseModel = responseModel.replace(/^List\[/, "").replace(/\]/, "");
    if (models.indexOf(responseModel) < 0) {
      models.push(responseModel);
    }
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

function canAccessResource(req, path, httpMethod) {
  for (var i = 0; i < validators.length; i++) {
    var validator = validators[i];
    if (_.isFunction(validator) && !validator(req, path, httpMethod)) {
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
    "basePath": basePath,
    "apis": []
  };

  _.forOwn(resources, function (value, key) {
    var p = resourcePath + "/" + key.replace(formatString, "");
    r.apis.push({
      "path": p,
      "description": "none"
    });
  });

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
    app[currentMethod](fullPath, function (req, res) {
      exports.setHeaders(res);

      // todo: needs to do smarter matching against the defined paths
      var path = req.url.split('?')[0].replace(jsonSuffix, "").replace(/{.*\}/, "*");
      if (!canAccessResource(req, path, req.method)) {
        res.send(JSON.stringify({
          "reason": "forbidden",
          "code": 403
        }), 403);
      } else {
        try {
          callback(req, res);
        } catch (error) {
          if (typeof errorHandler === "function") {
            errorHandler(req, res, error);
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

// Throw an error using errorHandler
// Throw an error form async code. Pass req and res forward from the action function

function throwError(req, res, error) {
    errorHandler(req, res, error);
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
      var required = model.required;
      _.forOwn(model.properties, function (property, propertyKey) {
        // convert enum to allowableValues
        if (typeof property.enum !== 'undefined') {
          property.allowableValues = {
            "valueType": "LIST",
            "values": property.enum
          }
        }
        // convert existence in v4 required array to required attribute
        if (required && required.indexOf(propertyKey) > -1) {
          property.required = true;
        }
      });
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

  if (!api.description) {
    api.description = spec.description;
  }
  var validationErrors = [];

  if (!spec.nickname || spec.nickname.indexOf(" ") >= 0) {
    //  nicknames don't allow spaces
    validationErrors.push({
      "path": api.path,
      "error": "invalid nickname '" + spec.nickname + "'"
    });
  }
  // validate params
  _.forOwn(spec.params, function (param) {
    if (param.allowableValues) {
      var avs = param.allowableValues.toString();
      var type = avs.split('[')[0];
      if (type == 'LIST') {
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[', '').replace('\]', '').split(',');
        param.allowableValues = {
          valueType: type,
          values: values
        };
      } else if (type == 'RANGE') {
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[', '').replace('\]', '').split(',');
        param.allowableValues = {
          valueType: type,
          min: values[0],
          max: values[1]
        };
      }
    }

    switch (param.paramType) {
    case "path":
      if (api.path.indexOf("{" + param.name + "}") < 0) {
        validationErrors.push({
          "path": api.path,
          "name": param.name,
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
        "name": param.name,
        "error": "invalid param type " + param.paramType
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
    "parameters": spec.params,
    "httpMethod": spec.method,
    "notes": spec.notes,
    "errorResponses": spec.errorResponses,
    "nickname": spec.nickname,
    "summary": spec.summary,
    "consumes" : spec.consumes,
    "produces" : spec.produces
  };

  // Add custom fields.
  op = _.extend({}, spec, op);

  if (spec.responseClass) {
    op.responseClass = spec.responseClass;
  } else {
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
  return {
    "code": code,
    "reason": description
  };
}

// Stop express ressource with error code

function stopWithError(res, error) {
  exports.setHeaders(res);
  if (error && error.reason && error.code)
    res.send(JSON.stringify(error), error.code);
  else
    res.send(JSON.stringify({
      'reason': 'internal error',
      'code': 500
    }), 500);
}

// Export most needed error types for easier handling
exports.errors = {
  'notFound': function (field, res) {
    if (!res) {
      return {
        "code": 404,
        "reason": field + ' not found'
      };
    } else {
      res.send({
        "code": 404,
        "reason": field + ' not found'
      }, 404);
    }
  },
  'invalid': function (field, res) {
    if (!res) {
      return {
        "code": 400,
        "reason": 'invalid ' + field
      };
    } else {
      res.send({
        "code": 400,
        "reason": 'invalid ' + field
      }, 404);
    }
  },
  'forbidden': function (res) {
    if (!res) {
      return {
        "code": 403,
        "reason": 'forbidden'
      };
    } else {
      res.send({
        "code": 403,
        "reason": 'forbidden'
      }, 403);
    }
  }
};

exports.params = params;
exports.queryParam = exports.params.query;
exports.pathParam = exports.params.path;
exports.bodyParam = exports.params.body;
exports.formParam = exports.params.form;
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
exports.throwError = throwError;
exports.discover = discover;
exports.discoverFile = discoverFile;
exports.configureSwaggerPaths = configureSwaggerPaths;
exports.setHeaders = setHeaders;
