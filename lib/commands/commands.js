#!/usr/bin/env node
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

var converter = require('swagger-converter');
var swaggerSpec = require('../util/spec');
var yaml = require('js-yaml');
var join = require('path').join;
var fs = require('fs');

module.exports = {
  convert: convert,
  validate: validate
}

function convert(file, apiDeclarations, options, cb) {
  if (file) {
    try {
      var resource = require(join(process.cwd(), file));
    } catch (error) {
      return cb(error);
    }

    var declarations = [];

    apiDeclarations.forEach(function(currentValue) {
      try {
        declarations.push(require(join(process.cwd(), currentValue)));
      } catch (error) {
        return cb(error);
      }
    });

    var swagger2 = yaml.safeDump(converter(resource, declarations));

    if (options.outputFile) {
      fs.writeFile(join(process.cwd(), options.outputFile), swagger2, function(err) {
        if (err) {return cb(err);}
      });
    } else {
      process.stdout.write(swagger2);
    }
  }
}

function validate(file, options, cb) {

  if (!file) { // check stream
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function(data) {
      if (!data) { process.exit(1); }
      swaggerSpec.validateSwagger(parse(data), options, cb);
    });
  } else {
    var data = fs.readFileSync(file, 'utf8');
    swaggerSpec.validateSwagger(parse(data), options, cb);
  }
}

function parse(data) {
  if (isJSON(data)) {
    return JSON.parse(data);
  } else {
    return yaml.safeLoad(data);
  }
}

function isJSON(data) {
  return data.match(/^\s*\{/);
}
