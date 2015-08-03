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

var swaggerConverter = require('swagger-converter');
var swaggerSpec = require('../util/spec');
var yaml = require('js-yaml');
var join = require('path').join;
var fs = require('fs');

var convert = function convert(filePath, apiDeclarations, options, cb) {
  if (filePath) {
    if (!fs.existsSync(join(process.cwd(), filePath))) {
      return cb(error);
    }

    var resource = fs.readFileSync(join(process.cwd(), filePath), 'utf8');
    var json;

    try {
      json = JSON.parse(resource);
    } catch (error) {
      return cb(error);
    }

    var declarations = [];
    var tempJson;

    apiDeclarations.forEach(function(currentValue) {
      if (!fs.existsSync(join(process.cwd(), currentValue))) {
        return cb(error);
      }

      try {
        tempJson = JSON.parse(fs.readFileSync(join(process.cwd(), currentValue), 'utf8'))
      } catch (error) {
        return cb(error);
      }

      declarations.push(tempJson);
    });

    var swagger2 = yaml.safeDump(swaggerConverter(json, declarations));

    if (options.outputFile) {
      fs.writeFile(join(process.cwd(), options.outputFile), swagger2, function(err) {
        if (err) {return cb(err);}
      });
    } else {
      cb(null, swagger2);
    }
  }
}

var validate = function validate(file, options, cb) {

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

module.exports = {
  convert: convert,
  validate: validate
}
