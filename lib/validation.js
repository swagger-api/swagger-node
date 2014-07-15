'use strict';

require('./polyfill');
var _ = require('lodash');
var util = require('util');

module.exports = Validator;

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
  var that = this;
  var ret = [];
  _.forEach(this.spec.parameters, function(param) {
    var paramError = that.validateParamType(param);
    if (paramError) {
      ret.push(paramError);
    }
  });
  return ret.length ? ret : null;
};

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
};

Validator.prototype.validatePathParamType = function(param) {
  var value;
  if (_.has(this.req.params, param.name)) {
    value = this.req.params[param.name];
    return this.validateParameter(value, param);
  }
  if (param.required && !param.defaultValue) {
    return util.format("Parameter %s is required", param.name);
  }
};

Validator.prototype.validateBodyParamType = function(param) {
  return this.validateParameter(this.req.body, param);
};

Validator.prototype.validateFormParamType = function(param) {
  var value;
  if (_.has(this.req.form, param.name)) {
    value = this.req.form[param.name];
    return this.validateParameter(value, param);
  }
  if (param.required && !param.defaultValue) {
    return util.format("Parameter %s is required", param.name);
  }
};

Validator.prototype.validateHeaderParamType = function(param) {
  var value;
  if (_.has(this.req.header, param.name)) {
    value = this.req.header[param.name];
    return this.validateParameter(value, param);
  }
  if (param.required && !param.defaultValue) {
    return util.format("Parameter %s is required", param.name);
  }
};

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
};

Validator.prototype.validateArrayParameter = function(value, param) {
  // ensure it is of type array before
  if (!_.isArray(value)) {
    return util.format("Parameter %s is not a type of array", param.name);
  }

  var that = this;
  var ret = [];
  _.forEach(value, function(value) {
    var paramError = that.validateParameter(value, param);
    if (paramError) {
      ret.push(paramError);
    }
  });
  return ret.length ? ret : null;
};

Validator.prototype.validateObjectParameter = function(value, param) {
  // ensure it is of type object first
  if (!_.isObject(value)) {
    try {
      value = JSON.parse(value);
    }
    catch (err) {
      return util.format("Parameter %s is not a type of object", param.name);
    }
  }

  // validate the properties of the object
  _.each(value, function (value, key) {
    console.log(value, key);
  });
};

Validator.prototype.validateStringParameter = function(value, param) {
  // check if value is string by checking the type as a string
  return this._validateParameter(value, param, function(value, paramName) {
    return _.isString(value) ? null : util.format("Parameter %s is not a type of string", paramName);
  });
};

Validator.prototype.validateBoolParameter = function(value, param) {
  // check if value is boolean by converting to boolean (if needed), then making sure it returns something valid.
  // this only handles native boolean types or converting from strings, as the concept is not uniform for other types
  // (ie, if it's a number, should it be 0 = false and 1 = true or should any non-zero number be true?)
  // this only handles strings that are the string representation in Javascript of their boolean counterparts,
  // so True, TRUE, etc. will not validate
  return this._validateParameter(value, param, function(value, paramName) {
    if (_.isBoolean(value)) {
      return null;
    }

    if (value === 'true' || value === 'false') {
      return null;
    }

    return util.format("Parameter %s is not a type of boolean", paramName);
  });
};

Validator.prototype.validateIntegerParameter = function(value, param) {
  // check if value is integer by converting to number, then calling isInteger.
  // this allows notation format (so 2e0) as those are actually integers (2e0 = 2 in this example).
  return this._validateParameter(value, param, function(value, paramName) {
    return Number.isInteger(Number(value)) ? null : util.format("Parameter %s is not a type of integer", paramName);
  });
};

Validator.prototype.validateFloatParameter = function(value, param) {
  // check if value is float by converting to Number, then making sure it returns something valid.
  // this allows all forms of a number (so 2, 2.0, 2.2, 2e0)
  // this does have issues with hex values (0xFF) being validated, but as such a small use case
  // and the fact those COULD be actual hex representations of integers, this ignores that "loophole"
  return this._validateParameter(value, param, function(value, paramName) {
    return !isNaN(parseFloat(value)) && isFinite(value) ? null : util.format("Parameter %s is not a type of float", paramName);
  });
};

// this takes care of the common "validate nothing was passed in" and "check if required" checks
Validator.prototype._validateParameter = function(value, param, func) {
  // if "nothing" was passed into the validate function and it's required with no default value, then throw required error
  if ((value === undefined || value === null || value === '')) {
    return (param.required && !param.defaultValue) ? util.format("Parameter %s is required", param.name) : null;
  }

  return func(value, param.name);
};