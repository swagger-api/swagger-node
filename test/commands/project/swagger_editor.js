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
