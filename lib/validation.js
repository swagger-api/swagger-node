'use strict';

var _ = require('lodash');
var util = require('util');

module.exports = new Validator();

function Validator(req, root, api, spec) {
  this.req = req;
  this.root = root;
  this.api = api;
  this.spec = spec;
}

Validator.prototype.validate = function() {
  // if there are no parameters, assume no validation is necessary
  if (_.isArray(this.spec.parameters) === false || this.spec.parameters.length === 0) {
    return null;
  }

  // for each parameter that this spec has, validate it
  var ret = [];
  _.forEach(this.spec.parameters, function(param) {
    var paramError = this.validateParamType(param);
    if (paramError) {
      ret.push(paramError);
    }
  })
  return ret.length ? ret : null;
}

Validator.prototype.validateParamType = function(param) {
  switch (param.paramType.toLowerCase()) {
    case 'query':
    case 'q':
      return this.validateQueryParamType(param);
    case 'path':
      return this.validatePathParamType(param);
    case 'body':
      return this.validateBodyParamType(param);
    case 'form':
      return this.validateFormParamType(param);
    case 'header':
      return this.validateHeaderParamType(param);
  }
}

Validator.prototype.validateHeaderParamType = function(param) {
};

Validator.prototype.validateFormParamType = function(param) {
};

Validator.prototype.validateBodyParamType = function(param) {
};

Validator.prototype.validateQueryParamType = function(param) {
  var value;
  if (_.has(this.req.query, param.name)) {
    value = this.req.query[param.name];
    return this.validateParameter(value, param);
  }
  if (param.required && !param.defaultValue) {
    return util.format("Parameter %s is required", param.name);
  }
}

Validator.prototype.validatePathParamType = function(param) {
  var value;
  if (_.has(this.req.params, param.name)) {
    value = this.req.params[param.name];
    return this.validateParameter(value, param);
  }
  if (param.required && !param.defaultValue) {
    return util.format("Parameter %s is required", param.name);
  }
}

Validator.prototype.validateParameter = function(value, param) {
  switch (param.type.toLowerCase()) {
    case "string":
      return this.validateStringParameter(value, param.name);
    case "int":
    case "integer":
      return this.validateIntegerParameter(value, param.name);
    case "number":
    case "float":
      return this.validateFloatParameter(value, param.name);
    case "bool":
    case "boolean":
      return this.validateBoolParameter(value, param.name);
    case "array":
      return this.validateArrayParameter(value, param);
    case "object":
      return this.validateObjectParameter(value, param);
    case "byte":
    case "file":
      // these have no inherent validation to be done, but are valid types
      return;
  }
}

Validator.prototype.validateArrayParameter = function(value, param) {
  // ensure it is of type array before
  if (!_.isArray(value)) {
    return util.format("Parameter %s is not a type of array", param.name);
  }

  var ret = [];
  _.forEach(value, function(value) {
    var paramError = this.validateParameter(value, param);
    if (paramError) {
      ret.push(paramError);
    }
  });
  return ret.length ? ret : null;
}

Validator.prototype.validateObjectParameter = function(value, param) {
  // ensure it is of type number by having js convert it to a 32 bit number
  if (!_.isObject(value)) {
    return util.format("Parameter %s is not a type of object", param.name);
  }

  // validate the properties of the object
}

Validator.prototype.validateStringParameter = function(value, paramName) {
  // ensure it is of type string
  return _.isString(value) ? null : util.format("Parameter %s is not a type of string", paramName);
}

Validator.prototype.validateBoolParameter = function(value, paramName) {
  // ensure it is of type boolean
  return _.isBoolean(value) ? null : util.format("Parameter %s is not a type of boolean", paramName);
}

Validator.prototype.validateIntegerParameter = function(value, paramName) {
  // ensure it is of type number by converting it to a 32 bit number
  // this will allow something like 1.0 or 3.0000, but those are technically integers
  return (value === (value | 0)) ? null : util.format("Parameter %s is not a type of integer", paramName);
}

Validator.prototype.validateFloatParameter = function(value, paramName) {
  // ensure that it is a number. This does allow all forms of a number (so 2, 2.0, 2.2, 2e0),
  // but as all numbers are floating point behind the scenes anyway, this should be valid
  return (_.isNumber(value) && Number.MAX_VALUE > Math.abs(value)) ? null : util.format("Parameter %s is not a type of float", paramName);
}