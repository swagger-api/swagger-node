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

var config = require('../../../config');
var _ = require('lodash');
var path = require('path');
var fs = require('fs-extra');
var emit = require('../../util/feedback').emit;
var netutil = require('../../util/net');
var debug = require('debug')('swagger');
var util = require('util');
var cli = require('../../util/cli');
var template = require('swagger-test-templates');
var async = require('async');
var swaggerSpec = require('../../util/spec');
var spec = require('swagger-tools').specs.v2;

var FRAMEWORKS = {
  connect: { source: 'connect' },
  express: { source: 'connect', overlay: 'express' },
  hapi:    { source: 'connect', overlay: 'hapi' },
  restify: { source: 'connect', overlay: 'restify' },
  sails:   { source: 'sails' }
};

var ASSERTIONTYPES = ['expect', 'should', 'assert'];
var TESTMODULES = ['supertest', 'request'];

module.exports = {
  create: create,
  start: start,
  verify: verify,
  edit: edit,
  open: open,
  test: test,

  // for internal use
  frameworks: FRAMEWORKS,
  read: readProject,
  assertiontypes: ASSERTIONTYPES,
  testmodules: TESTMODULES,

  // for testing stub generating
  generateTest: testGenerate
};

//.option('-f, --framework <framework>', 'one of: connect | express')
function create(name, options, cb) {
  function validateName(name) {
    var targetDir = path.resolve(process.cwd(), name);
    if (fs.existsSync(targetDir)) {
      return 'Directory ' + targetDir + ' already exists.';
    }
    return true;
  }

  if (name) {
    var valid = validateName(name);
    if (typeof valid === 'string') { return cb(new Error(valid)); }
  }

  if (options.framework && !FRAMEWORKS[options.framework]) {
    return cb(new Error(util.format('Unknown framework: %j. Valid frameworks: %s', options.framework, Object.keys(FRAMEWORKS).join(', '))));
  }

  var questions = [
    { name: 'name', message: 'Project name?', validate: validateName },
    { name: 'framework', message: 'Framework?', type: 'list', choices: Object.keys(FRAMEWORKS) }
  ];

  var results = {
    name: name,
    framework: options.framework
  };

  cli.requireAnswers(questions, results, function(results) {

    var name = results.name;
    var framework = results.framework;
    var targetDir = path.resolve(process.cwd(), name);

    cloneSkeleton(name, framework, targetDir, function(err) {
      if (err) { return cb(err); }
      emit('Project %s created in %s', name, targetDir);

      var message = util.format('Success! You may start your new app by running: "swagger project start %s"', name);

      installDependencies(targetDir, message, cb);
    });
  });
}

//.option('-d, --debug [port]', 'start in remote debug mode')
//.option('-b, --debug-brk [port]', 'start in remote debug mode, wait for debugger connect')
//.option('-m, --mock', 'start in mock mode')
//.option('-o, --open', 'open in browser')
function start(directory, options, cb) {

  readProject(directory, options, function(err, project) {
    if (err) { throw err; }

    var fullPath = path.join(project.dirname, project.api.main);
    emit('Starting: %s...', fullPath);
    var nodemonOpts = {
      script: project.api.main,
      ext: 'js,json,yaml,coffee',
      nodeArgs: []
    };
    if (project.dirname) { nodemonOpts.cwd = project.dirname; }
    if (options.debugBrk) {
      var debugBrkArg = '--debug-brk';
      if (typeof options.debugBrk === 'string') {
        debugBrkArg += '=' + options.debugBrk;
      }
      nodemonOpts.nodeArgs.push(debugBrkArg);
    }
    if (options.debug) {
      var debugArg = '--debug';
      if (typeof options.debug === 'string') {
        debugArg += '=' + options.debug;
      }
      nodemonOpts.nodeArgs.push(debugArg);
    }
    // https://www.npmjs.com/package/cors
    nodemonOpts.env = {
      swagger_corsOptions: '{}' // enable CORS so editor "try it" function can work
    };
    if (options.mock) {
      nodemonOpts.env.swagger_mockMode = true
    }
    var nodemon = require('nodemon');
    // hack to enable proxyquire stub for testing...
    if (_.isFunction(nodemon)) {
      nodemon(nodemonOpts);
    } else {
      nodemon._init(nodemonOpts, cb);
    }
    nodemon.on('start', function () {
      emit('  project started here: ' + project.api.localUrl);
      emit('  project will restart on changes.');
      emit('  to restart at any time, enter `rs`');

      if (options.open) {
        setTimeout(function() {
          open(directory, options, cb);
        }, 500);
      }
    }).on('restart', function (files) {
      emit('Project restarted. Files changed: ', files);
    });
  });
}

