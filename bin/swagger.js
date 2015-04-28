#!/usr/bin/env node
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
  var YAML = require('yamljs');

  if (!file) { // check stream
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    app.runningCommand = true;
    process.stdin.on('data', function(data) {
      if (!data) { process.exit(1); }
      var swagger = YAML.parse(data);
      swaggerSpec.validateSwagger(swagger, options, cb);
    });
  } else {
    var swagger = YAML.load(file);
    swaggerSpec.validateSwagger(swagger, options, cb);
  }
}
