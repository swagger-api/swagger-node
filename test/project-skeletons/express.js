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

var should = require('should');
var request = require('supertest');
var tmp = require('tmp');
var path = require('path');
var project = require('../../lib/commands/project/project');
var debug = require('debug')('swagger');

var framework = 'express';
var name = framework;
var tmpDir, projPath, server;

describe(framework + ' project', function() {

  before(function(done) {
    this.timeout(30000);

    tmp.setGracefulCleanup();

    // set up project dir
    tmp.dir({ unsafeCleanup: true }, function(err, reply) {
      should.not.exist(err);
      tmpDir = reply;
      process.chdir(tmpDir);

      projPath = path.resolve(tmpDir, framework);
      process.chdir(tmpDir);
      project.create(name, { framework: framework }, function(err) {
        should.not.exist(err);

        require('./helpers').freePort(function(err, port) {
          should.not.exist(err);
          process.env.PORT = port;
          server = require(projPath + '/app.js');
          done();
        });
      });
    });
  });

  it('should run test', function(done) {
    project.test(projPath, {}, function(err, failures) {
      should.not.exist(err);
      failures.should.eql(0);
      done();
    });
  });

  describe('/hello should respond', function() {

    it('without query param', function(done) {
      request(server)
        .get('/hello')
        .end(function(err, res) {
          should.not.exist(err);
          debug('Result: %s %j', res.text, res.headers);

          res.status.should.eql(200);
          res.body.should.eql('Hello, stranger!');

          done();
        });
    });

    it('with query param', function(done) {
      request(server)
        .get('/hello')
        .query({ name: 'Scott' })
        .end(function(err, res) {
          should.not.exist(err);
          debug('Result: %s %j', res.text, res.headers);

          res.status.should.eql(200);
          res.body.should.eql('Hello, Scott!');

          done();
        });
    });
  });
});
