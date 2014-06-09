/**
 *  Copyright 2014 Wordnik, Inc.
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
var allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
var allowedDataTypes = ['string', 'integer', 'boolean', 'array'];
var params = require(__dirname + '/paramTypes.js');
var toJsonType = require('./toJsonType');
var shallowClone = require('./shallowClone');


function Swagger() {
  
  if (!(this instanceof Swagger)){
    return new Swagger();
  }

  this.formatString = ".{format}";
  this.resourcePath = "/api-docs" + this.formatString;
  this.jsonSuffix = ".json";
  this.basePath = "/";
  this.apiInfo = null;
  this.authorizations = null;
  this.swaggerVersion = "1.2";
  this.apiVersion = "1.0";
  this.allModels = {};
  this.validators = [];
  this.appHandler = null;
  this.resources = {};

  // Default error handler

  this.errorHandler = function (error, req, res, next) {
    if (error.status && error.message)
      res.send(JSON.stringify(error), error.status);
    else {
      console.error(req.method + " failed for path '" + require('url').parse(req.url).href + "': " + error);
      res.send(JSON.stringify({
        "message": "unknown error",
        "code": 500
      }), 500);
    }
  };

  // For backwards compatability
  this.getModels = this.allModels;
}

/**
 * returns a new instance of swagger
 */

Swagger.prototype.createNew = function(){
  return new Swagger();
};

Swagger.prototype.configureSwaggerPaths = function(format, path, suffix) {
  if(path.indexOf("/") != 0) path = "/" + path;
  this.formatString = format;
  this.resourcePath = path;
  this.jsonSuffix = suffix;
};

// Configuring swagger will set the basepath and api version for all
// subdocuments.  It should only be done once, and during bootstrap of the app

Swagger.prototype.configure = function(bp, av) {
  var self = this;
  self.basePath = bp;
  self.apiVersion = av;
  self.setResourceListingPaths(self.appHandler);

  // add the GET for resource listing
  var resourceListing = _.bind(self.resourceListing, self);
  self.appHandler.get(self.resourcePath.replace(self.formatString, self.jsonSuffix), resourceListing);

  // update resources if already configured

  _.forOwn(self.resources, function (resource) {
    resource.apiVersion = av;
    resource.basePath = bp;
  });
};

// Convenience to set default headers in each response.

Swagger.prototype.setHeaders = function(res) {
  res.header("Access-Control-Allow-Headers", "Content-Type, api_key");
  res.header("Content-Type", "application/json; charset=utf-8");
};

// creates declarations for each resource path.

Swagger.prototype.setResourceListingPaths = function(app) {
  var self = this;
  _.forOwn(this.resources, function (resource, key) {

    // pet.json => api-docs.json/pet
    var path = self.baseApiFromPath(key);
    app.get(path, function (req, res) {
      // find the api base path from the request URL
      // /api-docs.json/pet => /pet.json

      var p = self.basePathFromApi(req.url.split('?')[0]);

      // this handles the request
      // api-docs.json/pet => pet.{format}
      var r = self.resources[p] || self.resources[p.replace(self.formatString, "")];
      if (!r) {
        console.error("unable to find listing");
        return stopWithError(res, {
          'message': 'internal error',
          'code': 500
        });
      } else {
        self.setHeaders(res);
        var data = self.filterApiListing(req, res, r);
        data.basePath = self.basePath;
        if (data.code) {
          res.send(data, data.code);
        } else {
          res.send(JSON.stringify(data));
        }
      }
    });
  });
};

Swagger.prototype.basePathFromApi = function(path) {
  var l = this.resourcePath.replace(this.formatString, this.jsonSuffix);
  var p = path.substring(l.length + 1) + this.formatString;
  return p;
};

Swagger.prototype.baseApiFromPath = function(path) {
  var p = this.resourcePath.replace(this.formatString, this.jsonSuffix) + "/" + path.replace(this.formatString, "");
  return p;
};

