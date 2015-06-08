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

var app = require('commander');
var browser = require('../lib/util/browser');
var cli = require('../lib/util/cli');
var execute = cli.execute;

app.version(require('../lib/util/cli').version());

app
  .command('project <action>', 'project actions');

app
  .command('docs')
  .description('open Swagger documentation')
  .action(function() {
    browser.open('https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md', function() {
      process.exit(0);
    });
  });

app
  .command('validate [swaggerFile]')
  .description('validate a Swagger document (supports unix piping)')
  .option('-j, --json', 'output as JSON')
  .action(execute(validate));

app.parse(process.argv);

if (!app.runningCommand) {
  if (app.args.length > 0) {
    console.log();
    console.log('error: invalid command: ' + app.args[0]);
  }
  app.help();
}

function validate(file, options, cb) {

  var swaggerSpec = require('../lib/util/spec');

  if (!file) { // check stream
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    app.runningCommand = true;
    process.stdin.on('data', function(data) {
      if (!data) { process.exit(1); }
      swaggerSpec.validateSwagger(parse(data), options, cb);
    });
  } else {
    var fs = require('fs');
    var data = fs.readFileSync(file, 'utf8');
    swaggerSpec.validateSwagger(parse(data), options, cb);
  }
}

function parse(data) {
  if (isJSON(data)) {
    return JSON.parse(data);
  } else {
    var yaml = require('js-yaml');
    return yaml.safeLoad(data);
  }
}

function isJSON(data) {
  return data.match(/^\s*\{/);
}
