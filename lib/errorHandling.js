'use strict';

exports.error = error;

// TODO can this be removed?
// Create Error JSON by code and text
function error(code, description) {
  return {
    'code'   : code,
    'message': description
  };
}
