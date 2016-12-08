/****************************************************************************
 Copyright 2016 Apigee Corporation

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

var should = require('should');
var util = require('util');
var config = require('../../../config');
var path = require('path');
var proxyquire =  require('proxyquire').noPreserveCache();
var tmp = require('tmp');
var fs = require('fs');
var helpers = require('../../helpers');
var _ = require('lodash');
var stdin = require('mock-stdin').stdin();
var yaml = require('js-yaml');

/*
 create: create,
 start: start,
 verify: verify,
 edit: edit,
 open: open,
 docs: docs
 */

describe('project', function() {

  var tmpDir;
  var spawn = {};

  before(function(done) {
    tmp.setGracefulCleanup();

    // set up project dir
    tmp.dir({ unsafeCleanup: true }, function(err, path) {
      should.not.exist(err);
      tmpDir = path;
      process.chdir(tmpDir);
      done();
    });
  });


  var capture;
  beforeEach(function() {
    capture = helpers.captureOutput();
  });

  afterEach(function() {
    capture.release();
  });

  var didEdit, didOpen;
  var nodemonOpts = {};
  var projectStubs = {
    'child_process': {
      spawn: function(command, args, options) {
        spawn.command = command;
        spawn.args = args;
        spawn.options = options;

        var ret = {};
        ret.stdout = {
          on: function() {}
        };
        ret.stderr = {
          on: function() {}
        };
        ret.on = function(name, cb) {
          if (name === 'close') {
            setTimeout(function() { cb(0); }, 0);
          }
          return ret;
        };
        return ret;
      }
    },
    'nodemon': {
      on: function(name, cb) {
        if (name === 'start') {
          setTimeout(function() { cb(); nodemonOpts.cb(); }, 0);
        }
        return this;
      },
      _init: function(opts, cb) {
        nodemonOpts = opts;
        nodemonOpts.cb = cb;
      },
      '@noCallThru': true
    },
    './swagger_editor': {
      edit: function(directory, options, cb) {
        didEdit = true;
        cb();
      }
    },
    '../../util/browser': {
      open: function(url, cb) {
        didOpen = true;
        cb();
      }
    },
    '../../util/net': {
      isPortOpen: function(port, cb) {
        cb(null, true);
      }
    }
  };
  var project = proxyquire('../../../lib/commands/project/project', projectStubs);

  describe('create', function() {

    it('should err if project directory already exists', function(done) {
      var name = 'create_err';
      var projPath = path.resolve(tmpDir, name);
      fs.mkdirSync(projPath);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should create a new connect project', function(done) {
      var name = 'create';
      var projPath = path.resolve(tmpDir, name);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, function(err) {
        should.not.exist(err);
        // check a couple of files
        var packageJson = path.resolve(projPath, 'package.json');
        fs.existsSync(packageJson).should.be.ok;
        fs.existsSync(path.resolve(projPath, 'node_modules')).should.not.be.ok;
        fs.existsSync(path.resolve(projPath, '.gitignore')).should.be.ok;

        // check spawn `npm install`
        spawn.command.should.equal('npm');
        spawn.args.should.containEql('install');
        spawn.options.should.have.property('cwd', fs.realpathSync(projPath));

        // check package.json customization
        fs.readFile(packageJson, { encoding: 'utf8' }, function(err, string) {
          if (err) { return cb(err); }
          var project = JSON.parse(string);
          project.name.should.equal(name);
          done();
        });
      });
    });
  });

  describe('start', function() {

    var name = 'start';
    var projPath;

    before(function(done) {
      projPath = path.resolve(tmpDir, name);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, done);
    });

    it('should pass debug options', function(done) {
      var options = { debug: 'true,test' };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.nodeArgs.should.containDeep(['--debug=' + options.debug]);
        done();
      });
    });

    it('should start in debug break mode', function(done) {
      var options = { debugBrk: true };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.nodeArgs.should.containDeep(['--debug-brk']);
        done();
      });
    });

    it('should pass extra arguments', function(done) {
      var options = { nodeArgs: '--harmony' };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.nodeArgs.should.containDeep(['--harmony']);
        done();
      });
    });

    it('should pass multiple extra arguments separately', function(done) {
      var options = { nodeArgs: '--harmony --harmony_destructuring' };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.nodeArgs.should.containDeep(['--harmony', '--harmony_destructuring']);
        done();
      });
    });


    it('should combine extra arguments with debug', function(done) {
      var options = { debug: true, nodeArgs: '--harmony' };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.nodeArgs.should.containDeep(['--debug', '--harmony']);
        done();
      });
    });

    it('should start in mock mode', function(done) {
      var options = { mock: true };
      project.start(projPath, options, function(err) {
        should.not.exist(err);
        nodemonOpts.env.should.containEql({ swagger_mockMode: true });
        done();
      });
    });
  });

  describe('verify', function() {

    describe('no errors', function() {

      var name = 'verifyGood';
      var projPath;

      before(function(done) {
        projPath = path.resolve(tmpDir, name);
        process.chdir(tmpDir);
        project.create(name, { framework: 'connect' }, done);
      });

      it('should emit nothing, return summary', function(done) {

        project.verify(projPath, {}, function(err, reply) {
          should.not.exist(err);

          capture.output().should.equal('');
          reply.should.equal('Results: 0 errors, 0 warnings');
          done();
        })
      });

      it('w/ json option should emit nothing, return nothing', function(done) {

        project.verify(projPath, { json: true }, function(err, reply) {
          should.not.exist(err);

          capture.output().should.equal('');
          reply.should.equal('');
          done();
        })
      })
    });


    describe('with errors', function() {

      var name = 'verifyBad';
      var projPath;

      before(function(done) {
        projPath = path.resolve(tmpDir, name);
        process.chdir(tmpDir);
        project.create(name, { framework: 'connect' }, function(err) {
          should.not.exist(err);
          var sourceFile = path.join(__dirname, 'badswagger.yaml');
          var destFile = path.join(projPath, 'api', 'swagger', 'swagger.yaml');
          helpers.copyFile(sourceFile, destFile, done);
        });
      });

      it('should emit errors, return summary', function(done) {

        project.verify(projPath, {}, function(err, reply) {
          should.not.exist(err);

          capture.output().should.startWith('\nProject Errors\n--------------\n#/swagger:');
          reply.should.startWith('Results:');
          done();
        })
      });

      it('json option should emit as json', function(done) {

        project.verify(projPath, { json: true }, function(err, reply) {
          should.not.exist(err);

          var json = JSON.parse(reply);
          json.should.have.keys('errors', 'warnings')
          json.errors.should.be.an.Array;
          var error = json.errors[0];
          error.should.have.property('code', 'INVALID_TYPE');
          error.should.have.property('message');
          error.should.have.property('path', [ 'swagger' ]);
          error.should.have.property('description', 'The Swagger version of this document.');
          done();
        })
      })
    });
  });

  describe('basic functions', function() {

    var name = 'basic';
    var projPath;

    before(function(done) {
      projPath = path.resolve(tmpDir, name);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, done);
    });

    it('edit should exec editor', function(done) {
      project.edit(projPath, {}, function(err) {
        should.not.exist(err);
        should(didEdit).true;
        done();
      });
    });

    it('edit should exec editor with --silent flag', function(done) {
      project.edit(projPath, {silent: true}, function(err) {
        should.not.exist(err);
        should(didEdit).true;
        done();
      });
    });

    it('edit should exec editor with --host parameter', function(done) {
      project.edit(projPath, {host: 'somehost'}, function(err) {
        should.not.exist(err);
        should(didEdit).true;
        done();
      });
    });

    it('edit should exec editor with --port parameter', function(done) {
      project.edit(projPath, {port: '8080'}, function(err) {
        should.not.exist(err);
        should(didEdit).true;
        done();
      });
    });

    it('open should exec browser', function(done) {
      project.open(projPath, {}, function(err) {
        should.not.exist(err);
        should(didOpen).true;
        done();
      });
    });
  });


  describe('generate-test', function() {

    var name = 'generate-test';
    var projPath;

    before(function(done) {
      projPath = path.resolve(tmpDir, name);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, done);
    });

    it('should err when given invalid test-module options', function(done) {
      var options = { testModule: 'wrong'};
      project.generateTest(projPath, options, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should pass test-module options', function(done) {
      var options = { testModule: 'request'  };
      project.generateTest(projPath, options, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        var packagePath = path.resolve(projPath, 'package.json');
        fs.existsSync(packagePath).should.be.ok;
        var packageJson = require(packagePath);
        packageJson.devDependencies.hasOwnProperty('z-schema').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('request').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('chai').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('mocha').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('dotenv').should.be.ok;
        packageJson.hasOwnProperty('scripts').should.be.ok;
        packageJson.scripts.hasOwnProperty('test').should.be.ok;
        done(err);
      });

    });

    it('should pass assertion format options', function(done) {
      var options = { assertionFormat: 'expect', force: true};
      project.generateTest(projPath, options, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        var packagePath = path.resolve(projPath, 'package.json');
        fs.existsSync(packagePath).should.be.ok;
        var packageJson = require(packagePath);
        packageJson.devDependencies.hasOwnProperty('z-schema').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('request').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('chai').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('mocha').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('dotenv').should.be.ok;
        packageJson.hasOwnProperty('scripts').should.be.ok;
        packageJson.scripts.hasOwnProperty('test').should.be.ok;
        done();
      });
    });


    it('should err when given invalid assertion-format options', function(done) {
      var options = {assertionFormat: 'wrong'};
      project.generateTest(projPath, options, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should generate testing stubs for the project successfully', function(done) {
      var options = {pathName: '.*', force: true};
      project.generateTest(projPath, options, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        var packagePath = path.resolve(projPath, 'package.json');
        fs.existsSync(packagePath).should.be.ok;
        var packageJson = require(packagePath);
        packageJson.devDependencies.hasOwnProperty('z-schema').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('request').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('chai').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('mocha').should.be.ok;
        packageJson.devDependencies.hasOwnProperty('dotenv').should.be.ok;
        packageJson.hasOwnProperty('scripts').should.be.ok;
        packageJson.scripts.hasOwnProperty('test').should.be.ok;
        done();
      });
    });

    it ('should overwrite the existing file with prompt', function(done) {
      fs.appendFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), '/*should not be here*/');

      var prevFile = fs.readFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'});

      setTimeout(function mockResponse() {
        stdin.send('y\n');
        stdin.send('y\n');
      }, 250);

      project.generateTest(projPath, {}, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;

        fs.readFile(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'}, function(err, string) {
          string.should.not.equal(prevFile);
          done(err);
        });
      });
    });

    it ('should not overwrite the existing file with prompt', function(done) {
      var swagger = yaml.load(fs.readFileSync(path.join(projPath, 'api/swagger/swagger.yaml'),
        'utf8'));

      swagger.paths['/test'] = {
        get: {
          responses: {
            '200': {
              description: 'this is a test'
            }
          }
        }
      };

      fs.writeFileSync(path.join(projPath, 'api/swagger/swagger.yaml'), yaml.dump(swagger));

      fs.appendFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), '/*should not be here*/');
      var prevFile = fs.readFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'});

      setTimeout(function () {
        stdin.send('n\n');
        stdin.send('n\n');
      }, 250);

      project.generateTest(projPath, {}, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        fs.existsSync(path.resolve(projPath, 'test/api/client/test-test.js')).should.be.ok;
        fs.readFile(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'}, function(err, string) {
          string.should.equal(prevFile);
          done(err);
        });
      });
    });

    it ('should overwrite the current file and all following with prompt', function(done) {
      fs.appendFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), '/*should not be here*/');
      fs.appendFileSync(path.resolve(projPath, 'test/api/client/test-test.js'), '/*should not be here*/');

      var prevHello = fs.readFileSync(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'});
      var prevTest = fs.readFileSync(path.resolve(projPath, 'test/api/client/test-test.js'), {encoding: 'utf8'});

      process.nextTick(function mockResponse() {
        stdin.send('a\n');
      });

      project.generateTest(projPath, {}, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        fs.existsSync(path.resolve(projPath, 'test/api/client/test-test.js')).should.be.ok;

        fs.readFile(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'}, function(err, string) {
          string.should.not.equal(prevHello);

          fs.readFile(path.resolve(projPath, 'test/api/client/test-test.js'), {encoding: 'utf8'}, function(err, string) {
            string.should.not.equal(prevTest);
            done(err);
          });
        });
      });
    });

    it ('should create load tests from myLoadTest.json', function(done) {
      var loadTargets = {
        "loadTargets": [
          {
            "pathName":"/hello",
            "operation": "get",
            "load": {
              "requests": 1000,
              "concurrent": 100
            }
          }
        ]
      };

      fs.writeFileSync(path.join(projPath, 'myLoadTest.json'), JSON.stringify(loadTargets));

      var options = {loadTest: './myLoadTest.json', force: true};

      project.generateTest(projPath, options, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/test-test.js')).should.be.ok;
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        fs.readFile(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'}, function(err, string) {
          string.search('arete').should.be.ok;
          done(err);
        });
      });
    });

    it ('should create load tests from load-config.json', function(done) {
      var loadTargets = {
        "loadTargets": [
          {
            "pathName":"/hello",
            "operation": "get",
            "load": {
              "requests": 1000,
              "concurrent": 100
            }
          }
        ]
      };

      fs.writeFileSync(path.join(projPath, 'load-config.json'), JSON.stringify(loadTargets));

      var options = {loadTest: true, force: true};

      project.generateTest(projPath, options, function(err) {
        fs.existsSync(path.resolve(projPath, 'test/api/client/test-test.js')).should.be.ok;
        fs.existsSync(path.resolve(projPath, 'test/api/client/hello-test.js')).should.be.ok;
        fs.readFile(path.resolve(projPath, 'test/api/client/hello-test.js'), {encoding: 'utf8'}, function(err, string) {
          string.search('arete').should.be.ok;
          done(err);
        });
      });
    });
  });

});
