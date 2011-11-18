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

exports.query = exports.q = function(name, description, dataType, required, allowMultiple, allowableValues, defaultValue) {
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

exports.path = function(name, description, dataType, allowableValues) {
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

exports.post = function(name, description) {
  return {
    "description" : description,
    "dataType" : name,
    "required" : true,
    "paramType" : "body"
  };
}