Swagger.prototype.addPropertiesToRequiredModels = function(properties, requiredModels) {
  var self = this;
  _.forOwn(properties, function (property) {
    var type = property["type"];
    if(type) {
      switch (type) {
      case "array":
        if (property.items) {
          var ref = property.items.$ref;
          if (ref && requiredModels.indexOf(ref) < 0) {
            requiredModels.push(ref);
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
      if (property["$ref"]){
        requiredModels.push(property["$ref"]);
      }
    }
    if (property.properties) {
      self.addPropertiesToRequiredModels(property.properties, requiredModels);
    }
  });
};

// Applies a filter to an api listing.  When done, the api listing will only contain
// methods and models that the user actually has access to.

Swagger.prototype.filterApiListing = function(req, res, r) {
  var self = this;
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
      var path = api.path.replace(self.formatString, "").replace(/{.*\}/, "*");
      if (!self.canAccessResource(req, path, op.method)) {
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
        var co = JSON.parse(JSON.stringify(operation));
        delete co.path;

        var type = toJsonType(co.type);
        if(type) {
          for(var nm in type) {
            delete co[nm];
            co[nm] = type[nm];
          }
        }
        clonedApi.operations.push(co);
        self.addModelsFromBody(operation, requiredModels);
        self.addModelsFromResponse(operation, requiredModels);
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
    var model = self.allModels[modelName];
    if (model) {
      output.models[modelName] = model;
    }
  });

  //  look in object graph
  _.forOwn(output.models, function (model) {
    if (model && model.properties) {
      self.addPropertiesToRequiredModels(model.properties, requiredModels);
    }
  });
  _.forOwn(requiredModels, function (modelName) {
    if (!output[modelName]) {
      var model = self.allModels[modelName];
      if (model) {
        output.models[modelName] = model;
      }
    }
  });

  return output;
};



// Add model to list and parse List[model] elements

Swagger.prototype.addModelsFromBody = function(operation, models) {
  var self = this;
  if (operation.parameters) {
    _.forOwn(operation.parameters, function (param) {
      if (param.paramType == "body" && param.type) {
        var model = param.type.replace(/^List\[/, "").replace(/\]/, "");
        models.push(model);
      }
    });
  }
};

// Add model to list and parse List[model] elements

Swagger.prototype.addModelsFromResponse = function(operation, models) {
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
};


// function for filtering a resource.  override this with your own implementation.
// if consumer can access the resource, method returns true.

Swagger.prototype.canAccessResource = function(req, path, method) {
  for (var i = 0; i < this.validators.length; i++) {
    var validator = this.validators[i];
    if (_.isFunction(validator) && !validator(req, path, method)) {
      return false;
    }
  }
  return true;
};

/**
 * returns the json representation of a resource
 *
 * @param request
 * @param response
 */

Swagger.prototype.resourceListing = function(req, res) {
  var self = this;
  var r = {
    "apiVersion": self.apiVersion,
    "swaggerVersion": self.swaggerVersion,
    "apis": []
  };

  if(self.authorizations != null)
    r["authorizations"] = self.authorizations;

  if(self.apiInfo != null)
    r["info"] = self.apiInfo;

  _.forOwn(self.resources, function (value, key) {
    var p = "/" + key.replace(self.formatString, "");
    r.apis.push({
      "path": p,
      "description": value.description
    });
  });
  self.setHeaders(res);
  res.write(JSON.stringify(r));
  res.end();
};

// Adds a method to the api along with a spec.  If the spec fails to validate, it won't be added

Swagger.prototype.addMethod = function(app, callback, spec) {
  var self = this;
  var apiRootPath = spec.path.split(/[\/\(]/)[1];
  var root = self.resources[apiRootPath];

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
  if (!self.resources[apiRootPath]) {
    if (!root) {
      //
      var resourcePath = "/" + apiRootPath.replace(self.formatString, "");
      root = {
        "apiVersion": self.apiVersion,
        "swaggerVersion": self.swaggerVersion,
        "basePath": self.basePath,
        "resourcePath": resourcePath,
        "apis": [],
        "models": []
      };
    }
    self.resources[apiRootPath] = root;
  }

  root.apis.push(api);
  appendToApi(root, api, spec);

  //  convert .{format} to .json, make path params happy
  var fullPath = spec.path.replace(self.formatString, self.jsonSuffix).replace(/\/{/g, "/:").replace(/\}/g, "");
  var currentMethod = spec.method.toLowerCase();
  if (allowedMethods.indexOf(currentMethod) > -1) {
    app[currentMethod](fullPath, function (req, res, next) {
      self.setHeaders(res);

      // todo: needs to do smarter matching against the defined paths
      var path = req.url.split('?')[0].replace(self.jsonSuffix, "").replace(/{.*\}/, "*");
      try {
        if (!self.canAccessResource(req, path, req.method)) {
          throw {
          	message: 'Forbidden',
          	status: 403
          };
        }
        callback(req, res, next);
      } catch (error) {
        if (typeof self.errorHandler === "function") {
          return self.errorHandler(error, req, res, next);
        }
        return next(error);
	  }
    });
  } else {
    console.error('unable to add ' + currentMethod.toUpperCase() + ' handler');
    return;
  }
};

// Set expressjs app handler

Swagger.prototype.setAppHandler = function(app) {
  this.appHandler = app;
};

// Change error handler
// Error handler should be a function that accepts parameters req, res, error

Swagger.prototype.setErrorHandler= function(handler) {
  this.errorHandler = handler;
};

// Add swagger handlers to express

Swagger.prototype.addHandlers = function(type, handlers) {
  var self = this;
  _.forOwn(handlers, function (handler) {
    handler.spec.method = type;
    self.addMethod(self.appHandler, handler.action, handler.spec);
  });
};

// Discover swagger handler from resource

Swagger.prototype.discover = function(resource) {
  var self = this;
  _.forOwn(resource, function (handler, key) {
    if (handler.spec && handler.spec.method && allowedMethods.indexOf(handler.spec.method.toLowerCase()) > -1) {
      self.addMethod(self.appHandler, handler.action, handler.spec);
    } else
      console.error('auto discover failed for: ' + key);
  });
};

// Discover swagger handler from resource file path

Swagger.prototype.discoverFile = function(file) {
  return this.discover(require(file));
};

// adds get handler

Swagger.prototype.addGet = Swagger.prototype.addGET = function() {
  this.addHandlers('GET', arguments);
  return this;
};

// adds post handler

Swagger.prototype.addPost = Swagger.prototype.addPOST = function() {
  this.addHandlers('POST', arguments);
  return this;
};

// adds delete handler

Swagger.prototype.addDelete = Swagger.prototype.addDELETE = function() {
  this.addHandlers('DELETE', arguments);
  return this;
};

// adds put handler

Swagger.prototype.addPut = Swagger.prototype.addPUT = function() {
  this.addHandlers('PUT', arguments);
  return this;
};

// adds patch handler

Swagger.prototype.addPatch = Swagger.prototype.addPATCH = function() {
  this.addHandlers('PATCH', arguments);
  return this;
};

// adds models to swagger

Swagger.prototype.addModels = function(models) {
  models = _.cloneDeep(models).models;
  var self = this;
  if (!self.allModels) {
    self.allModels = models;
  } else {
    _.forOwn(models, function (model, key) {
      self.allModels[key] = model;
    });
  }
  return this;
};

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

Swagger.prototype.addValidator = function(v) {
  this.validators.push(v);
};

// Create Error JSON by code and text

function error(code, description) {
  return {
    "code": code,
    "message": description
  };
}

// Stop express ressource with error code

stopWithError = function(res, error) {
  this.setHeaders(res);
  if (error && error.message && error.code)
    res.send(JSON.stringify(error), error.code);
  else
    res.send(JSON.stringify({
      'message': 'internal error',
      'code': 500
    }), 500);
};

Swagger.prototype.setApiInfo = function(data) {
  this.apiInfo = data;
};

Swagger.prototype.setAuthorizations = function(data) {
  this.authorizations = data;
};

// Export most needed error types for easier handling
Swagger.prototype.errors = {
  'notFound': function (field, next) {
  	var ret = {
      "status": 404,
      "message": field + ' not found'
    };
    if (typeof next == 'function') next(ret);
    return ret;
  },
  'invalid': function (field, next) {
  	var ret = {
      "status": 400,
      "message": 'invalid ' + field
    };
    if (typeof next == 'function') next(ret);
    return ret;
  },
  'forbidden': function (next) {
  	var ret = {
        "status": 403,
        "message": 'forbidden'
    };
    if (typeof next == 'function') next(ret);
    return ret;
  }
};

Swagger.prototype.configureDeclaration = function(resourceName, obj) {
  if(this.resources[resourceName]) {
    var resource = this.resources[resourceName];

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
};

// For backwards compatability, we just export a new instance of Swagger
module.exports = exports = Swagger();

exports.params = params;
exports.queryParam = exports.params.query;
exports.pathParam = exports.params.path;
exports.bodyParam = exports.params.body;
exports.formParam = exports.params.form;
exports.headerParam = exports.params.header;
exports.error = error;
exports.stopWithError = stopWithError;
exports.stop = stopWithError;
