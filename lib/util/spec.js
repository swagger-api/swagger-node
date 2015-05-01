/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2015 Apigee Corporation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
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
