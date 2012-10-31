exports.query = exports.q = function(name, description, dataType, required, allowMultiple, allowableValues, defaultValue) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : required,
    "allowMultiple" : allowMultiple,
    "allowableValues" : allowableValues,
    "defaultValue" : defaultValue,
    "paramType" : "query"
  };
};

exports.path = function(name, description, dataType, allowableValues) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "allowMultiple" : false,
    "allowableValues" : allowableValues,
    "paramType" : "path"
  };
};

exports.post = function(dataType, description, defaultValue) {
  return {
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "paramType" : "body",
    "defaultValue" : defaultValue
  };
};

exports.header = function(name, description, dataType, required) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "allowMultiple" : false,
    "paramType" : "header"
  };
};