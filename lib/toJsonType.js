'use strict';

module.exports = toJsonType;

var mappings = {
  'int': {
    type: 'integer',
    format: 'int32'
  },
  'long': {
    type: 'integer',
    format: 'int64'
  },
  'float': {
    type: 'number',
    format: 'float'
  },
  'double': {
    type: 'number',
    format: 'double'
  },
  'date': {
    type: 'string',
    format: 'date-time'
  }
};

function toJsonType(model) {
  if(model && mappings[model]) {
    return mappings[model];
  }
}

