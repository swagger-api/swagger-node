/****************************************************************************
 Copyright 2015 Apigee Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ****************************************************************************/
'use strict';

var emit = require('./feedback').emit;
var swaggerSpec = require('swagger-tools').specs.v2_0;

module.exports = {
  validateSwagger: validateSwagger
};

function validateSwagger(swagger, options, cb) {

  swaggerSpec.validate(swagger, function(err, results) {
    if (err) { return cb(err); }

    var toJsonPointer = function (path) {
      // http://tools.ietf.org/html/rfc6901#section-4
      return '#/' + path.map(function (part) {
          return part.replace(/\//g, '~1');
        }).join('/');
    };

    if (results) {
      if (options.json) {
        cb(null, JSON.stringify(results, null, '  '));
      } else {
        if (results.errors.length > 0) {
          emit('\nProject Errors');
          emit('--------------');

          results.errors.forEach(function (vErr) {
            emit(toJsonPointer(vErr.path) + ': ' + vErr.message);
          });
        }

        if (results.warnings.length > 0) {
          emit('\nProject Warnings');
          emit('----------------');

          results.warnings.forEach(function (vWarn) {
            emit(toJsonPointer(vWarn.path) + ': ' + vWarn.message);
          });
        }

        cb(null, 'Results: ' + results.errors.length + ' errors, ' + results.warnings.length + ' warnings');
      }
    } else {
      if (options.json) {
        cb(null, '');
      } else {
        cb(null, 'Results: 0 errors, 0 warnings');
      }
    }
  });
}