//.option('-d, --debug [port]', 'start in remote debug mode')
//.option('-b, --debug-brk [port]', 'start in remote debug mode, wait for debugger connect')
//.option('-m, --mock', 'start in mock mode')
//.option('-o, --open', 'open in browser')
function test(directory, options, cb) {

  var Mocha = require('mocha');
  var MochaUtils = require('mocha/lib/utils');

  readProject(directory, options, function(err, project) {

    if (err) { return cb(err); }

    var mocha = new Mocha();
    var testPath = project.dirname;
    if (directory) {
      try {
        testPath = fs.realpathSync(directory);
      } catch (err) {
        return cb(new Error(util.format('no such file or directory %s', directory)));
      }
    }
    testPath = path.resolve(testPath, 'test');
    debug('testPath: %s', testPath);

    if (fs.statSync(testPath).isFile()) {
      if (testPath.substr(-3) !== '.js') { return cb(new Error('file is not a javascript file')); }
      mocha.addFile(testPath);
      debug('mocha addFile: %s', testPath);
    } else {
      MochaUtils.lookupFiles(testPath, ['js'], true)
        .forEach(function(file) {
          mocha.addFile(file);
          debug('mocha addFile: %s', file);
        });
    }

    emit('Running tests in: %s...', testPath);

    mocha.run(function(failures) {
      cb(null, failures);
    });
  });
}

function verify(directory, options, cb) {

  readProject(directory, options, function(err, project) {
    if (err) { return cb(err); }

    swaggerSpec.validateSwagger(project.api.swagger, options, cb);
  });
}

function edit(directory, options, cb) {

  readProject(directory, options, function(err, project) {
    if (err) { return cb(err); }
    var editor = require('./swagger_editor');
    editor.edit(project, options, cb);
  });
}

function open(directory, options, cb) {

  readProject(directory, options, function(err, project) {
    if (err) { return cb(err); }

    netutil.isPortOpen(project.api.port, function(err, isOpen) {
      if (err) { return cb(err); }
      if (isOpen) {
        var browser = require('../../util/browser');
        browser.open(project.api.localUrl, cb);
      } else {
        emit('Project does not appear to be listening on port %d.', project.api.port);
      }
    });
  });
}

// Utility

function readProject(directory, options, cb) {

  findProjectFile(directory, options, function(err, fileName) {
    if (err) { return cb(err); }

    var yaml = require('js-yaml');
    var Url = require('url');

    var string = fs.readFileSync(fileName, { encoding: 'utf8' });
    var project = JSON.parse(string);

    project.filename = fileName;
    project.dirname = path.dirname(fileName);

    if (!project.api) { project.api = {}; }

    project.api.swaggerFile = path.resolve(project.dirname, 'api', 'swagger', 'swagger.yaml');
    project.api.swagger = yaml.safeLoad(fs.readFileSync(project.api.swaggerFile, 'utf8'));

    project.api.name = project.name;
    project.api.main = project.main;
    project.api.host = project.api.swagger.host;
    project.api.basePath = project.api.swagger.basePath;

    project.api.localUrl = 'http://' + project.api.host + project.api.swagger.basePath;
    project.api.port = Url.parse(project.api.localUrl).port || 80;

    debug('project.api: %j', _.omit(project.api, 'swagger'));
    cb(null, project);
  });
}

// .option('-p, --project', 'use specified project file')
function findProjectFile(startDir, options, cb) {

  var parent = startDir = startDir || process.cwd();
  var maxDepth = 50;
  var current = null;
  while (current !== parent && maxDepth-- > 0) {
    current = parent;
    var projectFile = path.resolve(current, 'package.json');
    if (fs.existsSync(projectFile)) {
      return cb(null, projectFile);
    }
    parent = path.join(current, '..');
  }
  cb(new Error('Project root not found in or above: ' + startDir));
}

function cloneSkeleton(name, framework, destDir, cb) {

  var skeletonsDir = config.project.skeletonsDir;

  framework = FRAMEWORKS[framework];
  var sourceDir = path.resolve(skeletonsDir, framework.source);
  var overlayDir = (framework.overlay) ? path.resolve(skeletonsDir, framework.overlay) : null;

  var done = function(err) {
    if (err) { return cb(err); }
    customizeClonedFiles(name, framework, destDir, cb);
  };

  debug('copying source files from %s', sourceDir);
  fs.copy(sourceDir, destDir, true, function(err) {
    if (err) { return cb(err); }
    if (overlayDir) {
      debug('copying overlay files from %s', overlayDir);
      fs.copy(overlayDir, destDir, false, done);
    } else {
      done();
    }
  });
}

