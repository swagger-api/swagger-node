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
var path = require('path');
var proxyquire =  require('proxyquire').noPreserveCache();
var tmp = require('tmp');
var fs = require('fs');
var config = require('../../../config/index');
var request = require('superagent');
var Url = require('url');

var projectStubs = {
  'child_process': {
    spawn: function(command, args, options) {
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
};
var project = proxyquire('../../../lib/commands/project/project', projectStubs);

var SWAGGER_EDITOR_LOAD_PATH = '/editor/spec';                // swagger-editor expects to GET the file here
var SWAGGER_EDITOR_SAVE_PATH = '/editor/spec';                // swagger-editor PUTs the file back here

describe('swagger editor', function() {

  var name = 'basic';
  var projPath;
  var swaggerFile;
  var baseUrl;
  var hostname;
  var port;

  before(function(done) {
    tmp.setGracefulCleanup();
    tmp.dir({ unsafeCleanup: true }, function(err, dir) {
      should.not.exist(err);
      var tmpDir = dir;
      process.chdir(tmpDir);

      projPath = path.resolve(tmpDir, name);
      swaggerFile = path.resolve(projPath, config.swagger.fileName);
      process.chdir(tmpDir);
      project.create(name, { framework: 'connect' }, done);
    });
  });

  var editorStubs = {
    '../../util/browser': {
      open: function(editorUrl, cb) {
        var url = Url.parse(editorUrl);
        url.hash = null;
        url.query = null;
        baseUrl = Url.format(url);
        hostname = url.hostname;
        port = url.port;
        cb(new Error());
      }
    }
  };
  var editor = proxyquire('../../../lib/commands/project/swagger_editor', editorStubs);

  it('should be able to load swagger', function(done) {
    var fileContents = fs.readFileSync(swaggerFile, 'utf8');

    project.read(projPath, {}, function(err, project) {
      if (err) { cb(err); }

      editor.edit(project, {}, function() {
        var url = Url.resolve(baseUrl, SWAGGER_EDITOR_LOAD_PATH);
        request
          .get(url)
          .buffer()
          .end(function(err, res) {
            should.not.exist(err);
            res.status.should.eql(200);
            res.text.should.equal(fileContents);
            done();
          });
      });
    });
  });

  it('should be able to run on a custom host and port', function(done) {
    var fileContents = fs.readFileSync(swaggerFile, 'utf8');

    project.read(projPath, {}, function(err, project) {
      if (err) {
        cb(err);
      }

      editor.edit(project, { host: 'localhost', port: '1234' }, function () {
        hostname.should.equal('localhost');
        port.should.equal('1234');
        done();
      });
    });
  });

  it('should be able to save swagger', function(done) {
    var url = Url.resolve(baseUrl, SWAGGER_EDITOR_SAVE_PATH);
    request
      .put(url)
      .send('success!')
      .end(function(err, res) {
        should.not.exist(err);
        res.status.should.eql(200);

        var fileContents = fs.readFileSync(swaggerFile, 'utf8');
        fileContents.should.equal('success!');

        done();
      });
  });
});
