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
var project = require('../lib/commands/project/project');
var cli = require('../lib/util/cli');
var execute = cli.execute;
var frameworks = Object.keys(project.frameworks).join('|');

app
  .command('create [name]')
  .description('Create a folder containing a Swagger project')
  .option('-f, --framework <framework>', 'one of: ' + frameworks)
  .action(execute(project.create));

app
  .command('start [directory]')
  .description('Start the project in this or the specified directory')
  .option('-d, --debug <port>', 'start in remote debug mode')
  .option('-b, --debug-brk <port>', 'start in remote debug mode, wait for debugger connect')
  .option('-m, --mock', 'start in mock mode')
  .option('-o, --open', 'open browser as client to the project')
  .action(execute(project.start));

app
  .command('verify [directory]')
  .description('Verify that the project is correct (swagger, config, etc)')
  .option('-j, --json', 'output as JSON')
  .action(execute(project.verify));

app
  .command('edit [directory]')
  .description('open Swagger editor for this project or the specified project directory')
  .option('-s, --silent', 'do not open the browser')
  .option('--host <host>', 'the hostname the editor is served from')
  .option('-p, --port <port>', 'the port the editor is served from')
  .action(execute(project.edit));

app
  .command('open [directory]')
  .description('open browser as client to the project')
  .action(execute(project.open));

app
  .command('test [directory_or_file]')
  .description('Run project tests')
  .option('-d, --debug [port]', 'start in remote debug mode')
  .option('-b, --debug-brk [port]', 'start in remote debug mode, wait for debugger connect')
  .option('-m, --mock', 'run in mock mode')
  .action(execute(project.test));

app.parse(process.argv);
cli.validate(app);