function customizeClonedFiles(name, framework, destDir, cb) {

  // npm renames .gitignore to .npmignore, change it back
  var npmignore = path.resolve(destDir, '.npmignore');
  var gitignore = path.resolve(destDir, '.gitignore');
  fs.rename(npmignore, gitignore, function(err) {
    if (err && !fs.existsSync(gitignore)) { return cb(err); }

    // rewrite package.json
    var fileName = path.resolve(destDir, 'package.json');
    fs.readFile(fileName, { encoding: 'utf8' }, function(err, string) {
      if (err) { return cb(err); }

      var project = JSON.parse(string);
      project.name = name;

      debug('writing project: %j', project);
      fs.writeFile(fileName, JSON.stringify(project, null, '  '), cb);
    });
  });
}

function spawn(command, options, cwd, cb) {

  var cp = require('child_process');
  var os = require('os');

  var isWin = /^win/.test(os.platform());

  emit('Running "%s %s"...', command, options.join(' '));

  var npm = cp.spawn(isWin ?
                       process.env.comspec :
                       command,
                     isWin ?
                       ['/c'].concat(command, options) :
                       options,
                     { cwd: cwd });
  npm.stdout.on('data', function (data) {
    emit(data);
  });
  npm.stderr.on('data', function(data) {
    emit('%s', data);
  });
  npm.on('close', function(exitCode) {
    if (exitCode !== 0) { var err = new Error('exit code: ' + exitCode); }
    cb(err);
  });
  npm.on('error', function(err) {
    cb(err);
  });
}


//.option('-p, --path-name [path]', 'a sepecific path of the api')
//.option('-f, --test-module <module>', 'one of: ' + testmodules)
//.option('-t, --assertion-format <type>', 'one of: ' + assertiontypes)
function testGenerate(directory, options, cb) {
  var pathList = [];
  var desiredPaths = [];
  var testModule = options.testModule || TESTMODULES[0];
  var assertionFormat = options.assertionFormat || ASSERTIONTYPES[0];

  findProjectFile(directory, null, function(err, projPath) {
    var projectFile;
    var projectJson = require(projPath);
    var runInstall = false;

    if (!projectJson.devDependencies.hasOwnProperty('z-schema')) {
      projectJson.devDependencies['z-schema'] = '^3.12.0';
      runInstall = true;
    }

    if (!projectJson.devDependencies.hasOwnProperty('request')) {
      projectJson.devDependencies.request = '^2.58.0';
      runInstall = true;
    }

    if (!projectJson.devDependencies.hasOwnProperty('chai')) {
      projectJson.devDependencies.chai = '^3.0.0';
      runInstall = true;
    }

    if (!projectJson.devDependencies.hasOwnProperty('mocha')) {
      projectJson.devDependencies.mocha = '^2.2.5';
      runInstall = true;
    }

    if (!projectJson.hasOwnProperty('scripts')) {
      projectJson.scripts = {test: 'mocha test'};
    } else if (!projectJson.scripts.hasOwnProperty('test')) {
      projectJson.scripts.test = 'mocha test';
    }

    projectFile = JSON.stringify(projectJson, null, 2);

    fs.writeFileSync(projPath, projectFile);

    if (runInstall) {
      installDependencies(directory, 'Success! You may now run your tests.', cb);
    }

    //read the yaml file and validate it
    readProject(directory, options, function(err, project) {
      if (err) { return cb(err); }
      swaggerSpec.validateSwagger(project.api.swagger, options, function(err) {
        spec.resolve(project.api.swagger, function(err, result) {
          // get the array of string paths from json object
          pathList = Object.keys(result.paths);

          //check if the test frame is one of the two
          if (options.testModule && !_.includes(TESTMODULES, options.testModule)) {
            return cb(new Error(util.format('Unknown type: %j. Valid types: %s', options.testModule, TESTMODULES.join(', '))));
          }

          // check if the assertion-format is one of the three
          if (options.assertionFormat && !_.includes(ASSERTIONTYPES, options.assertionFormat)) {
            return cb(new Error(util.format('Unknown type: %j. Valid types: %s', options.assertionFormat, ASSERTIONTYPES.join(', '))));
          }

          // process the paths option
          if (options.pathName){
            var reg = new RegExp(options.pathName);
            desiredPaths = pathList.filter(function(val) {
              return val.match(reg);
            });
          }

          // pass the config to the module and get the result string array
          var config = {
            pathName: desiredPaths,
            testModule: testModule,
            assertionFormat: assertionFormat
          };
          var finalResult = template.testGen(result, config);

          //output the result
          async.each(finalResult, function (item, callback) {
            var p = item.name;
            var filename = p.substring(1);
            fs.outputFile(path.join(directory, '/test', filename), item.test, callback);
          }, cb);
        });
      });
    });
  });


}

function installDependencies(directory, message, cb) {
  spawn('npm', ['install'], directory, function(err) {
    if (err) {
      emit('"npm install" failed. Please run "npm install" in %s.', directory);
      return cb(err);
    }
    cb(null, message);
  });
}
